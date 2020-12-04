import h from "@macrostrat/hyper";
import { select, event } from "d3-selection";
import { drag } from "d3-drag";
import { findDOMNode } from "react-dom";
import { StatefulComponent } from "@macrostrat/ui-components";
import { ComponentProps, useCallback } from "react";

import { AnnotationsEditorHotkeys } from "./hotkeys";
import { AnnotationLinks } from "../annotation-links";
import { AnnotationTypeSelector } from "./type-selector";

// This context is a bit outmoded
import { EditorContext } from "../context";

import { EditMode } from "~/enum";
import { ModalNotifications } from "./notifications";
import { AnnotationsOverlay } from "../annotations";
import { SimpleAnnotation, Annotation } from "../annotation";
import {
  AnnotationsContext,
  AnnotationEditorCtxProvider,
  useAnnotationActions,
  useAnnotationEditor,
  useSelectedAnnotation,
  useSelectionUpdater,
  useCanvasSize,
  Tag,
  AnnotationArr,
  AnnotationActions,
  Annotation as IAnnotation,
  AnnotationID,
} from "~/providers";

import "./main.styl";

const { ADD_PART, LINK } = EditMode;
const SHIFT_MODES = new Set([LINK, ADD_PART]);

interface AddAnnotationsProps extends ComponentProps<AnnotationsOverlay> {
  inProgressAnnotation?: IAnnotation;
}
const AddAnnotationsOverlay = (props: AddAnnotationsProps) => {
  const { inProgressAnnotation, ...rest } = props;
  let children = null;
  if (inProgressAnnotation != null) {
    const obj = { ...inProgressAnnotation };
    children = h(SimpleAnnotation, { obj });
  }

  const renderAnnotation = useCallback((obj: IAnnotation, ix: number) => {
    return h(Annotation, { key: ix, obj, index: ix });
  }, []);

  return h(
    AnnotationsOverlay,
    {
      ...rest,
      renderAnnotation,
    },
    children
  );
};

function EditorContextForwarder(props) {
  /** Modifies the annotation editor context to support multipart editing */
  const ctx = useAnnotationEditor();
  const { editModes, children, setMode } = props;
  const { addLink, selectAnnotation } = ctx.actions;

  const newSelectAnnotation = useCallback(
    (id: AnnotationID) => {
      // TODO: this is currently broken, which prevents us from properly linking tags
      // Make sure we don't activate the
      // general click or drag handlers
      if (editModes.has(LINK)) {
        addLink(id);
        setMode(LINK, false);
      } else {
        selectAnnotation(id);
      }
    },
    [editModes, selectAnnotation, setMode, addLink]
  );

  const newActions = { ...ctx.actions, selectAnnotation: newSelectAnnotation };
  const newCtx = { ...ctx, actions: newActions };

  return h(AnnotationEditorCtxProvider, { value: newCtx }, children);
}

interface Props {
  clickDistance: number;
  editingEnabled: boolean;
  selectIsOpen: boolean;
  lockedTags: Set<Tag>;
  actions: AnnotationActions;
}
interface State {
  shiftKey: boolean;
  inProgressAnnotation: AnnotationArr | null;
}

class ImageOverlay extends StatefulComponent<Props, State> {
  static defaultProps = {
    // Distance we take as a click before switching to drag
    clickDistance: 10,
    editingEnabled: true,
    selectIsOpen: false,
    lockedTags: new Set([]),
  };
  static contextType = AnnotationsContext;
  constructor(props) {
    super(props);

    this.contextValue = this.contextValue.bind(this);
    this.setMode = this.setMode.bind(this);
    this.editModes = this.editModes.bind(this);
    this.shiftKeyDown = this.shiftKeyDown.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.deleteAnnotation = this.deleteAnnotation.bind(this);
    this.handleAddAnnotation = this.handleAddAnnotation.bind(this);
    this.disableEditing = this.disableEditing.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);
    this.handleShift = this.handleShift.bind(this);
    this.closeSelector = this.closeSelector.bind(this);

