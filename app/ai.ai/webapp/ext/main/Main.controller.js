sap.ui.define([
  "sap/fe/core/PageController",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (PageController, MessageToast, MessageBox) {
  "use strict";

  return PageController.extend("ai.ai.ext.main.Main", {
    onPress: async function () {
      console.log("=== Button clicked ===");
      
      const sPrompt = "Complete: A capital da Itália é ";
      
      try {
        // First, let's check what's available
        console.log("Window location:", window.location.href);
        console.log("Base URL:", window.location.origin);
        
        const serviceUrl = "/service/askService/Ask";
        console.log("Service URL:", serviceUrl);

        const requestBody = { prompt: sPrompt };
        console.log("Request body:", requestBody);

        const response = await fetch(serviceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        console.log("=== Response received ===");
        console.log("Status:", response.status);
        console.log("StatusText:", response.statusText);
        console.log("OK:", response.ok);
        console.log("Headers:");
        for (let [key, value] of response.headers.entries()) {
          console.log(`  ${key}: ${value}`);
        }

        // Check if we have any response at all
        const responseText = await response.text();
        console.log("Response length:", responseText.length);
        console.log("Response text:", responseText);

        if (!response.ok) {
          console.error("HTTP Error:", response.status, responseText);
          throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
        }

        if (!responseText || responseText.trim() === '') {
          console.error("Empty response received");
          throw new Error("Resposta vazia do servidor");
        }

        let result;
        try {
          result = JSON.parse(responseText);
          console.log("Parsed JSON:", result);
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
          console.error("Raw response:", responseText);
          throw new Error(`Erro ao parsear JSON: ${parseErr.message}`);
        }

        const sResposta = result?.value || result || "Resposta não encontrada";
        console.log("Final response:", sResposta);
        
        MessageToast.show(`LLM: ${sResposta}`);

      } catch (err) {
        console.error("=== Error in onPress ===");
        console.error("Error:", err);
        console.error("Stack:", err.stack);
        MessageBox.error(`Erro detalhado: ${err.message}`);
      }
    }
  });
});