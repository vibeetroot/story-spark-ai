import httpStatus from "http-status";
import ApiError from "../../../errors/api_error";
import {
  GenerationTimeoutError,
  raceGenerationWithTimeout,
} from "../../../utils/generation_timeout";
import {
  IAIModel,
  IAlternateEndingPayload,
  IRemixPayload,
  ITranslatePayload,
  IChatPayload,
} from "./ai_model.interface";
import {
  generateAlternateEndingsWithGemini,
  generateWithGeminiStories,
  generateRemixWithGemini,
  generateStoryContinuationWithGemini,
  translateStoryWithGemini,
  chatWithGemini,
} from "./ai_model.utils";
import { assertSuccessfulGeneration } from "./quota.lifecycle";

const AUTHENTICATED_GENERATION_TIMEOUT_MS = 60000;
const FREE_GENERATION_TIMEOUT_MS = 60000;

const GENERATION_FAILED_MESSAGE =
  "Story generation failed. Your request quota has been restored.";
const FREE_GENERATION_FAILED_MESSAGE =
  "Story generation failed. Your free generation quota has been restored.";
const ALTERNATE_ENDING_FAILED_MESSAGE =
  "Alternate ending generation failed. Your request quota has been restored.";
const FREE_ALTERNATE_ENDING_FAILED_MESSAGE =
  "Alternate ending generation failed. Your free generation quota has been restored.";

const normalizeStoryPayload = (payload: IAIModel) => ({
  prompt: payload.prompt,
  wordLength: payload.wordLength ?? 250,
  numStories: payload.numStories ?? 2,
  language: payload.language ?? "English",
  tone: payload.tone ?? undefined,
  genre: payload.genre ?? undefined,
  characters: payload.characters ?? undefined,
});

const mapGenerationError = (error: unknown, message: string): never => {
  if (error instanceof ApiError) {
    throw error;
  }

  if (error instanceof GenerationTimeoutError) {
    throw new ApiError(
      httpStatus.GATEWAY_TIMEOUT,
      "AI generation timed out. Please try again."
    );
  }

  const errorMsg = error instanceof Error ? error.message : String(error);
  throw new ApiError(httpStatus.BAD_GATEWAY, `${message} (${errorMsg})`);
};

async function generateWithQuota<T>(
  quotaFn: (() => Promise<void>) | null,
  generationFn: () => Promise<T>
): Promise<T> {
  if (quotaFn !== null) {
    await quotaFn();
  }
  return generationFn();
}

const aiModelGenerate = async (payload: IAIModel, userId?: string) => {
  const { prompt, wordLength, numStories, language, tone, genre, characters } =
    normalizeStoryPayload(payload);

  const isFree = !userId;
  const timeout = isFree ? FREE_GENERATION_TIMEOUT_MS : AUTHENTICATED_GENERATION_TIMEOUT_MS;
  const failedMessage = isFree ? FREE_GENERATION_FAILED_MESSAGE : GENERATION_FAILED_MESSAGE;

  return generateWithQuota(
    userId ? async () => {} : null,
    async () => {
      try {
        const result = await raceGenerationWithTimeout(
          (signal) =>
            generateWithGeminiStories(
              prompt,
              wordLength,
              numStories,
              language,
              signal,
              tone,
              genre,
              characters,
            ),
          timeout
        );
        assertSuccessfulGeneration(result, failedMessage);
        return result;
      } catch (error) {
        mapGenerationError(error, failedMessage);
      }
    }
  );
};

const aiModelAlternateEndings = async (
  payload: IAlternateEndingPayload,
  userId?: string
) => {
  const { title, content, tag, language = "English" } = payload;

  const isFree = !userId;
  const timeout = isFree ? FREE_GENERATION_TIMEOUT_MS : AUTHENTICATED_GENERATION_TIMEOUT_MS;
  const failedMessage = isFree ? FREE_ALTERNATE_ENDING_FAILED_MESSAGE : ALTERNATE_ENDING_FAILED_MESSAGE;

  return generateWithQuota(
    userId ? async () => {} : null,
    async () => {
      try {
        const result = await raceGenerationWithTimeout(
          () => generateAlternateEndingsWithGemini(title, content, tag, language),
          timeout
        );
        assertSuccessfulGeneration(result, failedMessage);
        return result;
      } catch (error) {
        mapGenerationError(error, failedMessage);
      }
    }
  );
};

const aiModelRemix = async (payload: IRemixPayload, userId?: string) => {
  const { title, content, tag, remixType, remixOption = "", language = "English" } = payload;
  const isFree = !userId;
  const timeout = isFree ? FREE_GENERATION_TIMEOUT_MS : AUTHENTICATED_GENERATION_TIMEOUT_MS;

  return generateWithQuota(
    userId ? async () => {} : null,
    async () => {
      try {
        const result = await raceGenerationWithTimeout(
          () => generateRemixWithGemini(title, content, tag, remixType, remixOption, language),
          timeout
        );
        return result;
      } catch (error) {
        mapGenerationError(error, "Remix generation failed.");
      }
    }
  );
};

const aiModelTranslate = async (payload: ITranslatePayload, userId?: string) => {
  const { title, content, targetLanguage } = payload;
  const isFree = !userId;
  const timeout = isFree ? FREE_GENERATION_TIMEOUT_MS : AUTHENTICATED_GENERATION_TIMEOUT_MS;

  return generateWithQuota(
    userId ? async () => {} : null,
    async () => {
      try {
        const result = await raceGenerationWithTimeout(
          () => translateStoryWithGemini(title, content, targetLanguage),
          timeout
        );
        return result;
      } catch (error) {
        mapGenerationError(error, "Translation failed.");
      }
    }
  );
};

const aiModelStoryContinuation = async (
  payload: { prompt: string; language?: string },
  userId?: string
) => {
  const { prompt, language = "English" } = payload;
  const isFree = !userId;
  const timeout = isFree ? FREE_GENERATION_TIMEOUT_MS : AUTHENTICATED_GENERATION_TIMEOUT_MS;

  return generateWithQuota(
    userId ? async () => {} : null,
    async () => {
      try {
        const result = await raceGenerationWithTimeout(
          (signal) => generateStoryContinuationWithGemini(prompt, language, signal),
          timeout
        );
        return result;
      } catch (error) {
        mapGenerationError(error, "Story continuation failed.");
      }
    }
  );
};

const aiModelChat = async (payload: IChatPayload, userId?: string) => {
  const { message, history = [] } = payload;
  const isFree = !userId;
  const timeout = isFree ? FREE_GENERATION_TIMEOUT_MS : AUTHENTICATED_GENERATION_TIMEOUT_MS;

  return generateWithQuota(
    userId ? async () => {} : null,
    async () => {
      try {
        const formattedHistory = history.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.parts }],
        }));

        const result = await raceGenerationWithTimeout(
          () => chatWithGemini(message, formattedHistory),
          timeout
        );
        return result;
      } catch (error) {
        mapGenerationError(error, "AI chat failed.");
      }
    }
  );
};

export const AiModelService = {
  aiModelGenerate,
  aiModelAlternateEndings,
  aiModelRemix,
  aiModelTranslate,
  aiModelStoryContinuation,
  aiModelChat,
};
