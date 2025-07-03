const cds = require('@sap/cds');

// Cache temporário para armazenar chunks por ID
const fileChunksCache = new Map();

module.exports = async function(request) {
  const {
    ID,
    filename,
    uploadedAt,
    chunkIndex,
    totalChunks,
    chunkData // base64 string do fragmento
  } = request.data;

  // Validações básicas
  if (!ID || !filename || !uploadedAt || chunkIndex === undefined || !totalChunks || !chunkData) {
    return request.reject(400, "Campos obrigatórios ausentes: ID, filename, uploadedAt, chunkIndex, totalChunks e chunkData.");
  }

  try {
    // Pega ou cria estrutura de chunks para o arquivo
    let fileEntry = fileChunksCache.get(ID);
    if (!fileEntry) {
      fileEntry = {
        filename,
        uploadedAt,
        chunks: new Array(totalChunks).fill(null),
        receivedCount: 0
      };
      fileChunksCache.set(ID, fileEntry);
    }

    // Salva o chunk na posição correta se ainda não existe
    if (!fileEntry.chunks[chunkIndex]) {
      fileEntry.chunks[chunkIndex] = chunkData;
      fileEntry.receivedCount++;
    }

    // Se ainda não recebeu todos os chunks, retorna status de progresso
    if (fileEntry.receivedCount < totalChunks) {
      return {
        message: `Chunk ${chunkIndex + 1}/${totalChunks} recebido.`,
        receivedChunks: fileEntry.receivedCount
      };
    }

    // Todos os chunks recebidos, concatena base64 completos
    const fullBase64 = fileEntry.chunks.join('');

    // Conecta ao DB
    const db = await cds.connect.to('db');

    // Insere ou atualiza no banco
    await db.run(
      INSERT.into('PdfFile.PdfFile').entries({
        ID,
        filename: fileEntry.filename,
        uploadedAt: fileEntry.uploadedAt,
        file: fullBase64
      })
    );

    // Limpa cache
    fileChunksCache.delete(ID);

    return {
      message: "Arquivo completo recebido e salvo com sucesso.",
      size: fullBase64.length
    };

  } catch (error) {
    console.error("Erro no upload chunked:", error);
    return request.reject(500, `Erro no upload chunked: ${error.message}`);
  }
};
