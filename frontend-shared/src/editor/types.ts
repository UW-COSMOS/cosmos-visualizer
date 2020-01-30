import {TagRect} from '../image-overlay/types'

type TagID = number;
type UpdateSpec = object;
type TagUpdater = (s: UpdateSpec)=>void

export interface AnnotationActions {
  appendAnnotation(r: TagRect): void,
  deleteAnnotation(i: TagID): void,
  selectAnnotation(i: TagID): ()=>void,
  updateAnnotation(i: TagID): TagUpdater,
  addLink(i: TagID): ()=>void,
  toggleTagLock(i: TagID): ()=>void,
  updateCurrentTag(i: TagID): ()=>void,
  // This should not be passed through...
  //updateState(spec: UpdateSpec): void
}
