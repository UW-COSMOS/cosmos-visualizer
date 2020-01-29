import h from '@macrostrat/hyper';
import 'd3-jetpack';
import chroma from 'chroma-js';
import {Navbar, Button, ButtonGroup,
        Intent, Alignment} from "@blueprintjs/core";
import T from 'prop-types';

import {StatefulComponent} from '@macrostrat/ui-components';
import {PermalinkButton} from '../permalinks';
import {PageHeader} from '../util';
import {AppToaster} from '../toaster';
import {APIContext, ErrorMessage} from '../api';
import {InfoDialog} from '../info-dialog';
import {ImageContainer} from '../image-container';
import {PersistenceButtons} from './persistence-buttons'

// Updates props for a rectangle
// from API signature to our internal signature
// TODO: make handle multiple boxes
// TODO: reintegrate with Tagging page
class ViewerPageBase extends StatefulComponent {
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
    this.updateAnnotation = this.updateAnnotation.bind(this);
    this.selectAnnotation = this.selectAnnotation.bind(this);
    this.clearChanges = this.clearChanges.bind(this);
    this.uiHasChanges = this.uiHasChanges.bind(this);
    this.displayKeyboardShortcuts = this.displayKeyboardShortcuts.bind(this);
    this.displayInfoBox = this.displayInfoBox.bind(this);
    this.currentStackID = this.currentStackID.bind(this);
    this.setupTags = this.setupTags.bind(this);
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

  updateAnnotation(i){ return updateSpec=> {
    const spec = {rectStore: {[i]: updateSpec}};
    if (updateSpec.tag_id != null) {
      spec.currentTag = updateSpec.tag_id;
    }
    return this.updateState(spec);
  }; }

  selectAnnotation(i){ return () => {
    console.log(`Selecting annotation ${i}`);
    return this.updateState({editingRect: {$set: i}});
  }; }

  clearChanges() {
    const {initialRectStore} = this.state;
    return this.updateState({
      rectStore: {$set: initialRectStore},
      editingRect: {$set: null}
    });
  }

  uiHasChanges() {
    const {rectStore, initialRectStore} = this.state;
    if (initialRectStore.length === rectStore.length && rectStore.length === 0) {
      return false;
    }
    return rectStore !== initialRectStore;
  }

  displayKeyboardShortcuts() {
    // Blueprint doesn't allow us to show keyboard shortcuts programmatically
    // without simulating the keycode. Wait for resolution of
    // https://github.com/palantir/blueprint/issues/1590
    this.setState({infoDialogIsOpen: false});
    return document.dispatchEvent(new KeyboardEvent('keydown', {
      which: 47, keyCode: 47, shiftKey: true, bubbles: true }));
  }

  displayInfoBox(isOpen){ return () => {
    if (isOpen == null) { isOpen = true; }
    return this.setState({infoDialogIsOpen: isOpen});
  }; }

  render() {
    const {subtitleText, permalinkRoute} = this.props;
    const {currentImage: image} = this.state;
    const {allowSaveWithoutChanges} = this.props;
    const {initialRectStore} = this.state;
    const hasChanges = this.uiHasChanges();
    const {infoDialogIsOpen: isOpen} = this.state;
    const {editingEnabled} = this.props;

    const {editingRect, rectStore, tagStore, currentTag, lockedTags} = this.state;

    const actions = {
      updateAnnotation: this.updateAnnotation,
      selectAnnotation: this.selectAnnotation
    }

    return h('div.main', [
      h(Navbar, {fixedToTop: true}, [
        h(PageHeader, {subtitle: subtitleText}, [
          h(Button, {
            icon: 'info-sign',
            onClick: this.displayInfoBox()
          }, "Usage")
        ]),
        h(Navbar.Group, {align: Alignment.RIGHT}, [
          h(PermalinkButton, {permalinkRoute, image}),
          h(ButtonGroup, [
            h.if(this.props.editingEnabled)(PersistenceButtons, {
              hasChanges,
              allowSaveWithoutChanges,
              hasInitialContent: initialRectStore.length != 0,
              onClearChanges: this.clearChanges,
              onSave: this.saveData
            }),
            h.if(this.props.navigationEnabled)(Button, {
              intent: Intent.PRIMARY, text: "Next image",
              rightIcon: 'chevron-right',
              disabled: hasChanges,
              onClick: this.getImageToDisplay
            })
          ])
        ])
      ]),
      h.if(image != null)(ImageContainer, {
        editingRect,
        editingEnabled,
        image,
        imageTags: rectStore,
        tags: tagStore,
        lockedTags,
        currentTag,
        actions
      }),
      h(InfoDialog, {
        isOpen,
        onClose: this.displayInfoBox(false),
        editingEnabled,
        displayKeyboardShortcuts: this.displayKeyboardShortcuts.bind(this)
      })
    ]);
  }

  currentStackID() {
    return this.state.currentImage.stack_id || this.props.stack_id;
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
    this.context.get("/tags/all")
      .then(this.setupTags);
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
