import h from "react-hyperscript";
import { createContext, useContext } from "react";
import {
  AnnotationsContext,
  Annotation,
  AnnotationRect,
  SelectionUpdateContext,
} from "./annotations";
import { TagsContext } from "./tags";
import { isDifferent } from "./util";
import uuidv4 from "uuid/v4";
import { StatefulComponent } from "@macrostrat/ui-components";
import { Spec } from "immutability-helper";

type AnnotationID = number;
type UpdateSpec = object;
type TagUpdater = (s: UpdateSpec) => void;

export interface EditorActions {
  saveChanges(): void;
  clearChanges(): void;
}

export interface AnnotationActions {
  appendAnnotation(r: Annotation): void;
  deleteAnnotation(i: AnnotationID): void;
  selectAnnotation(i: AnnotationID): void;
  updateAnnotation(i: AnnotationID): TagUpdater;
  addLink(i: AnnotationID): void;
  toggleTagLock(i: TagID): () => void;
  updateCurrentTag(i: TagID): () => void;
  // This should not be passed through...
  //updateState(spec: UpdateSpec): void
}

interface AnnotationEditorCtx {
  actions: AnnotationActions;
  editorActions: EditorActions;
  initialAnnotations: Annotation[];
  hasChanges: boolean;
  currentTag: TagID;
  lockedTags: Set<TagID>;
}
const AnnotationEditorContext = createContext<AnnotationEditorCtx | null>(null);
interface AnnotationProviderProps extends AnnotationEditorCtx {
  children?: React.ReactNode;
}

interface AnnotationEditorProps {
  initialAnnotations: Annotation[];
  onSave: (arr: Annotation[]) => void;
  editingEnabled: boolean;
}

interface AnnotationEditorState {
  selectedAnnotation: AnnotationID;
  annotations: Annotation[];
  currentTag: TagID;
  lockedTags: Set<TagID>;
}

function AnnotationEditorCtxProvider({ value, children }) {
  return h(
    AnnotationEditorContext.Provider,
    { value },
    h(
      SelectionUpdateContext.Provider,
      { value: value?.actions.selectAnnotation },
      children
    )
  );
}

// Updates props for a rectangle
// from API signature to our internal signature
// TODO: make handle multiple boxes
class AnnotationEditorProvider extends StatefulComponent<
  AnnotationEditorProps,
  AnnotationEditorState
