/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, createContext} from 'react';
import h from 'react-hyperscript';

import {ReactNode} from 'react'
import {AnnotationsProvider} from '~/providers'
import {AnnotationArr, Annotation} from '~/image-overlay/types'
import {ScaledImagePanel} from '~/page-interface/scaled-image'

import {StatefulComponent} from '@macrostrat/ui-components';

import {AnnotationLinks} from '../image-overlay/annotation-links';
import {EditMode} from '../enum';
import {AnnotationsOverlay} from '../image-overlay/annotations';
import {
  AnnotationsContext,
  Tag,
} from '~/providers'

const {ADD_PART, LINK} = EditMode;
const SHIFT_MODES = new Set([LINK, ADD_PART]);

interface Props {
  clickDistance: number,
  editingEnabled: boolean,
  selectIsOpen: boolean,
  lockedTags: Set<Tag>
}
interface State {
  inProgressAnnotation: AnnotationArr|null
}

class ImageOverlay extends StatefulComponent<Props,State> {
  static defaultProps = {
    // Distance we take as a click before switching to drag
    clickDistance: 10,
    editingEnabled: true,
    selectIsOpen: false,
    lockedTags: new Set([])
  };
  static contextType = AnnotationsContext;
  constructor(props){
    super(props);
    this.state = {
      inProgressAnnotation: null,
      shiftKey: false,
      clickingInRect: null
    };
  }

  render() {
    return h('div', [
      //h(AnnotationsOverlay),
      //h(AnnotationLinks)
    ]);
  }
}

const normalizeAnnotation = function(d: AnnotationArr): Annotation {
  /*
  Temporary (?) function to normalize an annotation rectangle
  to the expected internal representation.
  */
  console.log(d);
  const boxes = [d[0]];
  const name = d[1];
  const score = d[2];
  return {boxes, name, score, tag_id: name};
};

interface ViewerProviderProps {
  children: ReactNode,
  annotations: AnnotationArr[]
}

const PageDataProvider = (props: ViewerProviderProps)=>{
  const {children, annotations} = props
  // For viewer
  return h(AnnotationsProvider, {
    annotations: (annotations ?? []).map(normalizeAnnotation),
    allowSelection: true
  }, children)
}

interface ContainerProps {}
interface ContainerState {}

class ImageContainer extends Component<ContainerProps, ContainerState> {
  static defaultProps = {
    image: null,
    editingEnabled: false
  };
  constructor(props: ContainerProps){
    super(props);
    this.state = {image: null};
  }

  // async componentDidUpdate(nextProps){
  //   // Store prevUserId in state so we can compare when props change.
  //   // Clear out any previously-loaded user data (so we don't render stale stuff).
  //   let oldId;
  //   const {image} = nextProps;
  //   try {
  //     oldId = this.state.image.image_id;
  //   } catch (error) {
  //     oldId = null;
  //   }
  //
  //   if (image == null) { return; }
  //   if (nextProps.image._id === oldId) { return; }
  //   return this.setState({image});
  // }

  imageURL(image){
    console.log(`image: ${image}`)
    const {resize_bytes} = image;
    return "data:image/png;base64," + resize_bytes;
  }

  render() {
    const {image} = this.props;
    if (image == null) return null

    return h(PageDataProvider, {annotations: image.pp_detected_objs}, [
      h(ScaledImagePanel, {
        image,
        urlForImage: this.imageURL.bind(this)
      },
        h(ImageOverlay)
      )
    ]);
  }
}

export {ImageContainer};
