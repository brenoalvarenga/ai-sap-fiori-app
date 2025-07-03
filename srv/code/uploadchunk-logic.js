const cds = require('@sap/cds');

module.exports = async function (request) {
  const { fileID, chunkIndex, file } = request.data;

  if (!fileID || chunkIndex === undefined || !file) {
    return request.reject(400, "Campos obrigatórios ausentes: fileID, chunkIndex, file.");
  }

  const db = await cds.connect.to('db');

  try {
    const updated = await db.run(
      UPDATE('PdfFile.PdfChunk')
        .set({ file })
        .where({ fileID, chunkIndex })
    );

    if (updated === 0) {
      await db.run(
        INSERT.into('PdfFile.PdfChunk').entries({
          fileID,
          chunkIndex,
          file
        })
      );
    }

    return { message: `Chunk ${chunkIndex + 1} salvo com sucesso.` };

  } catch (error) {
    console.error("Erro ao salvar chunk:", error);
    return request.reject(500, `Erro ao salvar chunk: ${error.message}`);
  }
};
