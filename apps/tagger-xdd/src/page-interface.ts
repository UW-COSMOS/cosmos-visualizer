import h from "@macrostrat/hyper";
import { Intent } from "@blueprintjs/core";
import T from "prop-types";

import { ImageOverlay, StaticImageOverlay } from "~/image-overlay";
import { ScaledImagePanel } from "~/page-interface/scaled-image";
import { StatefulComponent, APIActions } from "@macrostrat/ui-components";
import { AppToaster } from "~/toaster";
import { APIContext, ErrorMessage } from "~/api";
import { PageFrame } from "~/page-interface";
import { useStack } from "~/providers/stack";
import {
  APITagsProvider,
  AnnotationEditorProvider,
  Annotation,
} from "~/providers";

type ImageContainerProps = React.PropsWithChildren<{
  image: any;
  stackName: string;
}>;

function ImageContainer(props: ImageContainerProps) {
  const { children, image } = props;
  if (image == null) return null;

  return h(
    ScaledImagePanel,
    {
      image,
      urlForImage() {
        const prefix = "https://xdddev.chtc.io/tagger";
        const imgPath = image.file_path.replace(/^(\/data\/pngs\/)/, "/images");
        return prefix + imgPath;
      },
    },
    children
  );
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
    this.getImageToDisplay = this.getImageToDisplay.bind(this);
    this.tagsEndpoint = this.tagsEndpoint.bind(this);

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

    if (image == null) return null;

    return h(APITagsProvider, [
      h(
        AnnotationEditorProvider,
        {
          initialAnnotations: initialRectStore,
          editingEnabled,
          onSave: this.saveData,
        },
        h(
          PageFrame,
          {
            subtitleText,
            editingEnabled,
            currentImage: image,
            getNextImage: this.getImageToDisplay,
          },
          h(
            ImageContainer,
            {
              editingEnabled,
              image,
            },
            editingEnabled
              ? h(ImageOverlay)
              : h(StaticImageOverlay, { tagRoute: this.tagsEndpoint() })
          )
        )
      ),
    ]);
  }

  tagsEndpoint() {
    const { currentImage } = this.state;
    // TODO: Fix this
    // Set the current stack ID to save data with
    const stack_id = "mars";
    // this.state.currentImage.stack_id ||
    // this.props.stack_id ||
    // "default_to_tag";

    return `/image/${currentImage.image_id}/${stack_id}/tags`;
  }

  saveData = async (annotations: Annotation[]) => {
    const { post } = APIActions(this.context);

    let { extraSaveData } = this.props;
    if (extraSaveData == null) {
      extraSaveData = {};
    }

    const saveItem = {
      tags: annotations,
      ...extraSaveData,
    };

    try {
      const newData = await post(this.tagsEndpoint(), saveItem, {
        handleError: false,
      });
      AppToaster.show({
        message: "Saved data!",
        intent: Intent.SUCCESS,
      });
      this.updateState({
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
    const d = await get(
      imageToDisplay,
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
    return this.setState({
      initialRectStore: image_tags,
    });
  }

  componentDidUpdate() {
    return this.didUpdateImage.apply(this, arguments);
  }
}

const WrappedTaggingPage = (props) => {
  const stack_id = useStack();
  return h(TaggingPage, { ...props, stack_id });
};

export { WrappedTaggingPage as TaggingPage };
