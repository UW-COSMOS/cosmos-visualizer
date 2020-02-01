import h from 'react-hyperscript';
import chroma from 'chroma-js';
import {Intent} from "@blueprintjs/core";
import {StatefulComponent, useAPIResult} from '@macrostrat/ui-components';
import {AppToaster} from '../toaster';
import {APIContext, ErrorMessage} from '../api';
import {Image} from '~/types'
import {ImageContainer} from './image-container';
import {PageFrame} from '../page-interface'
import {APITagsProvider, Tag, AnnotationArr} from '~/providers'

const isDifferent = (a1: any[], a2: any[]): boolean =>{
  if (a1.length == 0 && a2.length == 0) {
    return false;
  }
  return a1 != a2;
}

interface IViewerProps {
  allowSaveWithoutChanges?: boolean,
  imageRoute: string
}

interface ViewerState {
  currentImage: Image,ˇ
  editingRect: number|null,
  currentTag: number|null,
  tagStore: Tag[],
  rectStore: AnnotationArr[],
  initialRectStore: AnnotationArr[]
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
      currentImage: null,
      editingRect: null,
      currentTag: null,
      tagStore: [],
      rectStore: [],
      initialRectStore: [],
      imageBaseURL: null,
      lockedTags: new Set()
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


  async saveData(){
    const {currentImage, rectStore} = this.state;
    let {extraSaveData} = this.props;
    if (extraSaveData == null) { extraSaveData = {}; }

    const saveItem = {
      tags: rectStore,
      ...extraSaveData
    };

    const stack_id = this.currentStackID();

    const endpoint = `/image/${currentImage.image_id}/${stack_id}/tags`;

    try {
      const newData = await this.context.post(endpoint, saveItem, {
        handleError: false
      });
      AppToaster.show({
        message: "Saved data!",
        intent: Intent.SUCCESS
      });
      this.updateState({
        rectStore: {$set: newData},
        initialRectStore: {$set: newData}
      });
      return true;
    } catch (err) {
      AppToaster.show(ErrorMessage({
        title: "Could not save tags",
        method: 'POST',
        endpoint,
        error: err.toString(),
        data: saveItem
      }));
      console.log("Save rejected");
      console.log(err);
      return false;
    }
  };

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
    if (prevState.currentImage === currentImage) { return; }
    if (currentImage == null) { return; }

    const image_tags = [];
    return this.setState({rectStore: image_tags, initialRectStore: image_tags});
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
