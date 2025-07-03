const cds = require('@sap/cds');

module.exports = async function (request) {
  const { fileID, filename, uploadedAt } = request.data;

  if (!fileID || !filename || !uploadedAt) {
    return request.reject(400, "Campos obrigatórios ausentes: fileID, filename e uploadedAt.");
  }

  const db = await cds.connect.to('db');

  try {
    // Busca os chunks ordenados
    const chunks = await db.run(
      SELECT.from('PdfFile.PdfChunk')
        .where({ fileID })
        .orderBy('chunkIndex asc')
    );

    if (!chunks.length) {
      return request.reject(404, `Nenhum chunk encontrado para o fileID ${fileID}`);
    }

    const fullBase64 = chunks.map(c => c.file).join('');

    // Log informativo
    console.log(`[assembleFile] fileID=${fileID}, chunks=${chunks.length}, fileSize=${fullBase64.length} bytes (base64)`);

    // Tenta atualizar primeiro
    const updated = await db.run(
      UPDATE('PdfFile.PdfFile')
        .set({ filename, uploadedAt, file: fullBase64 })
        .where({ fileID })
    );

    if (updated === 0) {
      await db.run(
        INSERT.into('PdfFile.PdfFile').entries({
          fileID,
          filename,
          uploadedAt,
          file: fullBase64
        })
      );
    }

    // Remove os chunks temporários
    await db.run(
      DELETE.from('PdfFile.PdfChunk').where({ fileID })
    );

    return {
      message: "Arquivo montado e salvo com sucesso.",
      fileID,
      fileSize: fullBase64.length
    };

  } catch (error) {
    console.error("Erro ao montar arquivo:", error);
    return request.reject(500, `Erro ao montar arquivo: ${error.message}`);
  }
};
