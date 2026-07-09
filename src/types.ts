export type QuestionType = "multiple-choice" | "true-false" | "short-answer";

export interface QuizQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  choices?: string[]; // Only for multiple-choice or true-false
  correctAnswer: string; // The correct answer value
  explanation: string; // Detailed educational explanation
}

export interface Quiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface QuizConfig {
  numQuestions: number;
  difficulty: "easy" | "medium" | "hard";
  questionTypes: QuestionType[];
}
