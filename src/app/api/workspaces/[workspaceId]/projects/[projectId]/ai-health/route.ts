import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { isBefore, startOfDay, subHours } from "date-fns";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId } = await params;
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: { parentId: null },
        }
      }
    });

    if (!project) return new NextResponse("Project not found", { status: 404 });

    const tasks = project.tasks;
    const stats = {
      total: tasks.length,
      done: tasks.filter(t => t.status === "DONE").length,
      overdue: tasks.filter(t => t.dueDate && isBefore(startOfDay(new Date(t.dueDate)), startOfDay(new Date())) && t.status !== "DONE").length,
      inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
      delayed: tasks.filter(t => t.status === "DELAYED").length,
      highPriority: tasks.filter(t => t.priority === "HIGH" && t.status !== "DONE").length,
    };

    const oneHourAgo = subHours(new Date(), 1);
    const hasValidCache = project.lastAiPulse && project.lastAiPulse > oneHourAgo;

    // Use cache if valid AND not a forced refresh
    if (!forceRefresh && hasValidCache && project.aiPulseContent) {
      return NextResponse.json({ 
        pulse: project.aiPulseContent, 
        stats, 
        cachedAt: project.lastAiPulse 
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional project management consultant. 
          Analyze the project stats and provide EXACTLY a 2-sentence executive report.
          
          STRICT RULES:
          1. DO NOT include any introductory text, greeting, or "Here is the report".
          2. DO NOT repeat the stats or project name in a list format.
          3. ONLY output the 2-sentence insight as PLAIN TEXT.
          4. DO NOT use any markdown formatting (no bolding, no headers, no bullet points, no code blocks, etc).
          5. DO NOT use any internal thinking tags or other markup tags.
          6. Respond in the same language as the project name.`
        },
        {
          role: "user",
          content: `Project: ${project.name}\nStats: ${JSON.stringify(stats)}`
        }
      ],
      temperature: 0.1,
    });

    let pulse = response.choices[0].message.content?.trim() || "";
    
    // Safety check: strip any markdown-like or thinking tags if they somehow leaked through
    pulse = pulse.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    pulse = pulse.replace(/\*\*|__|#|`|>/g, "").trim();
    pulse = pulse.replace(/\n+/g, " "); // Ensure it stays on one line/compact


    await prisma.project.update({
      where: { id: projectId },
      data: {
        lastAiPulse: new Date(),
        aiPulseContent: pulse,
        aiPulseStats: JSON.stringify(stats),
      }
    });

    return NextResponse.json({ pulse, stats, cachedAt: new Date() });
  } catch (error: any) {
    console.error("[AI_PROJECT_HEALTH_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
