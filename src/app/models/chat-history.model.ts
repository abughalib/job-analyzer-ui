export interface ChatContent {
  type: "AI" | "Human";
  content: string;
  think: string;
}

export interface Messages {
  chat_history: ChatContent[];
}
