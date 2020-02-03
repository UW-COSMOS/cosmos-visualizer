/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';
import {SimpleAnnotation, Annotation , LockedAnnotation} from './annotation';

import {EditMode} from '../enum';
import {AnnotationActions} from '~/providers/annotation-editor'
import {
  useCanvasSize,
  useAnnotations,
  useSelectedAnnotation,
  useSelectionUpdater,
  Annotation as IAnnotation,
  Tag as ITag
} from '~/providers'

interface AnnotationsOverlayProps {
  inProgressAnnotation: IAnnotation|null,
  actions: AnnotationActions,
  lockedTags: Set<string>,
  toggleSelect: ()=>void,
  onSelectAnnotation: (ix: number)=> ()=>void,
  // Function to render a single annotation
  renderAnnotation(d: IAnnotation, ix: number): React.ReactNode
  onClick: ()=>void
  tags: ITag[],
  children: React.ReactNode
}

const AnnotationsOverlay = (props: AnnotationsOverlayProps)=>{
  let {onClick, children} = props;
  const annotations = useAnnotations()
  const {width, height} = useCanvasSize()
  return h('div.overlay',
    {style: {width, height}, onClick}, [
    annotations.map(props.renderAnnotation),
    children
  ])
}

AnnotationsOverlay.defaultProps = {
  renderAnnotation: (obj, ix)=>h(SimpleAnnotation, {obj, ix})
}

interface AddAnnotationsProps extends AnnotationsOverlayProps {
  inProgressAnnotation?: IAnnotation
}

const AddAnnotationsOverlay = (props: AddAnnotationsProps)=>{
  const {inProgressAnnotation, ...rest} = props

  let children = null
  if (inProgressAnnotation != null) {
    children = h(SimpleAnnotation, {obj: inProgressAnnotation})
  }

  return h(AnnotationsOverlay, rest, children)
}

const oldRenderer = (d, ix)=> {

  const isLocked = lockedTags.has(d.tag_id);
  if (isLocked) {
    return h(LockedAnnotation, {tags, obj: d});
  }

  const isSelected = (d == selected) && !isLocked;


  let opts = {
    key: ix,
    obj: d,
    locked: isLocked,
  };

  if (isSelected) {
    return h(Annotation, {
      onSelect: toggleSelect,
      enterLinkMode() {},
      ...opts
    });
  } else {
    return h(Annotation, opts);
  }
}

AddAnnotationsOverlay.defaultProps = {
  lockedTags: new Set()
}

export {AnnotationsOverlay, AddAnnotationsOverlay};
