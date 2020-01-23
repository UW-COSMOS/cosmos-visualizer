/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component} from 'react';
import h from 'react-hyperscript';
import {EditorContext} from './context';
import {bboxPolygon, featureCollection,
        polygonToLine,
        nearestPointOnLine,
        centroid, combine} from '@turf/turf';

class MarkerBox extends Component {
  static id(color){
    console.log(color);
    return "box-"+color.replace("#",'');
  }
  render() {
    const {color} = this.props;
    return h('marker', {
      id: this.constructor.id(color),
      markerWidth: 4,
      markerHeight: 4,
      refX: 2,
      refY: 2
    }, (
      h('rect', {x: 0, y: 0, width: 4, height: 4, fill: color})
    ));
  }
}

class MarkerArrow extends Component {
  static id(color){
    return "arrow-"+color.replace("#",'');
  }
  render() {
    const {color} = this.props;
    return h('marker', {
      markerWidth: 10,
      markerHeight: 10,
      refX: 8,
      refY: 3,
      orient: "auto",
      markerUnits: "strokeWidth",
      id: this.constructor.id(color),
      viewBox: "0 0 15 15"
    }, (
      h('path', {d: "M0,0 L0,6 L9,3 z", fill: color})
    ));
  }
}

class AnnotationLinks extends Component {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.computeLinks = this.computeLinks.bind(this);
    super(...args);
  }

  static initClass() {
    this.contextType = EditorContext;
  }
  renderDefs(links){
    const colors = new Set(links.map(l => l.color.hex()));
    return h('defs', Array.from(colors).map(c => [
        h(MarkerBox, {color: c, key: 'box'}),
        h(MarkerArrow, {color: c, key: 'arrow'})
      ]));
  }

  render() {
    const {width, height} = this.props;
    const links = this.computeLinks();
    return h('svg.annotation-links', {width, height}, [
      this.renderDefs(links),
      h('g.links', links.map(function(l){
        const [x1,y1,x2,y2] = l.coords;
        const color = l.color.hex();
        return h('line', {
          x1,x2,y1,y2,
          stroke: color,
          strokeWidth: "2px",
          markerEnd: `url(#${MarkerArrow.id(color)})`,
          markerStart: `url(#${MarkerBox.id(color)})`
        });}))
    ]);
  }

  computeLinks() {
    const {image_tags, scaleFactor, tags} = this.props;
    const {tagColor} = this.context.helpers;

    const boxPolygon = function(boxes){
      const polys = boxes
        .map(box => box.map(d => d/1000)).map(bboxPolygon);
      return combine(featureCollection(polys)).features[0];
    };

    const links = [];
    for (let fromTag of Array.from(image_tags)) {
      var {linked_to} = fromTag;
      if (linked_to == null) { continue; }
      const toTag = image_tags.find(d => d.image_tag_id === linked_to);
      if (toTag == null) { continue; }

      const p1 = boxPolygon(fromTag.boxes);
      const p2 = boxPolygon(toTag.boxes);
      const ext1 = polygonToLine(p1).features[0];
      const ext2 = polygonToLine(p2).features[0];

      // Get the centroid of the first point
      let c1 = centroid(p1);
      let c2 = centroid(p2);
      const e1 = nearestPointOnLine(ext1, c2);
      const e2 = nearestPointOnLine(ext2, e1);
      c1 = e1.geometry.coordinates;
      c2 = e2.geometry.coordinates;

      const coords = [...c1,...c2].map(d => (d/scaleFactor)*1000);

      const color = tagColor(fromTag.tag_id);
      links.push({coords, color});
    }

    return links;
  }
}
AnnotationLinks.initClass();

export {AnnotationLinks};
