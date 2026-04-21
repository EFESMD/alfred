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

    // 1. Gather Project Data (Always needed for fresh stats)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: { parentId: null }, // Only top-level tasks for health
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

    // 2. Check Cache (1 hour expiry)
    const oneHourAgo = subHours(new Date(), 1);
    const hasValidCache = project.lastAiPulse && project.lastAiPulse > oneHourAgo;

    if (hasValidCache && project.aiPulseContent) {
      console.log(`[AI_HEALTH] Serving cached pulse for project: ${project.name}`);
      return NextResponse.json({ 
        pulse: project.aiPulseContent, 
        stats, 
        cachedAt: project.lastAiPulse 
      });
    }

    // 3. Cache expired or missing -> Ask AI for Pulse
    console.log(`[AI_HEALTH] Cache missing or expired. Fetching fresh pulse from OpenAI...`);
    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content: `You are a project management consultant. 
          Analyze the project statistics and provide a 2-sentence executive "Pulse" report.
          
          Guidelines:
          1. Be objective but professional.
          2. Highlight the biggest risk (e.g., overdue tasks or high priority backlog).
          3. Mention positive momentum if progress is good.
          4. ALWAYS respond in the same language as the project name.
          
          Example: "Momentum is strong with 60% of tasks completed. However, 3 high-priority tasks are overdue and require immediate attention to stay on track."`
        },
        {
          role: "user",
          content: `Project: ${project.name}
          Stats: ${JSON.stringify(stats)}`
        }
      ],
      temperature: 0.7,
    });

    const pulse = response.choices[0].message.content;

    // 4. Update Cache in DB
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
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
