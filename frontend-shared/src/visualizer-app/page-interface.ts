import h from 'react-hyperscript';
import {Intent} from "@blueprintjs/core";
import {StatefulComponent} from '@macrostrat/ui-components';
import {ReactNode} from 'react'
import {AppToaster} from '../toaster';
import {APIContext} from '../api';
import {Image} from '~/types'
import {PageFrame, ScaledImagePanel} from '~/page-interface'
import {
  APITagsProvider,
  AnnotationArr,
  Annotation,
  AnnotationsProvider,
} from '~/providers'
import {AnnotationApproverProvider} from '../providers/annotation-approver'
import {AnnotationLinks} from '../image-overlay/annotation-links';
import {AnnotationsOverlay} from '../image-overlay/annotations';
import {ApprovableAnnotation} from '../image-overlay/annotation'

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
  const {children, image} = props
  const annotations = image.pp_detected_objs
  const {pdf_name, page_num} = image
  // For viewer
  return h(AnnotationsProvider, {
    annotations: (annotations ?? []).map(normalizeAnnotation),
    allowSelection: true
  }, h(AnnotationApproverProvider, {pdf_name, page_num}, children)
  )
}

interface ContainerProps {
  image: ImageData
}

const ImageContainer = (props: ContainerProps)=>{
  const {image} = props
  if (image == null) return null
  return h(PageDataProvider, {image}, [
    h(ScaledImagePanel, {
      image,
      urlForImage(image: Image): string {
        const {resize_bytes} = image;
        return "data:image/png;base64," + resize_bytes;
      }
    },
      h('div.image-overlay', [
        h(AnnotationsOverlay, {
          renderAnnotation: (a)=>h(ApprovableAnnotation, {obj: a})
        }),
        h(AnnotationLinks)
      ])
    )
  ]);
}

interface IViewerProps {
  allowSaveWithoutChanges?: boolean,
  imageRoute: string
}

interface ViewerState {
  currentImage: Image,
}

// Updates props for a rectangle
// from API signature to our internal signature
// TODO: make handle multiple boxes
// TODO: reintegrate with Tagging page
class ViewerPageBase extends StatefulComponent<IViewerProps, ViewerState> {
  static defaultProps = {
    allowSaveWithoutChanges: false,
    editingEnabled: true,
    navigationEnabled: true,
    imageRoute: '/image'
  };
  static contextType = APIContext;
  constructor(props: IViewerProps){
    super(props);
    this.onImageLoaded = this.onImageLoaded.bind(this);

    this.state = {
      currentImage: null
    };
  }

  render() {
    const {subtitleText} = this.props;
    const {currentImage: image} = this.state;

    return h(APITagsProvider, [
      h(PageFrame, {
        subtitleText,
        currentImage: image,
        getNextImage: this.getImageToDisplay.bind(this)
      }, h(ImageContainer, {image}))
    ])
  }

  currentStackID() {
    return this.state.currentImage.stack_id || this.props.stack_id;
  }

  async getImageToDisplay() {
    let {nextImageEndpoint: imageToDisplay,
     imageRoute, initialImage, stack_id} = this.props;
    const {currentImage} = this.state;
    if (initialImage && (currentImage == null)) {
      imageToDisplay = `${imageRoute}/${initialImage}`;
    }
    // We are loading an image and
    if (imageToDisplay == null) { return; }
    console.log(`Getting image from endpoint ${imageToDisplay}`);
    const d = await this.context.get(imageToDisplay, {stack_id}, {unwrapResponse(res){ return res.results; }});
    return this.onImageLoaded(d);
  };

  onImageLoaded(d){
    if (Array.isArray(d) && (d.length === 1)) {
      // API returns a single-item array
      d = d[0];
    }
    console.log(d);

    const rectStore = [];
    this.setState({
      currentImage: d,
      rectStore,
      initialRectStore: rectStore
    });

    return AppToaster.show({
      message: h('div', [
        "Loaded image ",
        h("code", d._id),
        "."
      ]),
      intent: Intent.PRIMARY,
      timeout: 1000
    });
  }

  componentDidMount() {
    this.getImageToDisplay();
  }

  didUpdateImage(prevProps, prevState){
    const {currentImage} = this.state;
    // This supports flipping between images and predicted images
    let {imageRoute} = this.props;
    if (imageRoute == null) { imageRoute = '/image'; }
    if (prevState.currentImage === currentImage) return
    if (currentImage == null) return
  }

  componentDidUpdate() {
    return this.didUpdateImage.apply(this,arguments);
  }
}


const ViewerPage = ({match, ...rest})=> {
  // Go to specific image by default, if set
  const {params: {imageId}} = match;

  // This is a hack to disable "NEXT" for now
  // on permalinked images
  if ((imageId != null) && (rest.navigationEnabled == null)) {
    rest.navigationEnabled = false;
  }

  return h(ViewerPageBase, {
    initialImage: imageId,
    allowSaveWithoutChanges: false,
    editingEnabled: false,
    ...rest
  });
};

export {ViewerPage}
