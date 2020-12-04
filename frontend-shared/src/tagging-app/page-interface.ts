import h from "@macrostrat/hyper";
import { Intent } from "@blueprintjs/core";
import T from "prop-types";

import { join } from "path";
import { ImageOverlay } from "~/image-overlay";
import { ScaledImagePanel } from "~/page-interface/scaled-image";
import { StatefulComponent, APIActions } from "@macrostrat/ui-components";
import { Component, createContext } from "react";
import { AppToaster } from "../toaster";
import { APIContext, ErrorMessage } from "~/api";
import { PageFrame } from "~/page-interface";
import { APITagsProvider, AnnotationEditorProvider } from "~/providers";

interface DocumentPageProvider {
  getRandomPage();
  getPermalink();
  getNextPageInDocument();
}

const ImageStoreContext = createContext({});

function ImageStoreProvider(props) {
  const { baseURL, publicURL, children } = props;
  if (baseURL == null) {
    throw "baseURL for image store must be set in context";
  }
  const value = { baseURL, publicURL };
  return h(ImageStoreContext.Provider, { value }, children);
}

interface ContainerProps {}
interface ContainerState {}

class ImageContainer extends Component<ContainerProps, ContainerState> {
  static defaultProps = {
    image: null,
    stackName: "images_to_tag",
  };
  static contextType = ImageStoreContext;
  constructor(props: ContainerProps) {
    super(props);
    this.state = { image: null };
  }
  componentDidUpdate(nextProps) {
    // Store prevUserId in state so we can compare when props change.
    // Clear out any previously-loaded user data (so we don't render stale stuff).
    let oldId;
    const { image } = nextProps;
    try {
      oldId = this.state.image.image_id;
    } catch (error) {
      oldId = null;
    }
    console.log("Updating image");
    if (image == null) return;
    if (nextProps.image == this.state.image) return;
    if (nextProps.image._id === oldId) return;
    this.setState({ image });
  }

  imageURL(image) {
    const { stackName } = this.props;
    //console.log(`image: ${image}`)
    //const {resize_bytes} = image;
    //return "data:image/png;base64," + resize_bytes;
    const prefix = "https://xdddev.chtc.io/tagger";
    const imgPath = image.file_path.replace(/^(\/data\/pngs)/, "/images");

    return join(prefix, imgPath);
  }

  render() {
    const { image } = this.state;
    if (image == null) return null;
    return h(
      ScaledImagePanel,
      {
        image,
        urlForImage: this.imageURL.bind(this),
      },
      h(ImageOverlay)
    );
  }
}

// Updates props for a rectangle
// from API signature to our internal signature
// TODO: make handle multiple boxes
class TaggingPage extends StatefulComponent {
  static defaultProps = {
    allowSaveWithoutChanges: false,
    editingEnabled: true,
    navigationEnabled: true,
    imageRoute: "/image",
  };
  static propTypes = {
    stack_id: T.string,
  };
  static contextType = APIContext;
  constructor(props) {
    super(props);

    this.state = {
      currentImage: null,
      initialRectStore: [],
      imageBaseURL: null,
      tagStore: [],
    };
  }

  render() {
    const { subtitleText } = this.props;
    const { currentImage: image, tagStore } = this.state;
    const { initialRectStore } = this.state;
    const { editingEnabled } = this.props;

    return h(APITagsProvider, [
      h(
        AnnotationEditorProvider,
        {
          initialAnnotations: initialRectStore,
          editingEnabled: true,
        },
        h(
          PageFrame,
          {
            subtitleText,
            editingEnabled,
            currentImage: image,
            getNextImage: this.getImageToDisplay.bind(this),
          },
          h(ImageContainer, {
            editingEnabled,
            image,
          })
        )
      ),
    ]);
  }

  saveData = async () => {
    const { currentImage, rectStore } = this.state;
    let { extraSaveData } = this.props;
    if (extraSaveData == null) {
      extraSaveData = {};
    }

    const saveItem = {
      tags: rectStore,
      ...extraSaveData,
    };

    // TODO: Fix this
    // Set the current stack ID to save data with
    const stack_id =
      this.state.currentImage.stack_id ||
      this.props.stack_id ||
      "default_to_tag";

    const endpoint = `/image/${currentImage.image_id}/${stack_id}/tags`;

    try {
      const newData = await this.context.post(endpoint, saveItem, {
        handleError: false,
      });
      AppToaster.show({
        message: "Saved data!",
        intent: Intent.SUCCESS,
      });
      this.updateState({
        rectStore: { $set: newData },
        initialRectStore: { $set: newData },
      });
      return true;
    } catch (err) {
      AppToaster.show(
        ErrorMessage({
          title: "Could not save tags",
          method: "POST",
          endpoint,
          error: err.toString(),
          data: saveItem,
        })
      );
      console.log("Save rejected");
      console.log(err);
      return false;
    }
  };

  getImageToDisplay = async () => {
    let {
      nextImageEndpoint: imageToDisplay,
      imageRoute,
      initialImage,
      stack_id,
    } = this.props;
    const { currentImage } = this.state;
    if (initialImage && currentImage == null) {
      imageToDisplay = `${imageRoute}/${initialImage}`;
    }

    var hacky_stack_id = "mars";

    // Should switch to newer hooks-based API
    const { get } = APIActions(this.context);

    if (imageToDisplay == null) {
      return;
    }
    console.log(`Getting image from endpoint ${imageToDisplay}`);
    const d = await get(
      "dsadgaer",
      //imageToDisplay,
      { stack_name: hacky_stack_id },
      {
        unwrapResponse(res) {
          console.log(`res: ${res}`);
          console.log(`res.results: ${res.results}`);
          return res.data;
        },
      }
    );
    // On image loaded

    if (Array.isArray(d) && d.length === 1) {
      // API returns a single-item array
      d = d[0];
    }
    if (this.state.currentImage == d) return;

    const rectStore = [];
    this.setState({
      currentImage: d,
      rectStore,
      initialRectStore: rectStore,
    });

    AppToaster.show({
      message: h("div", ["Loaded image ", h("code", d._id), "."]),
      intent: Intent.PRIMARY,
      timeout: 1000,
    });
  };

  componentDidMount() {
    return this.getImageToDisplay();
  }

  didUpdateImage(prevProps, prevState) {
    const { currentImage } = this.state;
    // This supports flipping between images and predicted images
    let { imageRoute } = this.props;
    if (imageRoute == null) {
      imageRoute = "/image";
    }
    if (prevState.currentImage === currentImage) {
      return;
    }
    if (currentImage == null) {
      return;
    }

    const image_tags = [];
    console.log("Did update");
    return this.setState({
      rectStore: image_tags,
      initialRectStore: image_tags,
    });
  }

  componentDidUpdate() {
    return this.didUpdateImage.apply(this, arguments);
  }
}

export { ImageStoreProvider, TaggingPage };
