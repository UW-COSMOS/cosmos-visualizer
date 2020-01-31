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

const {ADD_PART, LINK} = EditMode;


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
    actions,
    onClick,
    toggleSelect,
    onSelectAnnotation
  } = props;

  const annotations = useAnnotations()
  let selected = useSelectedAnnotation()
  const {width, height, scaleFactor} = useCanvasSize()

  let allAnnotations: IAnnotation[] = [...annotations]
  if (inProgressAnnotation != null) {
    selected = null;
    allAnnotations.push(inProgressAnnotation);
  }

  const size = {width, height};

  return h('div.overlay', {style: size, onClick}, allAnnotations.map((d, ix)=> {

    const isLocked = lockedTags.has(d.tag_id);
    if (isLocked) {
      return h(LockedAnnotation, {tags, ...d});
    }

    const isSelected = (d == selected) && !isLocked;

    const onMouseDown = () => {
      console.log(ix);
      onSelectAnnotation(ix)();
      // Don't allow dragging
      return event.stopPropagation();
    };

    let opts = {
      key: ix,
      ...d,
      maxPosition: {width, height},
      locked: isLocked,
      onMouseDown
    };

    if (isSelected) {
      return h(Annotation, {
        delete: actions.deleteAnnotation(ix),
        update: actions.updateAnnotation(ix),
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
