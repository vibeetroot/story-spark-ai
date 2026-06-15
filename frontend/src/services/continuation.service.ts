import { instance as axios } from "../helpers/axios/axiosInstance";
import { Chapter } from "../types/story.types";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const buildContinuationPrompt = (previousContent: string, tone: string) => {
  const toneInstruction =
    tone && tone !== "Default"
      ? `Continue the story in a ${tone} tone.`
      : "Continue this story naturally.";

  return `
${toneInstruction}

Rules:
- Maintain character consistency
- Keep emotional tone
- Avoid repetition
- Continue the narrative smoothly

Story:
${previousContent}
    `;
};

export const continueStory = async (
  chapters: Chapter[],
  tone: string = "Default"
) => {
  const previousContent = chapters
    .map((chapter) => chapter.content)
    .join("\n\n");

  const response = await axios.post(
    `${BASE_URL}/story-continuation/continue`,
    {
      prompt: buildContinuationPrompt(previousContent, tone),
    }
  );

  return response.data.data.continuation;
};

/**
 * Generate multiple story continuations (batch) based on the provided chapters.
 * @param chapters - Array of Chapter objects representing the current story.
 * @param count - Desired number of continuations (default 3, capped at 5).
 * @param tone - Optional tone for the continuation prompt.
 * @returns An array of continuation strings.
 */
export const getContinuations = async (
  chapters: Chapter[],
  count: number = 3,
  tone: string = "Default"
): Promise<string[]> => {
  const previousContent = chapters.map((c) => c.content).join("\n\n");
  const response = await axios.post(`${BASE_URL}/story-continuation/continuations`, {
    prompt: buildContinuationPrompt(previousContent, tone),
    count,
  });
  const data = response.data.data;
  if (Array.isArray(data)) {
    return data.map((item: any) => item.continuation ?? "");
  }
  return [];
};