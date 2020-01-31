/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';
import {event} from 'd3-selection';
import {Annotation , LockedAnnotation} from './annotation';

import {EditMode} from '../enum';
import {AnnotationActions} from '../editor/types'
import {
  useCanvasSize,
  useAnnotations,
  useSelectedAnnotation,
  Annotation as IAnnotation,
  Tag as ITag
} from '~/providers'

import './main.styl';



interface AnnotationsOverlayProps {
  inProgressAnnotation: IAnnotation|null,
  actions: AnnotationActions,
  lockedTags: Set<string>,
  toggleSelect: ()=>void,
  onSelectAnnotation: (ix: number)=> ()=>void
  onClick: ()=>void
  tags: ITag[],
}

const AnnotationsOverlay = (props: AnnotationsOverlayProps)=>{
  let {
    inProgressAnnotation,
    tags,
    lockedTags,
    onClick,
    toggleSelect,
  } = props;

  const annotations = useAnnotations()
  let selected = useSelectedAnnotation()
  const {width, height} = useCanvasSize()

  let allAnnotations: IAnnotation[] = [...annotations]
  if (inProgressAnnotation != null) {
    selected = null;
    allAnnotations.push(inProgressAnnotation);
  }

  return h('div.overlay', {style: {width, height}, onClick}, allAnnotations.map((d, ix)=> {

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
  }))
}

export {AnnotationsOverlay};
