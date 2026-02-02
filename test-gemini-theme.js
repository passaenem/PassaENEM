
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyBTmbqGHYtSW_YIVXnwzfa3nruxnL3VTjc";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testThemeGeneration() {
    try {
        console.log("Initializing model... Trying gemini-2.0-flash");
        // Update to the model found in the working correction route
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Gere um tema de redação no estilo ENEM. 
        O tema deve ser atual, relevante para a sociedade brasileira e seguir o padrão de frase temática do ENEM (ex: "Os desafios de...", "A importância de...", "Caminhos para combater...").
        Além do tema, gere um pequeno texto motivador (texto de apoio) de 1 parágrafo (aprox. 50-80 palavras) dando contexto sobre o assunto, citando algum dado ou fato relevante.
        
        Retorne APENAS um JSON no seguinte formato, sem markdown ou code blocks:
        {
            "theme": "O tema gerado aqui",
            "support_text": "O texto de apoio aqui"
        }`;

        console.log("Sending prompt to Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        console.log("\nRAW OUTPUT START:");
        console.log(text);
        console.log("RAW OUTPUT END\n");

        // Robust JSON extraction logic from route.ts
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');

        let jsonString = text;
        if (startIndex !== -1 && endIndex !== -1) {
            jsonString = text.substring(startIndex, endIndex + 1);
        }

        console.log("Extracted JSON String:", jsonString);

        const data = JSON.parse(jsonString);
        console.log("\nParsed Data:");
        console.log("Theme:", data.theme);
        console.log("Support Text:", data.support_text);
        console.log("\nSUCCESS! Logic works.");

    } catch (error) {
        console.error("ERROR:", error);
    }
}

testThemeGeneration();
