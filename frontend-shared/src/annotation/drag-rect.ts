/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// A d3/react rectangle dragging component
// Prior art:
// - http://bl.ocks.org/mccannf/1629464
// - https://bl.ocks.org/d3noob/204d08d309d2b2903e12554b0aef6a4d
import {Component, useLayoutEffect, useRef} from 'react';
import {findDOMNode} from 'react-dom';
import {select, event, mouse} from 'd3-selection';
import {drag} from 'd3-drag';
import h from 'react-hyperscript';
import {AnnotationRect, useCanvasSize} from '~/providers'

interface BoxPosition {
  x: number,
  y: number,
  width: number,
  height: number
}

const getSize = function(bounds: AnnotationRect): BoxPosition {
  const [x,y, xMax, yMax] = bounds;
  const width = xMax-x;
  const height = yMax-y;
  return {x,y,width,height};
};

const oppositeSide = function(s){
  if (s === 'bottom') { return 'top'; }
  if (s === 'right') { return 'left'; }
  if (s === 'left') { return 'right'; }
  if (s === 'top') { return 'bottom'; }
};

const Handle = function({side, margin}){
  if (margin == null) { margin = 4; }
  const style = {
    left: margin, right: margin,
    top: margin, bottom: margin,
    width: 2*margin, height: 2*margin
  };

  if (['top','bottom'].includes(side)) {
    style.width = null;
  }
  if (['left','right'].includes(side)) {
    style.height = null;
  }

  for (let s of Array.from(side.split(" "))) {
    style[s] = -margin;
    style[oppositeSide(s)] = null;
  }

  const className = side;

  return h('div.drag-handle', {style, className, __data__: side});
};

interface RectProps {
  bounds: AnnotationRect,
  children?: React.ReactNode,
  className?: string,
  color: string,
  backgroundColor?: string,
  onMouseDown?: React.MouseEventHandler,
  onClick?: React.MouseEventHandler,
  style?: React.CSSProperties
}

const StaticRectangle = (props: RectProps)=>{
  let {
    bounds,
    children,
    className,
    color,
    style
  } = props;


  const {scaleFactor} = useCanvasSize()
  if (scaleFactor == null) { return null; }

  let {x,y,width, height} = getSize(bounds);
  const backgroundColor = props.backgroundColor ?? color

  const clickHandler = props.onMouseDown ?? props.onClick
  // Replace componentDidMount/findDOMNode with useRef and and useEffect
  const ref = useRef(null)
  useLayoutEffect(function(){
    select(ref.current).on('mousedown', clickHandler);
  },[])


  width /= scaleFactor;
  height /= scaleFactor;

  style = {
    ...style,
    top: y/scaleFactor,
    left: x/scaleFactor,
    width, height,
    backgroundColor,
    borderColor: color,
  };

  return h('div.rect', {ref, style, className}, children);
}

StaticRectangle.defaultProps = {
  isSelected: false
};

class DragHandles extends Component {
  render() {
    return h('div.handles', [
      h(Handle, {side: 'top'}),
      h(Handle, {side: 'bottom'}),
      h(Handle, {side: 'left'}),
      h(Handle, {side: 'right'}),
      h(Handle, {side: 'top right', margin: 6}),
      h(Handle, {side: 'bottom right', margin: 6}),
      h(Handle, {side: 'top left', margin: 6}),
      h(Handle, {side: 'bottom left', margin: 6})
    ]);
  }
  componentDidMount() {
    const {dragInteraction} = this.props;
    const el = select(findDOMNode(this));
    return el.selectAll('div.drag-handle')
      .call(dragInteraction());
  }
}

class DragRectangle extends Component {
  constructor(...args) {
    super(...args);
    this.dragSubject = this.dragSubject.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.dragInteraction = this.dragInteraction.bind(this);
  }

  static initClass() {
    this.defaultProps = {
      minSize: {width: 10, height: 10}
    };
  }
  render() {
    const {children, update, ...rest} = this.props;
    const margin = 4;
    const className = (update != null) ? 'draggable' : null;

    const isSelected = true;
    const onClick = e => e.stopPropagation();

    const {dragInteraction} = this;
    return h(StaticRectangle, {...rest, className, isSelected, onClick}, [
      (update != null) ? h(DragHandles, {dragInteraction}) : null,
      children
    ]);
  }

  mouseCoords() {
    let x, y;
    return ({screenX: x, screenY: y} = event.sourceEvent);
  }

  dragSubject() {
    let {bounds, scaleFactor} = this.props;
    let {x,y,width,height} = getSize(bounds);

    const source = this.mouseCoords();
    if (scaleFactor == null) { scaleFactor = 1; }
    x /= scaleFactor;
    y /= scaleFactor;
    width /= scaleFactor;
    height /= scaleFactor;
    return {x,y, width, height, bounds, source};
  }

  handleDrag(side){
    let minSize, scaleFactor, update;
    if (side == null) { side = ""; }
    const {subject: s} = event;
    let {width, height, x,y, source, maxPosition} = s;
    const client = this.mouseCoords();
    const dx = client.x-source.x;
    let dy = client.y-source.y;
    ({update, minSize, maxPosition, scaleFactor} = this.props);
    if (update == null) { return; }
    if (scaleFactor == null) { scaleFactor = 1; }

    if (side.includes('top')) {
      if (dy > height) {
        dy = height;
      }
      y = s.y+dy;
      height -= dy;
    }
    if (side.includes('bottom')) {
      height += dy;
    }
    if (side.includes("right")) {
      width += dx;
    }
    if (side.includes('left')) {
      x = s.x+dx;
      width -= dx;
    }
    if (side === "") {
      // Drag the entire box
      ({x,y} = event);
    }

    if (width < minSize.width) {
      ({
        width
      } = minSize);
    }
    if (height < minSize.height) {
      ({
        height
      } = minSize);
    }

    if (x < 0) { x = 0; }
    if (y < 0) { y = 0; }

    if (maxPosition != null) {
      const maxX = maxPosition.width-width;
      const maxY = maxPosition.height-height;
      if (x > maxX) { x = maxX; }
      if (y > maxY) { y = maxY; }
    }

    x *= scaleFactor;
    y *= scaleFactor;
    width *= scaleFactor;
    height *= scaleFactor;

    // Provide an update spec
    update({bounds: {$set: [x,y,x+width,y+height]}});
    return event.sourceEvent.stopPropagation();
  }

  dragInteraction() {
    const {handleDrag} = this;
    return drag()
      .subject(this.dragSubject)
      .on("drag", function() {
        const d = this.getAttribute('__data__');
        return handleDrag(d);
    });
  }

  componentDidMount() {
    const el = select(findDOMNode(this));
    return el.call(this.dragInteraction());
  }
}
DragRectangle.initClass();

const Rectangle = props => h(DragRectangle, props);

export {DragRectangle, Rectangle};
