declare type TagID = number
declare interface Tag {
  color: string,
  name: string,
  tag_id: TagID
}

declare type AnnotationRect = [number, number, number, number]
declare type AnnotationArr = [AnnotationRect, TagID, number]

// Really, this is an index
type AnnotationID = number
declare interface Annotation {
  boxes: AnnotationRect[],
  tag_id: TagID,
  // Potentially, the uuid of another tag on the page
  image_tag_id?: string,
  name: string,
  score?: number,
  obj_id?: number,
}
