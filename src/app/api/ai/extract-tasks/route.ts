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

    const { content, currentDate } = await req.json();

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional project management assistant. 
          Analyze the provided meeting notes or transcript and extract all actionable tasks.
          
          Context: Today is ${currentDate}.
          
          Return ONLY a valid JSON object with a "tasks" field containing an array of task objects.
          Each task object should have:
          - title: (string) Clear, actionable title
          - description: (string) Brief context or details from the notes
          - priority: (LOW, MEDIUM, or HIGH)
          - dueDate: (ISO string or null)
          
          RULES:
          1. ALWAYS respond in the same language as the input text.
          2. Only extract tasks that are clearly actionable items.
          3. Format the JSON strictly.`
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const aiResponse = response.choices[0].message.content;
    if (!aiResponse) throw new Error("AI failed to extract tasks");

    return NextResponse.json(JSON.parse(aiResponse));
  } catch (error: any) {
    console.error("[AI_EXTRACT_TASKS_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
