import T from 'prop-types';

// Shape for image API response
const ImageShape = T.shape({
  created: T.string,
  doc_id: T.string.isRequired,
  file_path: T.string,
  image_id: T.string,
  page_no: T.number,
  stack_id: T.string.isRequired
});

const PageExtractionShape = T.shape({
  _id: T.string.isRequired, // how we identify the page object in the COSMOS system
  page_num: T.number.isRequired, // page number within the pdf
  pdf_id: T.string.isRequired, // ID of the pdf in COSMOS
  pdf_name: T.string,
  pp_detected_objs: T.arrayOf(T.array),
  resize_bytes: T.string.isRequired,
  page_height: T.number.isRequired,
  page_width: T.number.isRequired
});

interface Image {
  created: string,
  doc_id: string,
  file_path: string,
  image_id: string,
  page_no: number,
  stack_id?: string
}

export {ImageShape, PageExtractionShape, Image};
