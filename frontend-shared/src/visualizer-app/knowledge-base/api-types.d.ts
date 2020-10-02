declare interface APIExtraction {
  content: string;
  id: number | string;
  page_number: number | null;
  bytes: string;
  cls: string;
  base_confidence?: number;
  postprocessing_confidence?: number;
}

declare interface APIDocumentResult {
  bibjson: object;
  children: APIExtraction[];
  header: APIExtraction;
  pdf_name: string;
  context_id?: number;
}
