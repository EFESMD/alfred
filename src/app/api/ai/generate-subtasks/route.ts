import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, description, projectName } = await req.json();

    if (!title) {
      return new NextResponse("Task title is required", { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional project management assistant for a tool named "Alfred". 
          Your goal is to suggest 3-5 logical, actionable subtasks based on a task title, its description, and the overall project context.
          
          RULES:
          1. Respond ONLY with a valid JSON array of strings.
          2. Each string should be a concise, actionable subtask.
          3. ALWAYS respond in the same language as the user's input title/description.
          4. If the context is in Romanian, the subtasks must be in Romanian. If English, respond in English, etc.
          
          Example format: ["Subtask 1", "Subtask 2", "Subtask 3"]`
        },
        {
          role: "user",
          content: `Project: ${projectName || "General"}
          Task Title: ${title}
          Description: ${description || "No description provided."}`
        }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("AI failed to generate content");
    }

    // Attempt to parse the JSON array
    // Some models might wrap JSON in markdown blocks, so we clean it
    const cleanContent = content.replace(/```json|```/g, "").trim();
    const subtasks = JSON.parse(cleanContent);

    return NextResponse.json(subtasks);
  } catch (error: any) {
    console.error("[AI_GENERATE_SUBTASKS]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
