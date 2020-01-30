/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from '@macrostrat/hyper';
import uuidv4 from 'uuid/v4';
import chroma from 'chroma-js';
import {Intent} from "@blueprintjs/core";
import T from 'prop-types';

import {StatefulComponent} from '@macrostrat/ui-components';
import {AppToaster} from '../toaster';
import {APIContext, ErrorMessage} from '../api';
import {ImageContainer} from '../image-container';
import {AnnotationActions} from '../editor/types';
import {PageFrame} from './frame'
import {
  TagsProvider,
  AnnotationEditorProvider,
  Tag,
  AnnotationArr
} from '~/providers'

const isDifferent = (a1: any[], a2: any[]): boolean =>{
  if (a1.length == 0 && a2.length == 0) {
    return false;
  }
  return a1 != a2;
}

// Updates props for a rectangle
// from API signature to our internal signature
// TODO: make handle multiple boxes
class TaggingPage extends StatefulComponent {
  static defaultProps = {
    allowSaveWithoutChanges: false,
    editingEnabled: true,
    navigationEnabled: true,
    imageRoute: '/image'
  };
  static propTypes = {
    stack_id: T.string
  };
  static contextType = APIContext;
  constructor(props){
    super(props);
    this.currentStackID = this.currentStackID.bind(this);
    this.onImageLoaded = this.onImageLoaded.bind(this);

    this.state = {
      infoDialogIsOpen: false,
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

  clearChanges() {
    const {initialRectStore} = this.state;
    return this.updateState({
      rectStore: {$set: initialRectStore},
      editingRect: {$set: null}
    });
  }

  render() {
    const {subtitleText} = this.props;
    const {currentImage: image} = this.state;
    const {
      initialRectStore,
      rectStore,
      editingRect,
      tagStore,
      currentTag,
      lockedTags
    } = this.state;
    const {editingEnabled} = this.props;

    return h(TagsProvider, {tags: tagStore}, [
      h(AnnotationEditorProvider, {
        initialAnnotations: initialRectStore
      }, [
        h(PageFrame, {
          hasChanges: false,
          subtitleText,
          editingEnabled,
          hasInitialContent: initialRectStore.length != 0,
          onSave: this.saveData.bind(this),
          onClearChanges: this.clearChanges.bind(this),
          currentImage: image,
          getNextImage: this.getImageToDisplay.bind(this)
        }, [
          image == null ? null : h(ImageContainer, {
            editingEnabled,
            image
          })
        ])
      ])
    ])
  }

  currentStackID() {
    return (this.state.currentImage.stack_id || this.props.stack_id) || "default_to_tag";
  }


  saveData = async () => {
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

  setupTags(data){

    const cscale = chroma.scale('viridis')
      .colors(data.length);

    const tags = data.map(function(d, ix){
      let {tag_id, color, name} = d;

      if ((name == null)) {
        name = tag_id.replace("-", " ");
        name = name.charAt(0).toUpperCase()+name.slice(1);
      }
      if (color == null) { color = cscale[ix]; }
      return {tag_id, color, name};});

    return this.setState({
      tagStore: tags,
      currentTag: tags[0].tag_id
    });
  }

  getImageToDisplay = async () => {
    let {nextImageEndpoint: imageToDisplay,
     imageRoute, initialImage, stack_id} = this.props;
    const {currentImage} = this.state;
    if (initialImage && (currentImage == null)) {
      imageToDisplay = `${imageRoute}/${initialImage}`;
    }

    var hacky_stack_id = "tag_more";

    if (imageToDisplay == null) { return; }
    console.log(`Getting image from endpoint ${imageToDisplay}`);
    const d = await this.context.get(imageToDisplay, {stack_id: hacky_stack_id}, {unwrapResponse(res){ console.log(`res: ${res}`); console.log(`res.results: ${res.results}`); return res.data; }});
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
    return this.getImageToDisplay();
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

export {TaggingPage};
