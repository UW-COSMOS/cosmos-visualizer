import h from 'react-hyperscript'
import {createContext} from 'react'
import {
  AnnotationsContext,
  Annotation,
  AnnotationRect,
  SelectionUpdateContext
} from './annotations'
import {TagID, Tag, TagsContext} from './tags'
import {isDifferent} from './util'
import uuidv4 from 'uuid/v4';
import {StatefulComponent} from '@macrostrat/ui-components';
import {Spec} from 'immutability-helper'

type AnnotationID = number;
type UpdateSpec = object;
type TagUpdater = (s: UpdateSpec)=>void

export interface AnnotationActions {
  appendAnnotation(r: Annotation): void,
  deleteAnnotation(i: AnnotationID): void,
  selectAnnotation(i: AnnotationID): ()=>void,
  updateAnnotation(i: AnnotationID): TagUpdater,
  addLink(i: AnnotationID): ()=>void,
  toggleTagLock(i: TagID): ()=>void,
  updateCurrentTag(i: TagID): ()=>void,
  // This should not be passed through...
  //updateState(spec: UpdateSpec): void
}

interface AnnotationEditorCtx {
  actions: AnnotationActions|null,
  initialAnnotations: Annotation[],
  hasChanges: boolean
}
const AnnotationEditorContext = createContext<AnnotationEditorCtx>(null)
interface AnnotationProviderProps extends AnnotationEditorCtx {
  children?: React.ReactNode
}

interface AnnotationEditorProps {
  initialAnnotations: Annotation[],
  onSaveTags: (arr: Annotation[])=> void,
  onClearChanges: ()=>void
}

interface AnnotationEditorState {
  selectedAnnotation: AnnotationID,
  annotations: Annotation[],
  currentTag: TagID,
  lockedTags: Set<TagID>
}

// Updates props for a rectangle
// from API signature to our internal signature
// TODO: make handle multiple boxes
class AnnotationEditorProvider extends StatefulComponent<AnnotationEditorProps, AnnotationEditorState> {
  /**
  A more advanced annotation provider that allows for
  adding, removing, and editing the positions of annotations.
  */
  static defaultProps = {
    initialAnnotations: [],
    editingEnabled: true,
    navigationEnabled: true
  };
  static contextType = TagsContext;
  constructor(props: AnnotationEditorProps){
    super(props);
    this.state = {
      annotations: props.initialAnnotations ?? [],
      selectedAnnotation: 0,
      currentTag: 0,
      lockedTags: new Set(),
    };
  }

  currentTag() {
    return this.state.currentTag ?? this.context[0]?.tag_id
  }

  updateAnnotation(i){ return (updateSpec: Spec)=> {
    const spec = {annotations: {[i]: updateSpec}};
    if (updateSpec.tag_id != null) {
      spec.currentTag = updateSpec.tag_id;
    }
    return this.updateState(spec);
  }; }

  addLink(i: AnnotationID){ return () => {
    // Add a link to another annotation
    const {selectedAnnotation, annotations} = this.state;
    const {image_tag_id} = annotations[i];
    if ((selectedAnnotation == null)) {
      throw "Annotation must be selected to add a link";
    }
    if (selectedAnnotation === i) {
      throw "Cannot create self-referential link";
    }
    const spec = {
      annotations: {[selectedAnnotation]: {linked_to: {$set: image_tag_id}}}
    };
    return this.updateState(spec);
  }; }

  deleteAnnotation = (i: number) => {
    const {annotations, selectedAnnotation} = this.state;
    const spec: Spec = {
      annotations: {$splice: [[i,1]]}
    };
    if ((selectedAnnotation != null) && (i === selectedAnnotation)) {
      spec.selectedAnnotation = {$set: null};
    }
    // Zero out links to this annotation
    const {image_tag_id} = annotations[selectedAnnotation];
    for (i = 0; i < annotations.length; i++) {
      const rect = annotations[i];
      if (rect.linked_to !== image_tag_id) { continue; }
      spec.annotations[i] = {linked_to: {$set: null}};
    }
    return this.updateState(spec);
  };

  updateCurrentTag(tag_id: TagID){ return () => {
    console.log(`Current tag: ${tag_id}`);
    return this.updateState({currentTag: {$set: tag_id}});
  }; }

  selectAnnotation(i: AnnotationID){ return () => {
    console.log(`Selecting annotation ${i}`);
    return this.updateState({selectedAnnotation: {$set: i}});
  }; }

  appendAnnotation(rect: Annotation){
    if (rect == null) { return; }
    const {currentTag, annotations} = this.state;
    rect.tag_id = currentTag;
    // Create UUID on client side to allow
    // linking
    rect.image_tag_id = uuidv4();
    return this.updateState({
      annotations: {$push: [rect]},
      selectedAnnotation: {$set: annotations.length}
    });
  }

  toggleTagLock(tagId: TagID){ return () => {
    const tagStore: Tag[] = this.context;
    const {currentTag, lockedTags} = this.state;

    if (lockedTags.has(tagId)) {
      lockedTags.delete(tagId);
    } else {
      lockedTags.add(tagId);
    }

    // Check if locked and then get next unlocked tag
    let ix = tagStore.findIndex(d => d.tag_id===currentTag);
    let forward = true;
    while (lockedTags.has(tagStore[ix].tag_id)) {
      ix += forward ? 1 : -1;
      if (ix > (tagStore.length-1)) {
        forward = false;
        ix -= 1;
      }
      if (ix < 0) {
        forward = true;
      }
    }

    const nextTag = tagStore[ix].tag_id;
    const spec = {lockedTags: {$set: lockedTags}};
    if (nextTag !== currentTag) {
      spec.currentTag = {$set: nextTag};
    }
    return this.updateState(spec);
  }; }

  clearChanges() {
    const {initialAnnotations} = this.props;
    return this.updateState({
      annotations: {$set: initialAnnotations},
      selectedAnnotation: {$set: null}
    });
  }

  render() {
    const {children, initialAnnotations} = this.props;
    const {
      annotations,
      selectedAnnotation,
    } = this.state;
    const hasChanges = isDifferent(initialAnnotations, annotations);

    const actions: AnnotationActions = {
      updateAnnotation: this.updateAnnotation.bind(this),
      addLink: this.addLink.bind(this),
      updateCurrentTag: this.updateCurrentTag.bind(this),
      selectAnnotation: this.selectAnnotation.bind(this),
      appendAnnotation: this.appendAnnotation.bind(this),
      toggleTagLock: this.toggleTagLock.bind(this),
      deleteAnnotation: this.deleteAnnotation.bind(this)
    }

    // Update function for immutability

    const value = {
      annotations,
      allowSelection: true,
      selected: selectedAnnotation,
    }

    const {selectAnnotation} = actions;


    return h(AnnotationsContext.Provider, {value}, [
      h(AnnotationEditorContext.Provider, {value: {actions, hasChanges, initialAnnotations}}, [
        h(SelectionUpdateContext.Provider, {value: selectAnnotation}, children)
      ])
    ])
  }
}


export {AnnotationEditorProvider, AnnotationEditorContext};
