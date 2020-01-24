/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, createContext, useContext} from 'react';
import h from 'react-hyperscript';
import {select, event} from 'd3-selection';
import {drag} from 'd3-drag';
import {findDOMNode} from 'react-dom';
import {Hotkey, Hotkeys,
        HotkeysTarget, Intent} from "@blueprintjs/core";
import {StatefulComponent} from '@macrostrat/ui-components';

import {Tag, LockedTag} from '../annotation';
import {AnnotationLinks} from './annotation-links';
import {TypeSelector} from './type-selector';
import {EditorContext} from './context';

import chroma from 'chroma-js';
import {EditMode} from '../enum';
import {ModalNotifications} from './notifications';
import {AnnotationsOverlay} from './annotations'

import './main.styl';

const {ADD_PART, LINK} = EditMode;
const SHIFT_MODES = new Set([LINK, ADD_PART]);

class ImageOverlay extends StatefulComponent {
  static defaultProps = {
    // Distance we take as a click before switching to drag
    clickDistance: 10,
    editingEnabled: true,
    selectIsOpen: false,
    lockedTags: new Set([])
  };
  constructor(props){
    super(props);

    this.selectAnnotation = this.selectAnnotation.bind(this);
    this.tagColor = this.tagColor.bind(this);
    this.tagColorForName = this.tagColorForName.bind(this);
    this.contextValue = this.contextValue.bind(this);
    this.setMode = this.setMode.bind(this);
    this.selectTag = this.selectTag.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleAddAnnotation = this.handleAddAnnotation.bind(this);
    this.disableEditing = this.disableEditing.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);
    this.handleShift = this.handleShift.bind(this);
    this.state = {
      inProgressAnnotation: null,
      editModes: new Set(),
      shiftKey: false,
      clickingInRect: null
    };
  }

  componentWillReceiveProps(nextProps){
    if (nextProps.editingRect === this.props.editingRect) { return; }
    if (nextProps.editingRect != null) { return; }
    return this.updateState({editModes: {$set: new Set()}});
  }

  selectAnnotation = (ix) =>{ return event => {
    const {actions, editModes} = this.contextValue();
    // Make sure we don't activate the
    // general click or drag handlers
    if (editModes.has(LINK)) {
      (actions.addLink(ix))();
      return actions.setMode(LINK, false);
    } else {
      return (actions.selectAnnotation(ix))();
    }
  }; }

  renderInterior() {
    const {editingRect, width, height, image_tags,
     scaleFactor, tags, currentTag, lockedTags, actions,
     ...rest} = this.props;
    const size = {width, height};
    const {selectIsOpen, inProgressAnnotation} = this.state;

    const onClick = this.disableEditing;

    return h('div', [
      h(TypeSelector, {
        tags,
        lockedTags,
        currentTag,
        toggleLock: actions.toggleTagLock || function() {},
        isOpen: selectIsOpen,
        onClose: () => this.setState({selectIsOpen: false}),
        onItemSelect: this.selectTag
      }),
      h(AnnotationsOverlay, {
        lockedTags,
        inProgressAnnotation,
        image_tags,
        tags,
        width,
        height,
        editingRect,
        actions,
        scaleFactor,
        onClick,
        toggleSelect: this.toggleSelect,
        onSelectAnnotation: this.selectAnnotation
      }),
      h(AnnotationLinks, {image_tags, scaleFactor, tags, ...size}),
      h(ModalNotifications)
    ]);
  }

  tagColor(tag_id){
    const {tags} = this.props;
    let tagData = tags.find(d => d.tag_id === tag_id);
    if (tagData == null) { tagData = {color: 'black'}; }
    return chroma(tagData.color);
  }

  tagColorForName(name){
    const {tags} = this.props;
    let tagData = tags.find(d => d.name === name);
    if (tagData == null) { tagData = {color: 'black'}; }
    return chroma(tagData.color);
  }

  contextValue() {
    const {actions, tags, currentTag, scaleFactor, width, height} = this.props;
    let {editModes, shiftKey} = this.state;
    if (shiftKey) { editModes = SHIFT_MODES; }
    actions.setMode = this.setMode;
    const helpers = {tagColor: this.tagColor, tagColorForName: this.tagColorForName};

    return {
      tags,
      currentTag,
      scaleFactor,
      imageSize: {width, height},
      editModes,
      shiftKey,
      actions,
      helpers,
      update: this.updateState
    };
  }

  setMode(mode, val){
    if (val == null) { val = !this.state.editModes.has(mode); }
    const action = val ? "$add" : "$remove";
    return this.updateState({editModes: {[action]: [mode]}});
  }

  render() {
    return h(EditorContext.Provider, {value: this.contextValue()}, this.renderInterior());
  }

  selectTag = (tag)=>{
    // Selects the Tag ID for active annotation
    const {actions, editingRect} = this.props;
    if (editingRect != null) {
      // Set tag for the active rectangle
      const fn = actions.updateAnnotation(editingRect);
      fn({tag_id: {$set: tag.tag_id}});
    } else {
      (actions.updateCurrentTag(tag.tag_id))();
    }
    return this.setState({selectIsOpen: false});
  }

  handleDrag() {
    const {subject} = event;
    let {x,y} = subject;
    let {
      clickDistance,
      editingRect,
      currentTag,
      scaleFactor,
      editingEnabled,
      lockedTags,
      image_tags
    } = this.props;
    if (!editingEnabled) { return; }
    if (lockedTags.has(currentTag)) {
      throw "Attempting to create a locked tag";
    }

    // Make sure we color with the tag this will be
    const {editModes} = this.contextValue();
    if (editModes.has(ADD_PART) && (editingRect != null)) {
      currentTag = image_tags[editingRect].tag_id;
    }

    if (scaleFactor == null) { scaleFactor = 1; }
    let width = event.x-x;
    let height = event.y-y;
    if (width < 0) {
      width *= -1;
      x -= width;
    }
    if (height < 0) {
      height *= -1;
      y -= height;
    }
    if (width < clickDistance) { return; }
    if (height < clickDistance) { return; }
    // Shift to image coordinates from pixel coordinates
    x *= scaleFactor;
    y *= scaleFactor;
    width *= scaleFactor;
    height *= scaleFactor;

    // We are adding a new annotation
    const boxes = [[x,y,x+width,y+height]];
    const rect = {boxes, tag_id: currentTag};
    return this.setState({inProgressAnnotation: rect, clickingInRect: null});
  }

  handleAddAnnotation() {
    const {actions, editingRect} = this.props;
    const {inProgressAnnotation: r} = this.state;
    this.setState({inProgressAnnotation: null});

    if (r == null) { return; }
    const {editModes} = this.contextValue();
    if (editModes.has(ADD_PART) && (editingRect != null)) {
      // We are adding a box to the currently
      // selected annotation
      const fn = actions.updateAnnotation(editingRect);
      fn({boxes: {$push: r.boxes}});
      // Disable linking mode
    } else {
      actions.appendAnnotation(r);
    }
    return this.setMode(ADD_PART, false);
  }

  disableEditing() {
    const {actions,editingRect} = this.props;
    if (editingRect == null) { return; }
    const __ = {editingRect: {$set: null}};
    return actions.updateState(__);
  }

  toggleSelect = ()=> {
    console.log("Opening select box");
    return this.setState({selectIsOpen: true});
  }

  renderHotkeys() {
    const {editingRect, actions} = this.props;
    return h(Hotkeys, null, [
      h(Hotkey, {
        label: "Delete rectangle",
        combo: "backspace",
        global: true,
        preventDefault: true,
        onKeyDown: evt=> {
          if (editingRect == null) { return; }
          return actions.deleteAnnotation(editingRect)();
        }
      }),
      h(Hotkey, {
        global: true,
        combo: "l",
        label: "Toggle select",
        onKeyDown: this.toggleSelect,
        //prevent typing "O" in omnibar input
        preventDefault: true
      }),
      h(Hotkey, {
        label: "Expose secondary commands",
        combo: "shift",
        global: true,
        onKeyDown: this.handleShift(true)
      })
    ]);
  }

  handleShift(val){ return () => {
    return this.setState({shiftKey: val});
  }; }

  componentDidMount() {
    const el = select(findDOMNode(this));

    // Set up dragging when rectangle is not clicked
    this.edgeDrag = drag()
      .on("drag", this.handleDrag)
      .on("end", this.handleAddAnnotation)
      .clickDistance(this.props.clickDistance);

    el.call(this.edgeDrag);

    return select(document).on('keyup', d=> {
      if (this.state.shiftKey && !event.shiftKey) {
        return (this.handleShift(false))();
      }
    });
  }
}

ImageOverlay = HotkeysTarget(ImageOverlay);

export {ImageOverlay};
