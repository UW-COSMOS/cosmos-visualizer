import h from 'react-hyperscript'
import {TaggingPage} from './tagging'

const ViewerPage = ({match, ...rest})=> {
  // Go to specific image by default, if set
  const {params: {imageId}} = match;

  // This is a hack to disable "NEXT" for now
  // on permalinked images
  if ((imageId != null) && (rest.navigationEnabled == null)) {
    rest.navigationEnabled = false;
  }

  return h(TaggingPage, {
    initialImage: imageId,
    allowSaveWithoutChanges: false,
    editingEnabled: false,
    ...rest
  });
};

export {ViewerPage}
