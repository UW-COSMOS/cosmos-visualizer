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
import {join} from 'path'

import {ReactNode} from 'react'
import {ImageOverlay} from '../image-overlay';
import {AnnotationsProvider} from '~/providers'
import {AnnotationArr, Annotation} from '~/image-overlay/types'
import {ScaledImagePanel} from '~/page-interface/scaled-image'

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
  // For tagger
  return children
  // For viewer
  return h(AnnotationsProvider, {
    annotations: (annotations ?? []).map(normalizeAnnotation),
    allowSelection: true
  }, children)
}


const ImageStoreContext = createContext({});

class ImageStoreProvider extends Component {
  render() {
    const {baseURL, publicURL, children} = this.props;
    if ((baseURL == null)) {
      throw "baseURL for image store must be set in context";
    }
    const value = {baseURL, publicURL};
    return h(ImageStoreContext.Provider, {value}, children);
  }
}

interface ContainerProps {}
interface ContainerState {}

class ImageContainer extends Component<ContainerProps, ContainerState> {
  static defaultProps = {
    actions: {},
    tags: [],
    image: null,
    editingEnabled: false
  };
  static contextType = ImageStoreContext;
  constructor(props: ContainerProps){
    super(props);
    this.state = {image: null};
  }

  async componentWillReceiveProps(nextProps){
    // Store prevUserId in state so we can compare when props change.
    // Clear out any previously-loaded user data (so we don't render stale stuff).
    let oldId;
    const {image} = nextProps;
    try {
      oldId = this.state.image.image_id;
    } catch (error) {
      oldId = null;
    }

    if (image == null) { return; }
    if (nextProps.image._id === oldId) { return; }
    return this.setState({image});
  }

  imageURL(image){
    console.log(`image: ${image}`)
    const {resize_bytes} = image;
    //return "data:image/png;base64," + resize_bytes;
    return join("/images_to_tag/", image.file_path)
  }

  render() {
    const {actions, editingEnabled,
     tags, currentTag, currentImage, imageTags} = this.props;
    const {image} = this.state;
    if (image == null) { return null; }

    return h(PageDataProvider, {annotations: image.pp_detected_objs}, [
      h(ScaledImagePanel, {
        image,
        urlForImage: this.imageURL.bind(this)
      },
        h(ImageOverlay, {
          currentTag,
          tags,
          actions,
          editingEnabled
        })
      )
    ]);
  }
}

export {ImageContainer, ImageStoreContext, ImageStoreProvider};
