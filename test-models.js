
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyBW4Ug6dKAdotgD4cCCVF7UYJwYICrCcFw";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Fetching available models...");
        // There isn't a direct listModels method on the client instance in some versions, 
        // but let's try the generativeModel generic call or just fallback to 'gemini-pro' which is the v1 standard.

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log("Testing gemini-pro...");
        const result = await model.generateContent("Hello?");
        console.log("gemini-pro worked! Response:", result.response.text());

    } catch (error) {
        console.error("gemini-pro failed:", error.message);

        try {
            console.log("Testing gemini-1.0-pro...");
            const model2 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            const result2 = await model2.generateContent("Hello?");
            console.log("gemini-1.0-pro worked! Response:", result2.response.text());
        } catch (err2) {
            console.error("gemini-1.0-pro failed:", err2.message);
        }
    }
}

listModels();
