import h from "@macrostrat/hyper";
import { select, event } from "d3-selection";
import { drag } from "d3-drag";
import { findDOMNode } from "react-dom";
import { StatefulComponent } from "@macrostrat/ui-components";
import { ComponentProps } from "react";

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
  AnnotationEditorContext,
  SelectionUpdateContext,
  useAnnotationActions,
  useAnnotationEditor,
  useSelectedAnnotation,
  useSelectionUpdater,
  useCanvasSize,
  Tag,
  AnnotationArr,
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

  const renderAnnotation = (obj: IAnnotation, ix: number) => {
    return h(Annotation, { key: ix, obj, locked: false });
  };

  return h(
    AnnotationsOverlay,
    {
      ...rest,
      renderAnnotation,
    },
    children
  );
};

interface Props {
  clickDistance: number;
  editingEnabled: boolean;
  selectIsOpen: boolean;
  lockedTags: Set<Tag>;
}
interface State {
  inProgressAnnotation: AnnotationArr | null;
}

function EditorContextForwarder(props) {
  /** Modifies the annotation editor context to support multipart editing */
  const updateSelection = useSelectionUpdater();
  const { editModes, children } = props;

  function selectAnnotation(id: AnnotationID) {
    // TODO: this is currently broken, which prevents us from properly linking tags
    return (event) => {
      const { actions } = ctx;
      // Make sure we don't activate the
      // general click or drag handlers
      console.log(event, id, editModes);
      if (editModes.has(LINK)) {
        ctx.actions.addLink(id)();
        return ctx.actions.setMode(LINK, false);
      } else {
        return updateSelection(id)();
      }
    };
  }

  return h(
    SelectionUpdateContext.Provider,
    { value: selectAnnotation },
    children
  );
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
    this.handleDrag = this.handleDrag.bind(this);
    this.handleAddAnnotation = this.handleAddAnnotation.bind(this);
    this.disableEditing = this.disableEditing.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);
    this.handleShift = this.handleShift.bind(this);
    this.state = {
      inProgressAnnotation: null,
      editModes: new Set(),
      shiftKey: false,
      clickingInRect: null,
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
    const { tags, currentTag, lockedTags, actions, editingRect } = this.props;
    const { selectIsOpen, inProgressAnnotation } = this.state;

    const onClick = this.disableEditing;

    return h(
      AnnotationsEditorHotkeys,
      {
        editingRect,
        onShiftKeyDown: this.handleShift(true),
        onToggleSelect: this.toggleSelect,
        onDeleteAnnotation: this.deleteAnnotation,
      },
      [
        h(AnnotationTypeSelector, {
          isOpen: selectIsOpen,
          onClose: () => this.setState({ selectIsOpen: false }),
        }),
        h(AddAnnotationsOverlay, {
          inProgressAnnotation,
          actions,
          onClick,
          toggleSelect: this.toggleSelect,
          onSelectAnnotation: this.selectAnnotation,
        }),
        h(AnnotationLinks),
        h(ModalNotifications),
      ]
    );
  }

  contextValue() {
    const { actions, tags, currentTag } = this.props;
    let { editModes, shiftKey } = this.state;
    if (shiftKey) {
      editModes = SHIFT_MODES;
    }
    actions.setMode = this.setMode;

    return {
      tags,
      currentTag,
      editModes,
      shiftKey,
      actions: {
        toggleSelect: this.toggleSelect,
        ...actions,
      },
      update: this.updateState,
    };
  }

  setMode(mode, val) {
    if (val == null) {
      val = !this.state.editModes.has(mode);
    }
    const action = val ? "$add" : "$remove";
    return this.updateState({ editModes: { [action]: [mode] } });
  }

  render() {
    return h(
      EditorContextForwarder,
      { editModes: this.state.editModes },
      h(
        EditorContext.Provider,
        { value: this.contextValue() },
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
    const { editModes } = this.contextValue();
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
    const { editModes } = this.contextValue();

    if (editModes.has(ADD_PART) && editingRect != null) {
      // We are adding a box to the currently
      // selected annotation
      const fn = actions.updateAnnotation(editingRect);
      fn({ boxes: { $push: r.boxes } });
      // Disable linking mode
    } else {
      actions.appendAnnotation(r);
    }
    return this.setMode(ADD_PART, false);
  }

  disableEditing() {
    const { actions, editingRect, updateSelection } = this.props;
    if (editingRect == null) {
      return;
    }
    return updateSelection(null);
  }

  toggleSelect = () => {
    console.log("Opening select box");
    return this.setState({ selectIsOpen: true });
  };

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
