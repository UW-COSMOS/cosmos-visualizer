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
import {Tag, LockedTag} from '../annotation';

import {EditMode} from '../enum';
import {AnnotationRect, Annotation, ITag, TagRect} from './types'
import {AnnotationActions} from '../editor/types'
import {
  useCanvasSize,
  useAnnotations,
  useSelectedAnnotation
} from '~/providers'

import './main.styl';

const {ADD_PART, LINK} = EditMode;

type UpdateSpec = object

interface AnnotationsOverlayProps {
  image_tags: Annotation[],
  width: number,
  height: number,
  inProgressAnnotation: Annotation|null,
  scaleFactor: number,
  actions: AnnotationActions,
  lockedTags: Set<string>,
  toggleSelect: ()=>void,
  onSelectAnnotation: (ix: number)=> ()=>void
  onClick: ()=>void
  tags: ITag[],
  editingRect: number|null
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

  let annotations = useAnnotations()
  let selected = useSelectedAnnotation()
  const {width, height, scaleFactor} = useCanvasSize()

  if (inProgressAnnotation != null) {
    selected = null;
    annotations.push(inProgressAnnotation);
  }

  const size = {width, height};

  return h('div.overlay', {style: size, onClick}, annotations.map((d, ix)=> {

    const isLocked = lockedTags.has(d.tag_id);
    if (isLocked) {
      return h(LockedTag, {tags, ...d});
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
      tags,
      scaleFactor,
      maxPosition: {width, height},
      locked: isLocked,
      onMouseDown
    };

    if (isSelected) {
      return h(Tag, {
        delete: actions.deleteAnnotation(ix),
        update: actions.updateAnnotation(ix),
        onSelect: toggleSelect,
        enterLinkMode() {},
        ...opts
      });
    } else {
      return h(Tag, opts);
    }
  }))
}

export {AnnotationsOverlay};
