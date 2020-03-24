// An ambient type declaration for annotations

declare interface IApprovableAnnotation extends Annotation {
  annotated_cls: string|null,
}

declare interface APIAnnotation {
  // Current api-borne interface for annotations as of Mar 2020
  bounding_box: [number, number, number, number],
  class: string,
  confidence: number,
  obj_id: number,
  annotated_cls: string|null
}

// Annotation-approval features that can be posted to the API
declare interface AnnotationApprovalStatus {
  annotated_cls?: string|null,
  classification?: boolean|null,
  proposal?: boolean|null
}
