export type EditorOption = { id?: string; text: string; isCorrect: boolean };

export type EditorQuestion = {
  id: string;
  text: string;
  type: "SINGLE" | "MULTIPLE";
  points: number;
  options: EditorOption[];
};
