// TODO: delete this file, move types elsewhere...
type TagID = string

type TagRect = [number, number, number, number]
export type AnnotationArr = [TagRect, TagID, number]

export interface Annotation {
  boxes: TagRect[],
  tag_id: TagID,
  name: string,
  score?: number,
}