> {
  /**
  A more advanced annotation provider that allows for
  adding, removing, and editing the positions of annotations.

  It allows certain tags to be locked to prevent selection.
  It does NOT allow the creation of multipart tags.
  */
  static defaultProps = {
    initialAnnotations: [],
    editingEnabled: true,
  };
  static contextType = TagsContext;
  actions: AnnotationActions;
  editorActions: EditorActions;
  constructor(props: AnnotationEditorProps) {
    super(props);
    this.state = {
      annotations: props.initialAnnotations ?? [],
      selectedAnnotation: -1,
      currentTag: null,
      lockedTags: new Set(),
    };
    this.updateAnnotation = this.updateAnnotation.bind(this);
    this.addLink = this.addLink.bind(this);
    this.updateCurrentTag = this.updateCurrentTag.bind(this);
    this.selectAnnotation = this.selectAnnotation.bind(this);
    this.appendAnnotation = this.appendAnnotation.bind(this);
    this.toggleTagLock = this.toggleTagLock.bind(this);
    this.deleteAnnotation = this.deleteAnnotation.bind(this);
    this.clearChanges = this.clearChanges.bind(this);
    this.saveAnnotations = this.saveAnnotations.bind(this);

    this.actions = {
      // It sucks we have to bind all of these separately...
      updateAnnotation: this.updateAnnotation,
      addLink: this.addLink,
      updateCurrentTag: this.updateCurrentTag,
      selectAnnotation: this.selectAnnotation,
      appendAnnotation: this.appendAnnotation,
      toggleTagLock: this.toggleTagLock,
      deleteAnnotation: this.deleteAnnotation,
    };

    this.editorActions = {
      clearChanges: this.clearChanges,
      saveChanges: this.saveAnnotations,
    };
  }

  updateAnnotation(i) {
    return (updateSpec: Spec) => {
      const spec = { annotations: { [i]: updateSpec } };
      if (updateSpec.tag_id != null) {
        spec.currentTag = updateSpec.tag_id;
      }
      this.updateState(spec);
    };
  }

  addLink(i: AnnotationID) {
    // Add a link to another annotation
    const { selectedAnnotation, annotations } = this.state;
    const { image_tag_id } = annotations[i];
    if (selectedAnnotation == null) {
      throw "Annotation must be selected to add a link";
    }
    if (selectedAnnotation === i) {
      throw "Cannot create self-referential link";
    }
    const spec = {
      annotations: {
        [selectedAnnotation]: { linked_to: { $set: image_tag_id } },
      },
    };
    this.updateState(spec);
  }

  deleteAnnotation(i: number) {
    const { annotations, selectedAnnotation } = this.state;
    const spec: Spec = {
      annotations: { $splice: [[i, 1]] },
    };
    if (selectedAnnotation != null && i === selectedAnnotation) {
      spec.selectedAnnotation = { $set: null };
    }
    // Zero out links to this annotation
    const { image_tag_id } = annotations[selectedAnnotation];
    for (i = 0; i < annotations.length; i++) {
      const rect = annotations[i];
      if (rect.linked_to !== image_tag_id) {
        continue;
      }
      spec.annotations[i] = { linked_to: { $set: null } };
    }
    this.updateState(spec);
  }

  updateCurrentTag(tag_id: TagID) {
    return () => {
      console.log(`Current tag: ${tag_id}`);
      return this.updateState({ currentTag: { $set: tag_id } });
    };
  }

  selectAnnotation(i: AnnotationID) {
    console.log(`Selecting annotation ${i}`);
    if (i == null) return;
    return this.updateState({ selectedAnnotation: { $set: i } });
  }

  appendAnnotation(rect: Annotation) {
    if (rect == null) {
      return;
    }
    const { currentTag, annotations } = this.state;

    rect.tag_id = currentTag ?? this.context[0]?.tag_id;
    // Create UUID on client side to allow
    // creation of tag links
    rect.image_tag_id = uuidv4();
    this.updateState({
      annotations: { $push: [rect] },
      selectedAnnotation: { $set: annotations.length },
    });
  }

  toggleTagLock(tagId: TagID) {
    return () => {
      const tagStore: Tag[] = this.context;
      const { currentTag, lockedTags } = this.state;

      if (lockedTags.has(tagId)) {
        lockedTags.delete(tagId);
      } else {
        lockedTags.add(tagId);
      }

      // Check if locked and then get next unlocked tag
      let ix = tagStore.findIndex((d) => d.tag_id === currentTag);
      let forward = true;
      while (lockedTags.has(tagStore[ix].tag_id)) {
        ix += forward ? 1 : -1;
        if (ix > tagStore.length - 1) {
          forward = false;
          ix -= 1;
        }
        if (ix < 0) {
          forward = true;
        }
      }

      const nextTag = tagStore[ix].tag_id;
      const spec = { lockedTags: { $set: lockedTags } };
      if (nextTag !== currentTag) {
        spec.currentTag = { $set: nextTag };
      }
      this.updateState(spec);
    };
  }

  clearChanges() {
    const { initialAnnotations } = this.props;
    this.updateState({
      annotations: { $set: initialAnnotations },
      selectedAnnotation: { $set: null },
    });
  }

  saveAnnotations() {
    const { annotations } = this.state;
    self.props.onSave?.(annotations);
  }

  render() {
    const { children, initialAnnotations, editingEnabled } = this.props;
    const { annotations, selectedAnnotation, lockedTags } = this.state;
    const hasChanges = isDifferent(initialAnnotations, annotations);

    const currentTag = this.state.currentTag ?? this.context[0]?.tag_id;

    let editorContext = {
      actions: this.actions,
      editorActions: this.editorActions,
      hasChanges,
      initialAnnotations,
      lockedTags,
      currentTag,
    };
    if (!editingEnabled) editorContext = null;

    const annotationsContext = {
      annotations,
      allowSelection: true,
      selected: selectedAnnotation,
    };

    return h(
      AnnotationsContext.Provider,
      { value: annotationsContext },
      h(
        AnnotationEditorCtxProvider,
        { value: editingEnabled ? editorContext : null },
        children
      )
    );
  }

  componentDidUpdate() {
    const firstTag = this.context[0]?.tag_id;
    if (this.state.currentTag == null && firstTag != null) {
      this.setState({ currentTag: firstTag });
    }
  }
}

const useAnnotationEditor = () => useContext(AnnotationEditorContext);
const useAnnotationActions = () => useAnnotationEditor()?.actions;
const useEditorActions = () => useAnnotationEditor()?.editorActions;

const useAnnotationUpdater = (ann: Annotation) => {
  const { annotations, selected } = useContext(AnnotationsContext);
  const isSelected = ann == annotations[selected];
  const { updateAnnotation } = useAnnotationActions()!;
  if (!isSelected) return null;
  return updateAnnotation(selected);
};

export {
  AnnotationEditorProvider,
  AnnotationEditorCtxProvider,
  AnnotationEditorContext,
  useAnnotationEditor,
  useAnnotationActions,
  useAnnotationUpdater,
  useEditorActions,
};
