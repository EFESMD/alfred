import OpenAI from "openai";

/**
 * The OpenAI model used by every AI feature in Alfred.
 * Keep it here so all endpoints stay in sync when the model changes.
 */
export const AI_MODEL = "gpt-5.6-terra";

/**
 * Shared OpenAI client for all AI endpoints.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
