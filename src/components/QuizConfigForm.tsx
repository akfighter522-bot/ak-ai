import { useState, FormEvent } from "react";
import { QuizConfig, QuestionType } from "../types";
import { Settings, HelpCircle } from "lucide-react";

interface QuizConfigFormProps {
  onGenerate: (config: QuizConfig) => void;
  isLoading: boolean;
}

export default function QuizConfigForm({ onGenerate, isLoading }: QuizConfigFormProps) {
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [types, setTypes] = useState<QuestionType[]>(["multiple-choice"]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleType = (type: QuestionType) => {
    if (types.includes(type)) {
      if (types.length === 1) {
        setValidationError("You must choose at least one question type.");
        return;
      }
      setTypes(types.filter((t) => t !== type));
    } else {
      setValidationError(null);
      setTypes([...types, type]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (types.length === 0) {
      setValidationError("Please select at least one question type.");
      return;
    }
    onGenerate({
      numQuestions,
      difficulty,
      questionTypes: types,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <Settings className="h-4 w-4 text-indigo-600" />
        <h3 className="font-bold text-slate-700 text-[10px] tracking-widest uppercase">
          Quiz Configuration
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Number of Questions */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Number of Questions
            </label>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">
              {numQuestions}
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="15"
            step="1"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
            disabled={isLoading}
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold px-0.5 mt-1">
            <span>3 QUESTIONS</span>
            <span>15 QUESTIONS</span>
          </div>
        </div>

        {/* Difficulty level */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`py-2 px-3 rounded text-xs font-bold border uppercase tracking-wider transition-all cursor-pointer ${
                  difficulty === level
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                }`}
                disabled={isLoading}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Question Types */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Question Types
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/10 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={types.includes("multiple-choice")}
                onChange={() => toggleType("multiple-choice")}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 accent-indigo-600 cursor-pointer"
                disabled={isLoading}
              />
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-700">
                  Multiple Choice
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                  4 choices with 1 correct answer
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/10 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={types.includes("true-false")}
                onChange={() => toggleType("true-false")}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 accent-indigo-600 cursor-pointer"
                disabled={isLoading}
              />
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-700">
                  True / False
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                  Simple dual-choice questions
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/10 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={types.includes("short-answer")}
                onChange={() => toggleType("short-answer")}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 accent-indigo-600 cursor-pointer"
                disabled={isLoading}
              />
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-700">
                  Short Answer
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                  Text answer fields with model answer key
                </span>
              </div>
            </label>
          </div>
        </div>

        {validationError && (
          <p className="text-xs font-bold text-rose-600 mt-1">{validationError}</p>
        )}

        {/* Generate Button */}
        <button
          type="submit"
          className="w-full flex justify-center items-center gap-2 rounded bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-3 text-xs font-bold text-white tracking-wider uppercase shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Generating Quiz...</span>
            </>
          ) : (
            <span>Generate Interactive Quiz</span>
          )}
        </button>
      </form>
    </div>
  );
}
