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
import {Spec} from 'immutability-helper'
import {
  AnnotationRect,
  CanvasSizeContext,
  useCanvasSize
} from '~/providers'

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
    left: margin,
    right: margin,
    top: margin,
    bottom: margin,
    width: 2*margin,
    height: 2*margin
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
    color,
    backgroundColor,
    style,
    onClick,
    onMouseDown,
    ...rest
  } = props;


  const {scaleFactor} = useCanvasSize()

  let {x,y,width, height} = getSize(bounds);
  backgroundColor = backgroundColor ?? color

  const clickHandler = onMouseDown ?? onClick
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

  return h('div.rect', {ref, style, ...rest});
}

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

interface Size {
  width: number,
  height: number
}

interface DragRectProps extends RectProps {
  minSize?: Size,
  update(spec: Spec): void
}

function mouseCoords() {
  const {screenX: x, screenY: y} = event.sourceEvent
  return {x,y}
}

class DragRectangle extends Component {
  static contextType = CanvasSizeContext;
  constructor(props) {
    super(props);
    this.dragSubject = this.dragSubject.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.dragInteraction = this.dragInteraction.bind(this);
    this.maxPosition = this.maxPosition.bind(this);
  }
  static contextType = CanvasSizeContext;

  static defaultProps = {
    minSize: {width: 10, height: 10}
  };
  render() {
    const {children, update, bounds, color, onMouseDown} = this.props;
    const margin = 4;
    const className = (update != null) ? 'draggable' : null;
    let {onClick} = this.props

    const isSelected = true;
    // TODO: not sure why we were overriding here, but it's weird...
    // maybe something to do with needing to capture mousdowns instead?
    if (update != null) onClick = e => e.stopPropagation();

    const {dragInteraction} = this;
    return h(StaticRectangle, {bounds, color, className, isSelected, onClick, onMouseDown}, [
      (update != null) ? h(DragHandles, {dragInteraction}) : null,
      children
    ]);
  }

  dragSubject() {
    let {bounds} = this.props;
    const {scaleFactor} = this.context;
    let {x,y,width,height} = getSize(bounds);

    const source = mouseCoords();
    x /= scaleFactor;
    y /= scaleFactor;
    width /= scaleFactor;
    height /= scaleFactor;
    return {x,y, width, height, bounds, source};
  }

  maxPosition() {
    const {maxPosition} = this.props
    if (maxPosition != null) return maxPosition;
    let {width, height} = this.context;
    return {width, height}
  }

  handleDrag(side){
    const {scaleFactor} = this.context;
    const {subject: s} = event;
    let {width, height, x,y, source} = s;
    const client = mouseCoords();
    const dx = client.x-source.x;
    let dy = client.y-source.y;
    const {update, minSize} = this.props;
    if (update == null) return

    side = side ?? ""

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

    x = Math.max(0,x)
    y = Math.max(0,y)
    width = Math.max(width, minSize.width)
    height = Math.max(height, minSize.height)

    const maxPos = this.maxPosition()
    if (maxPos != null) {
      const maxX = maxPos.width-width;
      const maxY = maxPos.height-height;
      x = Math.min(x, maxX)
      y = Math.min(y, maxY)
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

const Rectangle = props => h(DragRectangle, props);

export {DragRectangle, Rectangle, StaticRectangle};
