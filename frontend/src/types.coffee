import T from 'prop-types'

# Shape for image API response
ImageShape = T.shape {
  created: T.string
  doc_id: T.string.isRequired
  file_path: T.string
  image_id: T.string
  page_no: T.number
  stack_id: T.string.isRequired
}

export {ImageShape}
