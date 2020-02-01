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
import {ReactNode} from 'react'
import {CanvasSizeProvider} from '~/providers'
import {Size} from '~/@types'

interface ImagePanelProps {
  image: ImageData,
  urlForImage: (im: ImageData)=>string,
  dimensionsForImage?: (im: ImageData)=>Size
  children?: ReactNode
}

interface ImagePanelState {
  windowWidth: number,
  imageSize: Size|null
}

async function imageSize(url: string): Size {
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = function() {
      let {width, height} = this
      return resolve({width,height});
    };
    return img.src = url;
  });
}

class ScaledImagePanel extends Component<ImagePanelProps,ImagePanelState> {
  static defaultProps = {
    // By default, just assume we pass a URL
    urlForImage: (d)=>d
  }
  state = {
    windowWidth: window.innerWidth,
    imageSize: null
  };
  render() {
    const {windowWidth, imageSize} = this.state;
    if (imageSize == null) return null
    let {width, height} = imageSize

    const targetSize = Math.min(2000, windowWidth-24);
    // Clamp to integer scalings for simplicity
    const scaleFactor = Math.max(width/targetSize,1);

    height /= scaleFactor;
    width /= scaleFactor;

    console.log(width,height,imageSize,scaleFactor)

    const src = this.props.urlForImage(this.props.image)

    return h(CanvasSizeProvider, {width, height, scaleFactor},
      h('div.image-container', {style: {width, height}}, [
        h('img', {src, width, height}),
        this.props.children
      ])
    )
  }

  async getImageDimensions() {
    const {image} = this.props
    if (!image) return null
    let sz = this.props.dimensionsForImage?.(image)
    if (sz?.width != null && sz?.height != null) return Promise.resolve(sz)

    // Make sure we have image dimensions set before loading an image
    // into the UI
    const imageURL = this.props.urlForImage(image);
    return imageSize(imageURL)
  }

  async didUpdateImage(prevProps) {
    if (prevProps?.image == this.props.image) return
    console.log("Calling didUpdateImage")
    const sz = await this.getImageDimensions()
    this.setState({imageSize: sz})
  }

  componentDidMount() {
    this.didUpdateImage.apply(this, arguments)
    window.addEventListener('resize', () => this.setState({windowWidth: window.innerWidth}));
  }

  componentDidUpdate() {
    this.didUpdateImage.apply(this, arguments)
  }
}

export {ScaledImagePanel};
