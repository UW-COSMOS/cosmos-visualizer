type TagID = string

export type TagRect = [number, number, number, number]
export type AnnotationArr = [TagRect, TagID, number]

export interface ITag {
  color: string,
  name: string,
  tag_id: TagID
}

export interface Annotation {
  boxes: TagRect[],
  tag_id: TagID,
  name: string,
  score?: number,
}
