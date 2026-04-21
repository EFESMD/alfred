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

    const { prompt, currentDate } = await req.json();

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional task parsing assistant. 
          Extract task details from the user's natural language input.
          
          Context: Today is ${currentDate}.
          
          Return ONLY a valid JSON object with these fields:
          - title: (string) The core task action
          - description: (string or null) A brief elaboration if the input is long or descriptive
          - startDate: (ISO string or null)
          - dueDate: (ISO string or null)
          - status: (PLANNED, IN_PROGRESS, DELAYED, OVERDUE, or DONE - default to PLANNED)
          - priority: (LOW, MEDIUM, or HIGH - default to MEDIUM)
          - assigneeName: (string or null - if a person is mentioned)

          RULES:
          1. ALWAYS respond in the same language as the user's input.
          2. Ensure the JSON is strictly valid.
          3. For status, map keywords like "doing", "working on" to IN_PROGRESS; "done", "finished" to DONE; "late" to OVERDUE.

          Example: "Call Victor tomorrow at 2pm about the contract, set as high priority"
          Result: {"title": "Call Victor", "description": "Discuss the contract details", "startDate": "2026-04-22T14:00:00Z", "dueDate": "2026-04-22T15:00:00Z", "status": "PLANNED", "priority": "HIGH", "assigneeName": "Victor"}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0, // High precision for parsing
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("AI failed to parse task");

    return NextResponse.json(JSON.parse(content));
  } catch (error: any) {
    console.error("[AI_PARSE_TASK_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
