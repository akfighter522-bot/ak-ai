import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON body parser. On Vercel, the body might already be parsed.
// We only run the body parsers if req.body is not already populated to prevent hanging.
app.use((req, res, next) => {
  if (req.body !== undefined) {
    next();
  } else {
    express.json({ limit: "50mb" })(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.body !== undefined) {
    next();
  } else {
    express.urlencoded({ limit: "50mb", extended: true })(req, res, next);
  }
});

// Lazy initializer for GoogleGenAI to prevent startup crashes when keys are not yet provided
let aiInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please set your Gemini API Key in the Secrets panel (Settings > Secrets).");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

/**
 * Helper to call Gemini generateContent with automatic retry, exponential backoff, and model fallback
 * to handle transient 503 "Service Unavailable", 429 "Too Many Requests" or other network/capacity spikes.
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: any,
  maxRetries = 3,
  initialDelayMs = 1500
): Promise<any> {
  const originalModel = params.model || "gemini-3.5-flash";
  
  // Multimodal requests (containing inlineData) cannot fall back to text-only gemini-3.1-flash-lite
  const isMultimodal = JSON.stringify(params.contents).includes("inlineData");
  const modelsToTry = isMultimodal ? [originalModel] : [originalModel, "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const currentParams = { ...params, model };
        console.log(`[Gemini] Requesting generateContent (model: ${model}, attempt: ${attempt + 1}/${maxRetries})...`);
        const response = await ai.models.generateContent(currentParams);
        return response;
      } catch (error: any) {
        attempt++;
        lastError = error;
        const errorMessage = String(error.message || "").toLowerCase();
        const errorCode = error.status || error.code || (error.error && error.error.code);
        
        console.warn(`[Gemini] Attempt ${attempt}/${maxRetries} for model ${model} failed: ${errorMessage} (status code: ${errorCode})`);

        // If it's a definitive non-retryable user error (e.g. 400 bad request, API key invalid etc), fail immediately
        const isClientError = errorCode === 400 || 
                              errorCode === 401 || 
                              errorCode === 403 || 
                              errorMessage.includes("invalid_argument") || 
                              errorMessage.includes("bad request") || 
                              errorMessage.includes("api key") ||
                              errorMessage.includes("unauthorized") ||
                              errorMessage.includes("not found");

        if (isClientError) {
          console.error(`[Gemini] Definitive client error. Aborting retries.`);
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = initialDelayMs * Math.pow(2, attempt - 1);
          console.log(`[Gemini] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.warn(`[Gemini] All ${maxRetries} attempts failed for model ${model}.`);
  }

  throw lastError;
}

// API Health check endpoint (matches both local /api/health and Vercel direct function /health)
app.get(["/api/health", "/health"], (req, res) => {
  res.json({ status: "ok", message: "OCR & Quiz App Server is running." });
});

// Endpoint: Extract Text (OCR) from uploaded Image or PDF (matches both local /api/ocr and Vercel /ocr)
app.post(["/api/ocr", "/ocr"], async (req, res) => {
  try {
    const { fileData, mimeType } = req.body || {};

    if (!fileData || !mimeType) {
      res.status(400).json({ error: "Missing fileData (base64 string) or mimeType." });
      return;
    }

    // Map non-standard image/jpg to standard image/jpeg for Gemini compatibility
    const normalizedMimeType = mimeType === "image/jpg" ? "image/jpeg" : mimeType;

    const ai = getGenAI();

    // Prepare contents for Gemini multimodal request
    const filePart = {
      inlineData: {
        mimeType: normalizedMimeType,
        data: fileData, // expects standard base64 string
      },
    };

    const textPart = {
      text: `Extract all text from this document accurately. Preserve structural layouts, headings, sections, and paragraphs. Do not add comments, opinions, or introductions. Just extract and output the exact text found. If it contains tables, convert them to readable text columns or markdown tables.`,
    };

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: {
        parts: [filePart, textPart],
      },
    });

    const extractedText = response.text || "";
    res.json({ success: true, text: extractedText });
  } catch (error: any) {
    console.error("OCR API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to extract text from file.",
    });
  }
});

// Endpoint: Generate Quiz from Text (JSON Schema) (matches both local /api/generate-quiz and Vercel /generate-quiz)
app.post(["/api/generate-quiz", "/generate-quiz"], async (req, res) => {
  try {
    const { sourceText, numQuestions, difficulty, questionTypes } = req.body || {};

    if (!sourceText) {
      res.status(400).json({ error: "No source text provided for quiz generation." });
      return;
    }

    const targetNum = numQuestions || 5;
    const targetDiff = difficulty || "medium";
    const types = questionTypes || ["multiple-choice"];

    const ai = getGenAI();

    const prompt = `Create a high-quality educational quiz based strictly on the source text provided below.
    
Requirements:
1. Generate exactly ${targetNum} questions.
2. The difficulty level should be "${targetDiff}".
3. Use the following question types: ${types.join(", ")}.
4. Ensure all facts in the questions are completely accurate to the source text.
5. Provide a clear, detailed explanation for why the correct answer is correct.

Source Text:
${sourceText}
`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert educator. You generate structured quizzes with absolute academic precision based on the provided text.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A suitable title for this quiz.",
            },
            description: {
              type: Type.STRING,
              description: "A short description of the quiz topic based on the text.",
            },
            questions: {
              type: Type.ARRAY,
              description: "The list of quiz questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.STRING,
                    description: "Unique string ID for the question, e.g. q1, q2, ...",
                  },
                  questionText: {
                    type: Type.STRING,
                    description: "The wording of the question.",
                  },
                  type: {
                    type: Type.STRING,
                    description: "The question format: 'multiple-choice', 'true-false', or 'short-answer'.",
                  },
                  choices: {
                    type: Type.ARRAY,
                    description: "Answer options. Required for 'multiple-choice' (4 choices) and 'true-false' (always ['True', 'False']). Leave empty for 'short-answer'.",
                    items: {
                      type: Type.STRING,
                    },
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: "The correct answer value. For 'multiple-choice' and 'true-false', this must exactly match one of the items in choices. For 'short-answer', provide a concise, ideal model answer.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Detailed explanation of why this answer is correct based on the text.",
                  },
                },
                required: ["id", "questionText", "type", "correctAnswer", "explanation"],
              },
            },
          },
          required: ["title", "description", "questions"],
        },
      },
    });

    const resultText = response.text || "{}";
    
    // Robustly clean any markdown block formatting like ```json ... ``` before parsing
    let cleanedText = resultText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "");
      cleanedText = cleanedText.replace(/\s*```$/, "");
    }
    cleanedText = cleanedText.trim();

    const quizData = JSON.parse(cleanedText);

    res.json({ success: true, quiz: quizData });
  } catch (error: any) {
    console.error("Quiz Gen API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate quiz.",
    });
  }
});

// Serve frontend assets using Vite middleware in development or static folder in production
async function startServer() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    (typeof __filename !== "undefined" && (__filename.endsWith(".cjs") || __filename.endsWith(".js")));

  if (!isProd) {
    try {
      console.log("[Server] Starting in development mode with Vite middleware...");
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e: any) {
      console.error("[Server] Failed to load Vite development middleware. Falling back to static files:", e);
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    console.log("[Server] Starting in production mode, serving static build...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

// Endpoint to check server configuration status (to help users diagnose setup issues)
app.get(["/api/config", "/config"], (req, res) => {
  const isProd =
    process.env.NODE_ENV === "production" ||
    (typeof __filename !== "undefined" && (__filename.endsWith(".cjs") || __filename.endsWith(".js")));

  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    isProduction: isProd
  });
});

if (!process.env.VERCEL) {
  startServer();
}

export default app;
