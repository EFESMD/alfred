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

    const { type, content } = await req.json();

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const systemPrompt = type === "description" 
      ? `You are an expert project manager assistant. 
         Summarize the following task description into a single, highly concise paragraph or a few bullet points. 
         Focus on the main goal and any key constraints.
         ALWAYS respond in the same language as the input text.`
      : `You are an expert project manager assistant. 
         Analyze the following list of comments and activities from a task.
         Provide a concise summary in 3 sections: 
         1. Key Decisions Made
         2. Open Questions/Blockers
         3. Next Steps
         ALWAYS respond in the same language as the majority of the input text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.5,
    });

    const summary = response.choices[0].message.content;
    
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("[AI_SUMMARIZE_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
