import h from '@macrostrat/hyper';
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
import {ApprovableAnnotation} from '../image-overlay/annotation';

const normalizeAnnotation = function(d: AnnotationArr): Annotation {
  /*
  Temporary (?) function to normalize an annotation rectangle
  to the expected internal representation.
  */
  const boxes = [d.bounding_box];
  const name = d.class;
  const score = d.confidence;
  const obj_id = d.obj_id; // TODO: do this.. Really, this shouldn't be such a dumb structure.
  return {boxes, name, score, tag_id: name, obj_id};
};

interface ImageData {
  _id: string,
  pp_detected_objs?: AnnotationArr[],
  pdf_name: string,
  page_num: number
}

interface ViewerProviderProps {
  children: React.ReactChild,
  image: ImageData
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
          renderAnnotation: (a, ix)=>h(ApprovableAnnotation, {obj: a})
        }),
        h(AnnotationLinks)
      ])
    )
  ]);
}

interface IViewerProps {
  imageRoute: string,
  initialImage: string,
  redirectURL?: string
}

interface ViewerState {
  currentImage: object,
}

function notifyImageLoad(im: ImageData){
  AppToaster.show({
    message: h('div', [
      "Loaded image ",
      h("code", im._id),
      "."
    ]),
    intent: Intent.PRIMARY,
    timeout: 1000
  });
}

class ViewerPageBase extends StatefulComponent<IViewerProps, ViewerState> {
  static defaultProps = {
    allowSaveWithoutChanges: false,
    navigationEnabled: true,
    imageRoute: '/image'
  };
  static contextType = APIContext;
  constructor(props: IViewerProps){
    super(props);
    this.onImageLoaded = this.onImageLoaded.bind(this);

    this.state = {
      currentImage: null,
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

  async getImageToDisplay() {

    // If at permalink, reroute to validation or something
    const {redirectURL} = this.props;
    // if (redirectURL && currentImage != null) {
    //   this.setState({})
    // }

    let {
      nextImageEndpoint: imageToDisplay,
      imageRoute,
      initialImage,
    } = this.props;
    const {currentImage} = this.state;

    // Load image with this ID
    if (initialImage && (currentImage == null)) {
      imageToDisplay = `${imageRoute}/${initialImage}`;
    }
    // We are loading an image...
    if (imageToDisplay == null) { return; }

    console.log(`Getting image from endpoint ${imageToDisplay}`);
    const d = await this.context.get(imageToDisplay, {
      unwrapResponse(res){ return res.results }
    });
    return this.onImageLoaded(d);
  };

  onImageLoaded(d){
    if (Array.isArray(d) && (d.length === 1)) {
      // API returns a single-item array
      d = d[0];
    }
    const im = d as ImageData

    this.setState({currentImage: im});
    notifyImageLoad(im)
  }

  componentDidMount() {
    this.getImageToDisplay();
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
    editingEnabled: false,
    ...rest
  });
};

export {ViewerPage}
