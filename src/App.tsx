import { useState } from "react";
import Navbar from "./components/Navbar";
import FileUploader from "./components/FileUploader";
import TextEditor from "./components/TextEditor";
import QuizConfigForm from "./components/QuizConfigForm";
import QuizViewer from "./components/QuizViewer";
import { Quiz, QuizConfig } from "./types";
import { Sparkles, FileText, Settings, Award, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type AppStep = "upload" | "review" | "quiz";

export default function App() {
  const [step, setStep] = useState<AppStep>("upload");
  const [extractedText, setExtractedText] = useState<string>("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [isQuizLoading, setIsQuizLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fun, reassuring steps shown while performing multimodal OCR
  const [ocrProgressMessage, setOcrProgressMessage] = useState<string>("");
  
  // OCR Progress message rotation
  const triggerOcrMessages = () => {
    const messages = [
      "Uploading file and establishing connection...",
      "Executing multimodal Gemini 3.5 OCR analysis...",
      "Parsing layouts, structures, and transcribing paragraphs...",
      "Finalizing text outputs and structures..."
    ];
    let idx = 0;
    setOcrProgressMessage(messages[0]);
    const interval = setInterval(() => {
      idx++;
      if (idx < messages.length) {
        setOcrProgressMessage(messages[idx]);
      } else {
        clearInterval(interval);
      }
    }, 2200);
    return interval;
  };

  // Triggers text extraction from base64 document/image
  const handleFileLoaded = async (base64Data: string, mimeType: string, fileName: string) => {
    setIsOcrLoading(true);
    setApiError(null);
    const intervalId = triggerOcrMessages();

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileData: base64Data, mimeType }),
      });

      clearInterval(intervalId);

      if (!response.ok) {
        let errMsg = `Server returned status ${response.status}`;
        try {
          const data = await response.json();
          errMsg = data.error || data.message || errMsg;
        } catch {
          try {
            const text = await response.text();
            if (text && text.length < 250) errMsg = text;
          } catch {}
        }
        setApiError(errMsg);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setExtractedText(data.text);
        setStep("review");
      } else {
        setApiError(data.error || "Failed to extract text from your file. Please try again.");
      }
    } catch (err: any) {
      clearInterval(intervalId);
      console.error("OCR Fetch Error:", err);
      setApiError(
        "Could not connect to the text extraction server. Make sure the backend server is active and running."
      );
    } finally {
      setIsOcrLoading(false);
    }
  };

  // Triggers quiz generation using the extracted text
  const handleGenerateQuiz = async (config: QuizConfig) => {
    setIsQuizLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceText: extractedText,
          numQuestions: config.numQuestions,
          difficulty: config.difficulty,
          questionTypes: config.questionTypes,
        }),
      });

      if (!response.ok) {
        let errMsg = `Server returned status ${response.status}`;
        try {
          const data = await response.json();
          errMsg = data.error || data.message || errMsg;
        } catch {
          try {
            const text = await response.text();
            if (text && text.length < 250) errMsg = text;
          } catch {}
        }
        setApiError(errMsg);
        return;
      }

      const data = await response.json();

      if (data.success && data.quiz) {
        setQuiz(data.quiz);
        setStep("quiz");
      } else {
        setApiError(data.error || "Failed to generate the quiz. Check that the source text has enough factual information.");
      }
    } catch (err: any) {
      console.error("Quiz Gen Error:", err);
      setApiError("Could not connect to the quiz generation server. Please try again later.");
    } finally {
      setIsQuizLoading(false);
    }
  };

  // Loads a professional mock text sample to immediately test and demonstrate the quiz feature
  const loadSampleText = () => {
    const sample = `Photosynthesis is a biological process used by plants, algae, and certain bacteria to convert light energy into chemical energy. This chemical energy is stored in carbohydrate molecules, such as sugars, which are synthesized from carbon dioxide and water.

The equation representing the process is:
6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2

In plants, photosynthesis occurs primarily in the leaves, inside specialized cellular structures called chloroplasts. Chloroplasts contain chlorophyll, a green pigment that absorbs light energy. 

Photosynthesis consists of two main stages:
1. Light-dependent reactions: Occur in the thylakoid membranes of chloroplasts, where solar energy is captured and converted to chemical energy in the form of ATP and NADPH, releasing oxygen as a byproduct.
2. Light-independent reactions (The Calvin Cycle): Occur in the stroma of chloroplasts, where ATP and NADPH are used to fix carbon dioxide into glucose.

This process is vital for life on Earth as it is the primary source of oxygen in the atmosphere and forms the base of the global food chain.`;
    
    setExtractedText(sample);
    setStep("review");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Step indicators progress bar layout */}
        <div className="mb-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Workflow Step
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-6 text-xs font-bold text-slate-400">
              {/* Step 1 */}
              <div className={`flex items-center gap-2 ${step === "upload" ? "text-indigo-900" : "text-slate-400"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                  step === "upload" ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : "bg-slate-200 text-slate-600"
                }`}>
                  1
                </span>
                <span>Upload Document</span>
              </div>

              <ArrowRight className="h-3 w-3 text-slate-300 hidden sm:block" />

              {/* Step 2 */}
              <div className={`flex items-center gap-2 ${step === "review" ? "text-indigo-900" : "text-slate-400"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                  step === "review" ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : "bg-slate-200 text-slate-600"
                }`}>
                  2
                </span>
                <span>Verify Text</span>
              </div>

              <ArrowRight className="h-3 w-3 text-slate-300 hidden sm:block" />

              {/* Step 3 */}
              <div className={`flex items-center gap-2 ${step === "quiz" ? "text-indigo-900" : "text-slate-400"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                  step === "quiz" ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : "bg-slate-200 text-slate-600"
                }`}>
                  3
                </span>
                <span>Interactive Quiz & PDF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global API error notification */}
        {apiError && (
          <div className="mb-6 rounded border border-rose-200 bg-rose-50/40 p-4 text-rose-800 flex items-start gap-3">
            <span className="font-bold text-xs text-rose-900 uppercase tracking-widest">Error:</span>
            <p className="text-xs font-semibold leading-relaxed">{apiError}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD & EXTRACT TEXT */}
          {step === "upload" && (
            <motion.div
              key="upload-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid gap-8 lg:grid-cols-3"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                      Document Text Extraction (OCR)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">
                    Upload an educational worksheet, handbook page, screenshot, or a multi-page PDF document. Gemini's advanced multimodal OCR will read, digitize, and extract the text contents cleanly.
                  </p>

                  {isOcrLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                      <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
                      <p className="text-sm font-bold text-slate-800">Extracting Text Contents...</p>
                      <p className="text-xs text-slate-500 mt-1 px-4 text-center max-w-sm animate-pulse leading-relaxed">
                        {ocrProgressMessage}
                      </p>
                    </div>
                  ) : (
                    <FileUploader onFileLoaded={handleFileLoaded} isLoading={isOcrLoading} />
                  )}
                </div>
              </div>

              {/* Sidebar Quick-Try & Instructions */}
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <h3 className="font-bold text-slate-700 text-xs tracking-widest uppercase">
                      Quick Start Sandbox
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Don't have a document on hand? Load our interactive sample article on photosynthesis to immediately test the quiz builder.
                  </p>
                  <button
                    type="button"
                    onClick={loadSampleText}
                    className="w-full flex justify-center items-center gap-2 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 px-4 py-3 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer border border-slate-200 uppercase tracking-wider"
                  >
                    <span>Try with Sample Text</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-6">
                  <h3 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest mb-4">
                    How it works
                  </h3>
                  <ul className="space-y-4 text-xs text-slate-600 font-medium">
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 text-white text-[9px] font-bold">1</span>
                      <span className="leading-relaxed">Upload any screenshot, reading material image, or text-heavy PDF document.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 text-white text-[9px] font-bold">2</span>
                      <span className="leading-relaxed">Review, refine, and edit the extracted OCR results to correct any potential typos.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 text-white text-[9px] font-bold">3</span>
                      <span className="leading-relaxed">Customize difficulty, length, and layouts, then instantly generate and print your quiz PDF!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: REVIEW & EDIT EXTRACTED TEXT */}
          {step === "review" && (
            <motion.div
              key="review-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid gap-8 lg:grid-cols-3"
            >
              <div className="lg:col-span-2 space-y-6">
                <TextEditor
                  text={extractedText}
                  onChange={setExtractedText}
                  onReset={() => {
                    setExtractedText("");
                    setStep("upload");
                  }}
                />
              </div>

              {/* Quiz Generation Configuration Form */}
              <div className="space-y-6">
                <QuizConfigForm onGenerate={handleGenerateQuiz} isLoading={isQuizLoading} />
              </div>
            </motion.div>
          )}

          {/* STEP 3: INTERACTIVE QUIZ PREVIEW & EXPORT */}
          {step === "quiz" && quiz && (
            <motion.div
              key="quiz-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <QuizViewer
                quiz={quiz}
                onQuizChange={setQuiz}
                onBackToText={() => setStep("review")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
