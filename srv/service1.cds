@path : '/service/pdfService'
service pdfService {
  action uploadChunk(
    fileID: UUID,
    chunkIndex: Integer,
    file: LargeString
  );

  action assembleFile(
    fileID: UUID,
    filename: String,
    uploadedAt: Timestamp
  );
}

annotate pdfService with @requires: ['authenticated-user'];
