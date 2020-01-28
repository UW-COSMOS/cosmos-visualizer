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
import {join} from 'path';

import {ImageOverlay} from '../image-overlay';
import {APIContext} from '../api';
import {PageExtractionShape} from '../types';

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

class ImageContainer extends Component {
  static initClass() {
    this.defaultProps = {
      actions: {},
      tags: [],
      image: null,
      editingEnabled: false
    };
    this.contextType = ImageStoreContext;
    this.propTypes = {
      image: PageExtractionShape
    };
  }

  constructor(props){
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.scaledSize = this.scaledSize.bind(this);
    this.imageURL = this.imageURL.bind(this);
    this.render = this.render.bind(this);
    this.ensureImageDimensions = this.ensureImageDimensions.bind(this);
    super(props);
    this.state = {
      scaleFactor: null,
      image: null,
      windowWidth: window.innerWidth
    };
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
    const im =  await this.ensureImageDimensions(image);
    return this.setState({image: im});
  }

  scaledSize() {
    let {image, scaleFactor} = this.state;
    if (image == null) { return null; }
    if (scaleFactor == null) { scaleFactor = 1; }
    let {height, width} = image;
    height /= scaleFactor;
    width /= scaleFactor;
    return {width,height};
  }

  imageURL(image){
      console.log(`image: ${image}`)
    return join("/images_to_tag/", image.file_path)
  }

  render() {
    const {actions, editingEnabled, editingRect,
     tags, currentTag, currentImage, imageTags, ...rest} = this.props;
    const {scaleFactor, image} = this.state;
    if (image == null) { return null; }
    const style = this.scaledSize();

    return h('div.image-container', {style}, [
      h('img', {src: this.imageURL(image), ...style}),
      h(ImageOverlay, {
        ...style,
        scaleFactor,
        image_tags: [], //HACK HACK HACK this will break other things IAR - 28.Jan.2020 TODO: fix
        currentTag,
        tags,
        actions,
        editingEnabled,
        editingRect
      })
    ]);
  }

  ensureImageDimensions({width, height, ...rest}){
    // Make sure we have image dimensions set before loading an image
    // into the UI
    const imageURL = this.imageURL(rest);
    return new Promise(function(resolve, reject){
      if ((width != null) && (height != null)) {
        resolve({width, height, ...rest});
        return;
      }
      const img = new Image();
      img.onload = function() {
        ({width, height} = this);
        return resolve({width,height, ...rest});
      };
      return img.src = imageURL;
    });
  }

  didUpdateWindowSize(prevProps, prevState){
    let {windowWidth, scaleFactor, image} = this.state;
    if ((scaleFactor != null) && (prevState.windowWidth === windowWidth)) { return; }
    if (image == null) { return; }
    const {width} = image;
    const targetSize = Math.min(2000, windowWidth-24);
    // Clamp to integer scalings for simplicity
    scaleFactor = width/targetSize;
    if (scaleFactor < 1) {
      scaleFactor = 1;
    }

    return this.setState({scaleFactor});
  }

  componentDidMount() {
    return window.addEventListener('resize', () => {
      return this.setState({windowWidth: window.innerWidth});
  });
  }

  componentDidUpdate() {
    return this.didUpdateWindowSize.apply(this,arguments);
  }
}
ImageContainer.initClass();

export {ImageContainer, ImageStoreContext, ImageStoreProvider};
