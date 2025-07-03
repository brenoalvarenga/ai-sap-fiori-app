namespace PdfFile;

entity PdfFile {
  key fileID: UUID;
  filename: String;
  totalChunks: Integer;
  uploadedAt: Timestamp;
}

entity PdfChunk {
  key fileID: UUID;
  key chunkIndex: Integer;
  file: LargeString; // ou LargeBinary
}
