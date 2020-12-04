export type TagID = string;
export interface Tag {
  color: string;
  name: string;
  tag_id: TagID;
}

export type AnnotationRect = [number, number, number, number];
export type AnnotationArr = [AnnotationRect, TagID, number];

// Really, this is an index
export type AnnotationID = number;
export interface Annotation {
  boxes: AnnotationRect[];
  tag_id: TagID;
  // Potentially, the uuid of another tag on the page
  image_tag_id?: string;
  score?: number;
  obj_id?: number;
}