    this.state = {
      inProgressAnnotation: null,
      editModes: new Set(),
      shiftKey: false,
      clickingInRect: null,
      selectIsOpen: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.editingRect === this.props.editingRect) {
      return;
    }
    if (nextProps.editingRect != null) {
      return;
    }
    return this.updateState({ editModes: { $set: new Set() } });
  }

  renderInterior() {
    const { selectIsOpen, inProgressAnnotation } = this.state;

    return h(
      AnnotationsEditorHotkeys,
      {
        onShiftKeyDown: this.shiftKeyDown,
        onToggleSelect: this.toggleSelect,
        onDeleteAnnotation: this.deleteAnnotation,
      },
      [
        h(AnnotationTypeSelector, {
          isOpen: selectIsOpen,
          onClose: this.closeSelector,
        }),
        h(AddAnnotationsOverlay, {
          inProgressAnnotation,
          onClick: this.disableEditing,
        }),
        h(AnnotationLinks),
        h(ModalNotifications),
      ]
    );
  }

  closeSelector() {
    this.setState({ selectIsOpen: false });
  }

  shiftKeyDown() {
    this.setState({ shiftKey: true });
  }

  deleteAnnotation() {
    const ix = this.context.annotations.indexOf(this.props.editingRect);
    this.props.actions.deleteAnnotation(ix);
  }

  editModes() {
    let { editModes, shiftKey } = this.state;
    if (shiftKey) {
      editModes = SHIFT_MODES;
    }
    return editModes;
  }

  contextValue() {
    const { actions } = this.props;
    let { shiftKey } = this.state;
    actions.setMode = this.setMode;

    return {
      editModes: this.editModes(),
      shiftKey,
      actions: {
        toggleSelect: this.toggleSelect,
        setMode: this.setMode,
      },
      //update: this.updateState,
    };
  }

  setMode(mode, val) {
    if (val == null) {
      val = !this.state.editModes.has(mode);
    }
    const action = val ? "$add" : "$remove";
    this.updateState({ editModes: { [action]: [mode] } });
  }

  render() {
    return h(
      EditorContext.Provider,
      { value: this.contextValue() },
      h(
        EditorContextForwarder,
        { editModes: this.editModes(), setMode: this.setMode },
        this.renderInterior()
      )
    );
  }

  handleDrag() {
    const { subject } = event;
    let { x, y } = subject;
    const annotations: Annotation[] = this.context;
    let {
      clickDistance,
      editingRect,
      currentTag,
      scaleFactor,
      editingEnabled,
      lockedTags,
      image_tags, // TODO: replace this with AnnotationsContext.annotation
    } = this.props;
    if (!editingEnabled) {
      return;
    }
    if (lockedTags.has(currentTag)) {
      throw "Attempting to create a locked tag";
    }

    // Make sure we color with the tag this will be
    const editModes = this.editModes();
    if (editModes.has(ADD_PART) && editingRect != null) {
      currentTag = editingRect.tag_id;
    }

    if (scaleFactor == null) {
      scaleFactor = 1;
    }
    let width = event.x - x;
    let height = event.y - y;
    if (width < 0) {
      width *= -1;
      x -= width;
    }
    if (height < 0) {
      height *= -1;
      y -= height;
    }
    if (width < clickDistance || height < clickDistance) return;
    // Shift to image coordinates from pixel coordinates
    x *= scaleFactor;
    y *= scaleFactor;
    width *= scaleFactor;
    height *= scaleFactor;

    // We are adding a new annotation
    const boxes = [[x, y, x + width, y + height]];
    const rect = { boxes, tag_id: currentTag };

    this.setState({ inProgressAnnotation: rect, clickingInRect: null });
  }

  handleAddAnnotation() {
    const { actions, editingRect } = this.props;
    const { inProgressAnnotation: r } = this.state;
    this.setState({ inProgressAnnotation: null });
    if (r == null) {
      return;
    }
    const editModes = this.editModes();
    const ix = this.context.annotations.indexOf(editingRect);

    if (editModes.has(ADD_PART) && editingRect != null) {
      // We are adding a box to the currently
      // selected annotation
      const fn = actions.updateAnnotation(ix);
      fn({ boxes: { $push: r.boxes } });
      // Disable linking mode
    } else {
      actions.appendAnnotation(r);
    }
    return this.setMode(ADD_PART, false);
  }

  disableEditing() {
    const { editingRect, updateSelection } = this.props;
    if (editingRect == null) {
      return;
    }
    return updateSelection(null);
  }

  toggleSelect() {
    console.log("Opening select box");
    return this.setState({ selectIsOpen: true });
  }

  handleShift(val) {
    return () => {
      return this.setState({ shiftKey: val });
    };
  }

  componentDidMount() {
    const el = select(findDOMNode(this));

    // Set up dragging when rectangle is not clicked
    this.edgeDrag = drag()
      .on("drag", this.handleDrag)
      .on("end", this.handleAddAnnotation)
      .clickDistance(this.props.clickDistance);

    el.call(this.edgeDrag);

    return select(document).on("keyup", (d) => {
      if (this.state.shiftKey && !event.shiftKey) {
        return this.handleShift(false)();
      }
    });
  }
}

const WrappedImageOverlay = (props) => {
  // Get editing actions into the props
  const actions = useAnnotationActions();
  const { scaleFactor } = useCanvasSize();
  const { currentTag } = useAnnotationEditor();
  const editingRect = useSelectedAnnotation();
  const updateSelection = useSelectionUpdater();
  return h(ImageOverlay, {
    ...props,
    editingRect,
    updateSelection,
    currentTag,
    scaleFactor,
    actions,
  });
};

export { WrappedImageOverlay as ImageOverlay };
