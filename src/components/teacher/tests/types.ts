export type EditorOption = { id?: string; text: string; isCorrect: boolean };

export type EditorQuestion = {
  id: string;
  text: string;
  type: "SINGLE" | "MULTIPLE";
  points: number;
  options: EditorOption[];
};

export type TestSettings = {
  title: string;
  description: string;
  durationMin: number;
  allowRetake: boolean;
  showAnswers: boolean;
  shuffleQuestions: boolean;
  groupIds: string[];
};
