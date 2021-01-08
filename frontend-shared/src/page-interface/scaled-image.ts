import { Component } from "react";
import h from "react-hyperscript";
import { ReactNode } from "react";
import { CanvasSizeProvider } from "~/providers";
import { Size } from "~/@types";

interface ImagePanelProps {
  image: ImageData;
  urlForImage: (im: ImageData) => string;
  dimensionsForImage?: (im: ImageData) => Size;
  /** A number between 0 and 1 controlling the size of the image relative to its container */
  zoom?: number | null;
  children?: ReactNode;
}

interface ImagePanelState {
  windowWidth: number;
  imageSize: Size | null;
}

async function imageSize(url: string): Size {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      let { width, height } = this;
      return resolve({ width, height });
    };
    return (img.src = url);
  });
}

class ScaledImagePanel extends Component<ImagePanelProps, ImagePanelState> {
  state = {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    imageSize: null,
  };
  render() {
    const { zoom = 1, image } = this.props;
    const { windowWidth, windowHeight, imageSize } = this.state;
    if (image == null || imageSize == null) return null;
    let { width, height } = imageSize;

    // Clamp to integer scalings for simplicity
    const maxScaleFactor = Math.max(
      width / Math.min(2000, windowWidth - 24),
      1
    );
    const minScaleFactor = Math.max(
      height / Math.min(3000, windowHeight - 74),
      1
    );

    let scaleFactor = minScaleFactor + zoom * (maxScaleFactor - minScaleFactor);
    console.log(scaleFactor, zoom);

    height /= scaleFactor;
    width /= scaleFactor;

    const src = this.props.urlForImage(this.props.image);

    return h(
      CanvasSizeProvider,
      { width, height, scaleFactor },
      h("div.image-container", { style: { width, height } }, [
        h("img", { src, width, height }),
        this.props.children,
      ])
    );
  }

  async getImageDimensions() {
    const { image } = this.props;
    if (!image) return null;
    let sz = this.props.dimensionsForImage?.(image);

    if (sz?.width != null && sz?.height != null) return Promise.resolve(sz);

    // Make sure we have image dimensions set before loading an image
    // into the UI
    const imageURL = this.props.urlForImage(image);
    console.log(imageURL);
    return imageSize(imageURL);
  }

  async didUpdateImage(prevProps) {
    if (prevProps?.image == this.props.image) return;
    console.log("Calling didUpdateImage");
    const sz = await this.getImageDimensions();
    console.log(sz);
    this.setState({ imageSize: sz });
  }

  componentDidMount() {
    this.didUpdateImage.apply(this, arguments);
    window.addEventListener("resize", () =>
      this.setState({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      })
    );
  }

  componentDidUpdate() {
    this.didUpdateImage.apply(this, arguments);
  }
}

export { ScaledImagePanel };
