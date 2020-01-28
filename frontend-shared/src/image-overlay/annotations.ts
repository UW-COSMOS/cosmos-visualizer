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
import {AnnotationArr, Annotation, ITag, TagRect} from './types'

import './main.styl';

const {ADD_PART, LINK} = EditMode;

type UpdateSpec = object

const transformTag = function(d: AnnotationArr): Annotation {
  console.log(d);
  const boxes = [d[0]];
  const name = d[1];
  const score = d[2];
  return {boxes, name, score, tag_id: name};
};

interface AnnotationActions {
  deleteAnnotation: (ix: number)=> () => void,
  updateAnnotation: (ix: number)=> (spec: UpdateSpec) => void
}

interface AnnotationsOverlayProps {
  image_tags: AnnotationArr[],
  width: number,
  height: number,
  inProgressAnnotation: AnnotationArr|null,
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
    image_tags,
    tags,
    width,
    height,
    lockedTags,
    editingRect,
    actions,
    scaleFactor,
    onClick,
    toggleSelect,
    onSelectAnnotation
  } = props;

  if (inProgressAnnotation != null) {
    editingRect = null;
    image_tags = [...image_tags, inProgressAnnotation];
  }

  const size = {width, height};

  return h('div.overlay', {style: size, onClick}, image_tags.map((v, ix)=> {
    const d = transformTag(v);

    const locked = lockedTags.has(d.tag_id);
    if (locked) {
      return h(LockedTag, {tags, ...d});
    }

    const isEditing = (ix === editingRect) && !locked;

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
      locked,
      onMouseDown
    };

    if (isEditing) {
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
