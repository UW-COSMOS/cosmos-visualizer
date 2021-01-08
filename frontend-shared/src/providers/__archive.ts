// This interface might be outmoded
export interface Image {
  created: string;
  doc_id: string;
  file_path: string;
  image_id: string;
  page_no: number;
  // This is not really a relevant concept anymore
  stack_id?: string;
}
