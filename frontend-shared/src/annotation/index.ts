/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component} from 'react';
import h from 'react-hyperscript';
import {min, max} from 'd3-array';
import {Rectangle} from './drag-rect';
import {Button, Intent} from '@blueprintjs/core';
import classNames from 'classnames';
import {EditMode} from '../enum';
import {EditorContext} from '../image-overlay/context';
import {useCanvasSize, useTags} from '~/providers'

const ToolButton = props => h(Button, {small: true, minimal: true, ...props});

const tagBounds = boxes => [
  min(boxes, d => d[0]),
  min(boxes, d => d[1]),
  max(boxes, d => d[2]),
  max(boxes, d => d[3])
];

const tagCenter = function(boxes){
  const d = tagBounds(boxes);
  return [(d[0]+d[2])/2, (d[1]+d[3])/2];
};

class Annotation extends Component {
  constructor(...args) {
    super(...args);
    this.tagUpdater = this.tagUpdater.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.renderTags = this.renderTags.bind(this);
    this.setTag = this.setTag.bind(this);
    this.renderLinkButton = this.renderLinkButton.bind(this);
    this.boxContent = this.boxContent.bind(this);
    this.renderControls = this.renderControls.bind(this);
    this.editingMenuPosition = this.editingMenuPosition.bind(this);
  }

  static contextType = EditorContext;
  static defaultProps = {
    enterLinkMode() {}
  };
  tagUpdater(ix){
    const {update} = this.props;
    if (update == null) { return null; }
    // Return an updater function
    return spec=> {
      const {bounds: subSpec} = spec;
      if (subSpec == null) { return; }
      return update({boxes: {[ix]: subSpec}});
    };
  }

  isSelected() {
    const {update} = this.props;
    return (update != null);
  }

  renderTags(color){
    let {boxes, update, ...rest} = this.props;

    let className = null;
    if (update != null) {
      className = 'active';
    }

    return h('div.tag', {className}, boxes.map((d, i)=> {
      update = this.tagUpdater(i);
      return h(Rectangle, {
        bounds: d,
        update,
        color,
      ...rest}, this.boxContent(i));
    })
    );
  }

  render() {
    const {tags} = this.context;

    let {boxes, update, name, tag_id, ...rest} = this.props;

    const overallBounds = tagBounds(boxes);

    const c = this.context.helpers.tagColorForName(name);
    let alpha = 0.3;
    if (this.isSelected()) {
      alpha = 0.6;
    }

    const color = c.alpha(alpha).css();
    const textColor = c.darken(2);

    let tagData = tags.find(d => d.tag_id === tag_id);
    // Sometimes we don't return tags
    if (tagData == null) { tagData = {}; }
    name = h('div.tag-name', {style: {color: textColor}}, tagData.name || name);

    const active = this.isSelected();
    const className = classNames({active});
    return h('div.annotation', {className}, [
      h(Rectangle, {
        bounds: overallBounds,
        color, backgroundColor: 'none',
        style: {pointerEvents: 'none'},
        ...rest
        }, [
        name,
        this.renderControls()
      ]),
      this.renderTags(color)
    ]);
  }

  setTag(tag){
    const {update} = this.props;
    console.log(tag);
    return update({tag_id: {$set: tag.tag_id}});
  }

  renderLinkButton() {
    const {update, enterLinkMode} = this.props;
    const {actions: {setMode}, editModes} = this.context;
    const removeLink = () => update({linked_to: {$set: null}});

    if (this.props.linked_to != null) {
      return h(ToolButton, {
        icon: 'ungroup-objects',
        onClick: removeLink
      });
    }
    return h(ToolButton, {
      icon: 'new-link',
      intent: editModes.has(EditMode.LINK) ? Intent.SUCCESS : undefined,
      onClick() { return setMode(EditMode.LINK); }
    });
  }

  boxContent(i){
    const {update, boxes} = this.props;
    if (boxes.length <= 1) { return null; }

    // Need actual logic here
    const editingDisabled = true;
    if (editingDisabled) { return null; }
    return h(ToolButton, {
      icon: 'cross',
      className: 'delete-rect',
      intent: Intent.DANGER,
      onClick: () => update({boxes: {$splice: [[i,1]]}})
    });
  }

  renderControls() {
    const {tags} = this.context;
    const {tag_id, linked_to, update, delete: deleteRectangle, onSelect, enterLinkMode} = this.props;
    if (!this.isSelected()) { return null; }
    const currentTag = tags.find(d => d.tag_id === tag_id);
    const className = this.editingMenuPosition();
    const {actions: {setMode}, editModes} = this.context;

    // Make sure clicks on the control panel don't dismiss it
    // due to the competing overlay click handler
    const onClick = event => event.stopPropagation();

    return h('div.rect-controls', {className, onClick, style: {pointerEvents: 'visible'}}, [
      h(ToolButton, {
        icon: 'tag',
        onClick: onSelect
      }),
      this.renderLinkButton(),
      h(ToolButton, {
        icon: 'insert',
        intent: editModes.has(EditMode.ADD_PART) ? Intent.SUCCESS : undefined,
        onClick() { return setMode(EditMode.ADD_PART); }
      }),
      h(ToolButton, {
        icon: 'cross',
        intent: Intent.DANGER,
        onClick: deleteRectangle
      })
    ]);
  }

  editingMenuPosition() {
    const {imageSize: maxPosition, scaleFactor} = this.context;
    const {boxes} = this.props;
    let [x,y,maxX,maxY] = boxes[0];
    maxY /= scaleFactor;
    if (maxPosition != null) {
     if (maxY > (maxPosition.height-50)) {
        return 'top';
      }
   }
    return 'bottom';
  }
}

const LockedAnnotation = (props)=>{
  const {boxes, tag_id, ...rest} = this.props;
  const {scaleFactor, width, height} = useCanvasSize()
  const maxPosition = {width, height}

  const {helpers} = useContext(EditorContect)
  const c = helpers.tagColor(tag_id);
  const alpha = 0.2;
  const color = c.alpha(alpha).css();

  return h('div.annotation.locked', boxes.map((d, i)=> {
    return h(Rectangle, {
      bounds: d,
      color,
      scaleFactor,
      maxPosition,
      ...rest
    });
  }));
}

export {Annotation, LockedAnnotation, tagCenter, tagBounds};
