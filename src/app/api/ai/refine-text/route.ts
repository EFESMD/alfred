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

    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return new NextResponse("Text is required", { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional communication assistant. 
          Your goal is to refine the user's draft for better tone, clarity, and professionalism.
          
          RULES:
          1. Keep the original meaning and intent.
          2. Make it more professional, concise, and clear.
          3. ALWAYS respond in the same language as the input text.
          4. Return ONLY the refined text. No preamble, no quotes, no explanations.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.7,
    });

    const refinedText = response.choices[0].message.content;
    if (!refinedText) throw new Error("AI failed to refine text");

    return NextResponse.json({ refinedText: refinedText.trim() });
  } catch (error: any) {
    console.error("[AI_REFINE_TEXT_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
