import { useState } from "react";
import { Quiz, QuizQuestion } from "../types";
import { Play, Edit3, Eye, CheckCircle2, AlertCircle, Trash2, Plus, ArrowLeft } from "lucide-react";
import PdfExportButton from "./PdfExportButton";

interface QuizViewerProps {
  quiz: Quiz;
  onQuizChange: (updatedQuiz: Quiz) => void;
  onBackToText: () => void;
}

type ViewMode = "test" | "edit" | "preview";

export default function QuizViewer({ quiz, onQuizChange, onBackToText }: QuizViewerProps) {
  const [activeTab, setActiveTab] = useState<ViewMode>("test");
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // States for inline editing
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Tab switcher
  const tabs = [
    { id: "test", name: "TAKE INTERACTIVE TEST", icon: Play },
    { id: "edit", name: "EDIT QUESTIONS", icon: Edit3 },
    { id: "preview", name: "ANSWER KEY PREVIEW", icon: Eye },
  ] as const;

  // Handles submitting the test
  const handleTestSubmit = () => {
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      const userAns = userAnswers[q.id]?.trim().toLowerCase();
      const correctAns = q.correctAnswer.trim().toLowerCase();
      if (userAns === correctAns) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setQuizSubmitted(true);
  };

  const handleResetTest = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const handleSelectOption = (questionId: string, choice: string) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: choice,
    }));
  };

  const handleShortAnswerChange = (questionId: string, text: string) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  // Handles updating a question field
  const updateQuestionField = (
    questionId: string,
    field: keyof QuizQuestion,
    value: any
  ) => {
    const updatedQuestions = quiz.questions.map((q) => {
      if (q.id === questionId) {
        return { ...q, [field]: value };
      }
      return q;
    });
    onQuizChange({ ...quiz, questions: updatedQuestions });
  };

  // Handles updating choice text
  const updateChoiceField = (
    questionId: string,
    choiceIndex: number,
    newValue: string
  ) => {
    const updatedQuestions = quiz.questions.map((q) => {
      if (q.id === questionId && q.choices) {
        const updatedChoices = [...q.choices];
        // If the correct answer matches the old choice, update the correct answer too
        const oldChoiceValue = updatedChoices[choiceIndex];
        const isCorrectChoice = q.correctAnswer === oldChoiceValue;

        updatedChoices[choiceIndex] = newValue;

        return {
          ...q,
          choices: updatedChoices,
          correctAnswer: isCorrectChoice ? newValue : q.correctAnswer,
        };
      }
      return q;
    });
    onQuizChange({ ...quiz, questions: updatedQuestions });
  };

  // Delete question
  const deleteQuestion = (id: string) => {
    const updatedQuestions = quiz.questions.filter((q) => q.id !== id);
    onQuizChange({ ...quiz, questions: updatedQuestions });
  };

  // Add question
  const addQuestion = () => {
    const newId = `q_custom_${Date.now()}`;
    const newQuestion: QuizQuestion = {
      id: newId,
      questionText: "New custom question. Edit this text.",
      type: "multiple-choice",
      choices: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      explanation: "Provide a detailed explanation of why this is correct here.",
    };
    onQuizChange({
      ...quiz,
      questions: [...quiz.questions, newQuestion],
    });
    setEditingQuestionId(newId);
  };

  return (
    <div className="space-y-6">
      {/* Quiz title & PDF download layout header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <button
            type="button"
            onClick={onBackToText}
            className="group flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400 hover:text-indigo-600 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-indigo-600" />
            <span>Back to Extracted Text</span>
          </button>
          
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800 md:text-2xl">
            {quiz.title}
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {quiz.description}
          </p>
        </div>

        {/* PDF Export Controls Widget */}
        <div className="w-full md:w-80 shrink-0">
          <PdfExportButton quiz={quiz} />
        </div>
      </div>

      {/* Tabs navigation for quiz interaction types */}
      <div className="flex border-b border-slate-200">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-[10px] font-bold tracking-widest border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB 1: Take Interactive Test */}
      {activeTab === "test" && (
        <div className="space-y-6">
          {quizSubmitted && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-slate-850 border border-slate-700 text-white shadow-sm animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded bg-indigo-600 text-white font-black text-lg">
                  {Math.round((score / quiz.questions.length) * 100)}%
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300">Quiz Submitted Successfully!</h3>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">
                    You answered <strong className="font-bold text-white">{score}</strong> out of{" "}
                    <strong className="font-bold text-white">{quiz.questions.length}</strong> questions correctly.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetTest}
                className="rounded bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-4 py-2.5 shadow-sm transition-colors cursor-pointer"
              >
                RETAKE QUIZ
              </button>
            </div>
          )}

          <div className="space-y-5">
            {quiz.questions.map((q, index) => {
              const userAnswer = userAnswers[q.id] || "";
              const isCorrect = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              const hasAnswered = !!userAnswer;

              return (
                <div
                  key={q.id}
                  className={`rounded-xl border bg-white p-6 transition-all shadow-sm ${
                    quizSubmitted
                      ? isCorrect
                        ? "border-emerald-200 bg-emerald-50/10"
                        : "border-rose-200 bg-rose-50/10"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-150 rounded px-2.5 py-1">
                      Question {index + 1} • {q.type.replace("-", " ")}
                    </span>

                    {quizSubmitted && (
                      <span
                        className={`flex items-center gap-1.5 rounded px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          isCorrect
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                            : "bg-rose-50 text-rose-700 border border-rose-150"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            <span>Incorrect</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-relaxed">
                    {q.questionText}
                  </h3>

                   {/* MCQ & True/False choices */}
                   {(q.type === "multiple-choice" || q.type === "true-false") && q.choices && (
                     <div className="grid gap-2.5 mt-4">
                       {q.choices.map((choice) => {
                         const isSelected = userAnswer === choice;
                         const isThisCorrect = choice === q.correctAnswer;
                         
                         let choiceStyle = "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/5";
                         if (isSelected) {
                           choiceStyle = "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold";
                         }
 
                         if (quizSubmitted) {
                           if (isThisCorrect) {
                             choiceStyle = "border-emerald-300 bg-emerald-50 text-emerald-950 font-bold";
                           } else if (isSelected && !isCorrect) {
                             choiceStyle = "border-rose-300 bg-rose-50 text-rose-950 font-semibold";
                           } else {
                             choiceStyle = "border-slate-100 bg-slate-50/50 text-slate-400 pointer-events-none";
                           }
                         }
 
                         return (
                           <button
                             key={choice}
                             type="button"
                             onClick={() => handleSelectOption(q.id, choice)}
                             className={`w-full flex items-center justify-between p-3.5 rounded border text-left text-xs sm:text-sm transition-all cursor-pointer ${choiceStyle}`}
                             disabled={quizSubmitted}
                           >
                             <span>{choice}</span>
                             {isSelected && !quizSubmitted && (
                               <span className="h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-indigo-100"></span>
                             )}
                           </button>
                         );
                       })}
                     </div>
                   )}
 
                   {/* Short Answer fields */}
                   {q.type === "short-answer" && (
                     <div className="mt-4">
                       <textarea
                         value={userAnswer}
                         onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                         placeholder="Type your answer here..."
                         className="w-full rounded border border-slate-200 bg-white p-4 text-xs sm:text-sm text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-hidden leading-relaxed"
                         disabled={quizSubmitted}
                         rows={3}
                       />
                       
                       {quizSubmitted && (
                         <div className="mt-4 p-4 rounded bg-slate-50 border border-slate-100 text-xs sm:text-sm">
                           <p className="font-bold text-slate-800">Ideal Model Answer:</p>
                           <p className="text-slate-600 mt-1 leading-relaxed">{q.correctAnswer}</p>
                         </div>
                       )}
                     </div>
                   )}
 
                   {/* Feedback explanation details block */}
                   {quizSubmitted && (
                     <div className="mt-4 p-4 rounded bg-slate-100/50 border border-slate-200/50 text-xs text-slate-600 leading-relaxed">
                       <span className="font-bold text-slate-800 block mb-1">Explanation:</span>
                       {q.explanation}
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
 
           {!quizSubmitted && (
             <div className="flex justify-end pt-2">
               <button
                 type="button"
                 onClick={handleTestSubmit}
                 className="rounded bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs px-6 py-3 tracking-wider uppercase shadow-xs hover:shadow-md transition-all cursor-pointer"
               >
                 Submit Answers
               </button>
             </div>
           )}
        </div>
      )}

      {/* TAB 2: Quiz Question Editor */}
      {activeTab === "edit" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-slate-50 border border-slate-150 p-4 rounded-xl">
            <div className="text-xs text-slate-500 font-bold">
              You can fully modify the questions, answers, and explanations to ensure 100% accuracy before print layout generation.
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer uppercase tracking-wider shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-4">
            {quiz.questions.map((q, index) => {
              const isEditing = editingQuestionId === q.id;

              return (
                <div
                  key={q.id}
                  className={`rounded-xl border bg-white p-5 transition-all shadow-sm ${
                    isEditing ? "border-indigo-600" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Question {index + 1} • {q.type.replace("-", " ")}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingQuestionId(isEditing ? null : q.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer ${
                          isEditing
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200"
                        }`}
                      >
                        {isEditing ? "Done Editing" : "Edit Details"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.id)}
                        className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      {/* Question Text */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Question Wording
                        </label>
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => updateQuestionField(q.id, "questionText", e.target.value)}
                          className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-hidden"
                        />
                      </div>

                      {/* Question Type Selection */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Question Format
                        </label>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const newType = e.target.value as any;
                            // Initialize standard option fields if format changes
                            const choices =
                              newType === "multiple-choice"
                                ? ["Option A", "Option B", "Option C", "Option D"]
                                : newType === "true-false"
                                ? ["True", "False"]
                                : undefined;
                            const correctAnswer = choices ? choices[0] : "Model answer wording here.";
                            
                            const updatedQuestions = quiz.questions.map((item) => {
                              if (item.id === q.id) {
                                return { ...item, type: newType, choices, correctAnswer };
                              }
                              return item;
                            });
                            onQuizChange({ ...quiz, questions: updatedQuestions });
                          }}
                          className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                        >
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="true-false">True / False</option>
                          <option value="short-answer">Short Answer</option>
                        </select>
                      </div>

                      {/* MCQ Option Editor */}
                      {q.type === "multiple-choice" && q.choices && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Answer Choices
                          </label>
                          <div className="grid gap-2.5">
                            {q.choices.map((choice, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono text-slate-400">
                                  {String.fromCharCode(65 + cIdx)})
                                </span>
                                <input
                                  type="text"
                                  value={choice}
                                  onChange={(e) => updateChoiceField(q.id, cIdx, e.target.value)}
                                  className="flex-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuestionField(q.id, "correctAnswer", choice)}
                                  className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                    q.correctAnswer === choice
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  }`}
                                >
                                  Correct
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* True/False option selection */}
                      {q.type === "true-false" && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Select Correct Answer
                          </label>
                          <div className="flex gap-2">
                            {["True", "False"].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => updateQuestionField(q.id, "correctAnswer", opt)}
                                className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                                  q.correctAnswer === opt
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Short Answer Correct Model Answer Wording */}
                      {q.type === "short-answer" && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Correct / Model Answer
                          </label>
                          <textarea
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestionField(q.id, "correctAnswer", e.target.value)}
                            className="w-full rounded border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-hidden"
                            rows={2}
                          />
                        </div>
                      )}

                      {/* Explanation */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Detailed Explanation / Rationale
                        </label>
                        <textarea
                          value={q.explanation}
                          onChange={(e) => updateQuestionField(q.id, "explanation", e.target.value)}
                          className="w-full rounded border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-hidden"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm sm:text-base">{q.questionText}</h4>
                      
                      {q.choices && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          {q.choices.map((choice, cIdx) => {
                            const isCorrect = choice === q.correctAnswer;
                            return (
                              <div
                                key={choice}
                                className={`p-2.5 rounded border text-xs ${
                                  isCorrect
                                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-950 font-bold"
                                    : "bg-slate-50/50 border-slate-100 text-slate-500"
                                }`}
                              >
                                <span className="font-mono font-bold mr-1.5">
                                  {String.fromCharCode(65 + cIdx)})
                                </span>
                                {choice}
                                {isCorrect && <span className="ml-1.5 text-[10px] text-emerald-600 font-bold tracking-wider uppercase">(Correct)</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === "short-answer" && (
                        <div className="mt-3 p-3 rounded bg-emerald-50/20 border border-emerald-100 text-xs">
                          <span className="font-bold text-emerald-800">Correct Model Answer: </span>
                          <span className="text-emerald-950">{q.correctAnswer}</span>
                        </div>
                      )}

                      <div className="mt-4 p-3 rounded bg-slate-50 border border-slate-150 text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-800 block mb-1 uppercase tracking-wider text-[9px] text-slate-400">Explanation:</span>
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Complete Answer Key Preview */}
      {activeTab === "preview" && (
        <div className="space-y-5 animate-fade-in bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
              Master Answer Key & Explanations Preview
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Here is the master key for teachers. This lists every correct response alongside its deep educational explanation.
            </p>
          </div>

          <div className="divide-y divide-slate-150">
            {quiz.questions.map((q, index) => {
              let parsedCorrectAnswer = q.correctAnswer;
              if (q.choices) {
                const choiceIdx = q.choices.indexOf(q.correctAnswer);
                if (choiceIdx !== -1) {
                  const letter = String.fromCharCode(65 + choiceIdx);
                  parsedCorrectAnswer = `${letter}) ${q.correctAnswer}`;
                }
              }

              return (
                <div key={q.id} className="py-5 first:pt-0 last:pb-0">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Q{index + 1}. {q.questionText}
                  </h4>
                  
                  <div className="flex items-center gap-1.5 mt-2.5 text-xs font-bold text-emerald-850 bg-emerald-50/50 border border-emerald-200 rounded px-3 py-1.5 w-fit">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Correct Answer: {parsedCorrectAnswer}</span>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 leading-relaxed bg-slate-50 p-3.5 rounded border border-slate-150">
                    <strong className="text-slate-700 block mb-1 uppercase tracking-wider text-[9px] text-slate-400">Explanation / Rationale:</strong>
                    {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
