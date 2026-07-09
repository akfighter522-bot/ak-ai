import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API Key exists:", !!apiKey);
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from environment variables.");
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    console.log("Calling Gemini generateContent with gemini-3.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello! This is a test from the AI Coding agent.",
    });

    console.log("Success! Response text:", response.text);
  } catch (err: any) {
    console.error("Gemini API Call Failed!");
    console.error("Error Message:", err.message);
    console.error("Error Status/Code:", err.status || err.code || (err.error && err.error.code));
    console.error("Full Error Details:", err);
  }
}

test();
