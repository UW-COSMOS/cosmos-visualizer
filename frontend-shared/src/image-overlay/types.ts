export type TagRect = [number, number, number, number]
export type AnnotationArr = [TagRect, string, number]

export interface ITag {
  color: string,
  name: string,
  tag_id: number
}

export interface Annotation {
  boxes: TagRect[],
  tag_id: string,
  name: string,
  score?: number,
}
