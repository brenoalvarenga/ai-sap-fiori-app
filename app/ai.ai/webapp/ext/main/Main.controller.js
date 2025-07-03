sap.ui.define([
  "sap/fe/core/PageController",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (PageController, MessageToast, MessageBox) {
  "use strict";

  return PageController.extend("ai.ai.ext.main.Main", {

    onChange: async function () {
      const oFileUploader = this.byId("fileUploader");
      const oFile = oFileUploader.getDomRef("fu")?.files[0];

      if (!oFile) {
        MessageToast.show("Please upload a PDF file.");
        return;
      }

      if (oFile.type !== "application/pdf") {
        MessageToast.show("Only PDF files are allowed.");
        return;
      }

      sap.ui.core.BusyIndicator.show();

      try {
        const base64String = await this._readFileAsBase64(oFile);

        const fileID = this._generateUUID();
        const filename = oFile.name;
        const uploadedAt = new Date().toISOString();

        const chunkSize = 100000;
        const totalChunks = Math.ceil(base64String.length / chunkSize);

        for (let i = 0; i < totalChunks; i++) {
          const chunk = base64String.slice(i * chunkSize, (i + 1) * chunkSize);

          const chunkPayload = {
            fileID,
            chunkIndex: i,
            file: chunk
          };

          const chunkResponse = await fetch("/service/pdfService/uploadChunk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(chunkPayload)
          });

          if (!chunkResponse.ok) {
            const errText = await chunkResponse.text();
            throw new Error(`Erro no upload do chunk ${i + 1}: ${errText || chunkResponse.statusText}`);
          }
        }

        const finalizePayload = { fileID, filename, uploadedAt };
        const finalizeResponse = await fetch("/service/pdfService/assembleFile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalizePayload)
        });

        const responseText = await finalizeResponse.text();

        if (!finalizeResponse.ok) {
          throw new Error(`Erro ao montar arquivo: ${responseText || finalizeResponse.statusText}`);
        }

        let finalizeResult = {};
        try {
          finalizeResult = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          throw new Error(`Erro ao parsear resposta do servidor: ${parseError.message}`);
        }

        MessageToast.show(finalizeResult.message || "PDF enviado com sucesso!");
        oFileUploader.clear();

      } catch (error) {
        MessageBox.error(`Erro ao enviar PDF: ${error.message}`);
        console.error("Erro no upload do PDF:", error);
      } finally {
        sap.ui.core.BusyIndicator.hide();
      }
    },

    _readFileAsBase64: function (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    _generateUUID: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0,
              v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    onPress: async function () {
      console.log("=== Button clicked ===");

      const sPrompt = "Complete: A capital da Australia é ";

      try {
        const serviceUrl = "/service/askService/Ask";
        const requestBody = { prompt: sPrompt };

        const response = await fetch(serviceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
        }

        if (!responseText || responseText.trim() === '') {
          throw new Error("Resposta vazia do servidor");
        }

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseErr) {
          throw new Error(`Erro ao parsear JSON: ${parseErr.message}`);
        }

        const sResposta = result?.value || result || "Resposta não encontrada";
        MessageToast.show(`LLM: ${sResposta}`);

      } catch (err) {
        console.error("=== Error in onPress ===", err);
        MessageBox.error(`Erro detalhado: ${err.message}`);
      }
    }
  });
});
