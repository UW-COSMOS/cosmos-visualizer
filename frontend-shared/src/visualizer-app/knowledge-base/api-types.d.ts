
declare interface APIExtraction {
  content: string,
  id: number|string,
  page_number: number|null,
  bytes: string,
  cls: string,
  base_confidence?: number,
}

declare interface APIDocumentResult {
  children: APIExtraction[],
  header_content: string|null,
  header_cls: string,
  header_bytes: string|null,
  header_id: string|number|null,
  pdf_name: string,
  context_id?: number
}
