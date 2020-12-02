declare type TagID = string;
declare interface Tag {
  color: string;
  name: string;
  tag_id: TagID;
}

declare type AnnotationRect = [number, number, number, number];
declare type AnnotationArr = [AnnotationRect, TagID, number];

// Really, this is an index
type AnnotationID = number;
declare interface Annotation {
  boxes: AnnotationRect[];
  tag_id: TagID;
  // Potentially, the uuid of another tag on the page
  image_tag_id?: string;
  score?: number;
  obj_id?: number;
}

// This interface might be outmoded
declare interface Image {
  created: string;
  doc_id: string;
  file_path: string;
  image_id: string;
  page_no: number;
  // This is not really a relevant concept anymore
  stack_id?: string;
}
