
declare interface APIExtraction {
  content: string,
  id: number|string,
  page_number: number|null,
  bytes: string
}

declare interface APIDocumentResult {
  children: APIExtraction[],
  content: string|null,
  header_bytes: string|null,
  header_id: string|number|null,
  pdf_name: string,
  context_id?: number
}
