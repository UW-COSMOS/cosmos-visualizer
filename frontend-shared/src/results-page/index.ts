/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';
import 'd3-jetpack';
import {Navbar, Button,
        Intent, Alignment} from "@blueprintjs/core";

import {StatefulComponent, LinkButton} from '@macrostrat/ui-components';
import {PageHeader} from '../util';
import {PermalinkButton} from '../permalinks';
import {AppToaster} from '../toaster';
import {APIContext} from '../api';
import {InfoDialog} from '../info-dialog';
import {ImageContainer} from '../image-container';

const ExtractionsButton = ({image})=> {
  if (image == null) { return null; }
  return h(LinkButton, {
    to: `/view-extractions/${image.image_id}`,
    disabled: (image == null),
    text: "View tag extractions"
  });
};

// Updates props for a rectangle
// from API signature to our internal signature
// TODO: make handle multiple boxes
class ResultsPage extends StatefulComponent {
  static initClass() {
    this.defaultProps = {
      allowSaveWithoutChanges: false,
      editingEnabled: true,
      navigationEnabled: true,
      imageRoute: '/image',
      apiRoutes: ["phrases","equations","variables"]
    };
    this.contextType = APIContext;
  }
  constructor(props){
    super(props);
    this.selectAnnotation = this.selectAnnotation.bind(this);
    this.renderImageContainer = this.renderImageContainer.bind(this);
    this.renderNextImageButton = this.renderNextImageButton.bind(this);
    this.displayKeyboardShortcuts = this.displayKeyboardShortcuts.bind(this);
    this.displayInfoBox = this.displayInfoBox.bind(this);
    this.renderInfoDialog = this.renderInfoDialog.bind(this);
    this.setupTags = this.setupTags.bind(this);
    this.getImageToDisplay = this.getImageToDisplay.bind(this);
    this.onImageLoaded = this.onImageLoaded.bind(this);
    this.state = {
      infoDialogIsOpen: false,
      currentImage: null,
      editingRect: null,
      currentTag: null,
      tagStore: [],
      rectStore: [],
      initialRectStore: [],
      imageBaseURL: null
    };
  }

  selectAnnotation(i){ return () => {
    return this.updateState({editingRect: {$set: i}});
  }; }

  renderImageContainer() {
    const {currentImage, rectStore, tagStore, currentTag, lockedTags} = this.state;

    const actions = (() => { let selectAnnotation;
    return ({selectAnnotation} = this); })();

    return h(ImageContainer, {
      image: currentImage,
      imageTags: rectStore,
      tags: tagStore,
      editingEnabled: false,
      lockedTags,
      currentTag,
      actions
    });
  }

  renderNextImageButton() {
    const {navigationEnabled} = this.props;
    if (!navigationEnabled) { return null; }
    return h(Button, {
      intent: Intent.PRIMARY, text: "Next image",
      rightIcon: 'chevron-right',
      onClick: this.getImageToDisplay
    });
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

  renderInfoDialog() {
    const {infoDialogIsOpen: isOpen} = this.state;
    const {editingEnabled} = this.props;
    const {displayKeyboardShortcuts} = this;
    return h(InfoDialog, {isOpen, onClose: this.displayInfoBox(false), editingEnabled, displayKeyboardShortcuts});
  }

  render() {
    const {subtitleText, permalinkRoute} = this.props;
    const {currentImage: image} = this.state;
    return h('div.main', [
      h(Navbar, {fixedToTop: true}, [
        h(PageHeader, {subtitle: subtitleText}, [
          h(Button, {
            icon: 'info-sign',
            onClick: this.displayInfoBox()
          }, "Usage")
        ]),
        h(Navbar.Group, {align: Alignment.RIGHT}, [
          h(ExtractionsButton, {image}),
          h(PermalinkButton, {permalinkRoute, image}),
          this.renderNextImageButton()
        ])
      ]),
      this.renderImageContainer(),
      this.renderInfoDialog()
    ]);
  }

  setupTags(data){

    const tags = [{
        tag_id: "phrase",
        name: "Phrase",
        color: "#fca"
      }, {
        tag_id: "sentence",
        name: "Sentence",
        color: "#acf"
      }, {
        tag_id: "equation",
        name: "Equation",
        color: "#f22"
      }, {
        tag_id: "variable",
        name: "Variable",
        color: "#41f"
      }];

    return this.setState({
      tagStore: tags,
      currentTag: tags[0].tag_id
    });
  }

  getImageToDisplay() {
    let {nextImageEndpoint: imageToDisplay, imageRoute, initialImage} = this.props;
    const {currentImage} = this.state;
    if (initialImage && (currentImage == null)) {
      imageToDisplay = `${imageRoute}/${initialImage}`;
    }
    // We are loading an image and
    if (imageToDisplay == null) { return; }
    console.log(`Getting image from endpoint ${imageToDisplay}`);
    return this.context.get(imageToDisplay)
      .then(this.onImageLoaded);
  }

  onImageLoaded(d){
    if (Array.isArray(d) && (d.length === 1)) {
      // API returns a single-item array
      d = d[0];
    }

    const rectStore = [];
    this.setState({
      currentImage: d,
      rectStore,
      initialRectStore: rectStore
    });
    return AppToaster.show({
      message: h('div', [
        "Loaded image ",
        h("code", d.image_id),
        "."
      ]),
      intent: Intent.PRIMARY,
      timeout: 1000
    });
  }

  componentDidMount() {
    this.setupTags();
    return this.getImageToDisplay();
  }

  async didUpdateImage(prevProps, prevState){
    const {currentImage} = this.state;
    // This supports flipping between images and predicted images
    let {imageRoute} = this.props;
    if (imageRoute == null) { imageRoute = '/image'; }
    if (prevState.currentImage === currentImage) { return; }
    if (currentImage == null) { return; }
    const {image_id} = this.state.currentImage;

    let image_tags = [];
    for (let route of Array.from(this.props.apiRoutes)) {
      const t = await this.context.get(`${imageRoute}/${image_id}/${route}`);
      if (t == null) { continue; }
      image_tags = image_tags.concat(t);
    }

    console.log(image_tags);

    return this.setState({rectStore: image_tags, initialRectStore: image_tags});
  }

  componentDidUpdate() {
    return this.didUpdateImage.apply(this,arguments);
  }
}
ResultsPage.initClass();

export {ResultsPage};
