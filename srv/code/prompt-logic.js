const path = require("path");
const dotenv = require("dotenv");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

// Load environment variables
dotenv.config({ path: path.resolve("env/.env") });

/**
 * @On(event = { "Ask" })
 * @param {cds.Request} request - User information, tenant-specific CDS model, headers and query parameters
 */
module.exports = async function(request) {
    console.log("=== Ask action handler called ===");
    console.log("Request data:", request.data);
    console.log("Request user:", request.user?.id || 'anonymous');
    
    try {
        const { prompt } = request.data;

        if (!prompt) {
            console.log("ERROR: No prompt provided");
            request.error(400, "Parâmetro 'prompt' é obrigatório.");
            return;
        }

        console.log("Processing prompt:", prompt);
        console.log("GOOGLE_API_KEY available:", !!process.env.GOOGLE_API_KEY);

        // Check if API key is available
        if (!process.env.GOOGLE_API_KEY) {
            console.error("GOOGLE_API_KEY not found in environment");
            request.error(500, "Configuração da API não encontrada");
            return;
        }

        // LangChain integration - now properly positioned
        try {
            const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
            
            const chat = new ChatGoogleGenerativeAI({
                model: "gemini-2.0-flash",
                apiKey: process.env.GOOGLE_API_KEY,
                temperature: 0.7,
            });

            console.log("Calling Gemini API...");
            const response = await chat.invoke(prompt);
            console.log("Gemini response:", response);

            const result = {
                value: response.content || response.text || "Sem resposta do Gemini"
            };

            console.log("=== Final result ===", result);
            return result;

        } catch (geminiError) {
            console.error("Gemini API error:", geminiError);
            console.error("Error details:", {
                message: geminiError.message,
                stack: geminiError.stack,
                name: geminiError.name
            });
            
            // Return a fallback response instead of erroring
            const fallbackResult = {
                value: `Erro ao consultar Gemini: ${geminiError.message}`
            };
            return fallbackResult;
        }

    } catch (error) {
        console.error("=== ERROR in Ask handler ===");
        console.error("Error:", error);
        console.error("Stack:", error.stack);
        request.error(500, `Erro interno do servidor: ${error.message}`);
        return;
    }
};