import { Task } from "@prisma/client";

export type TaskStatus = "PLANNED" | "IN_PROGRESS" | "DELAYED" | "OVERDUE" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type TaskWithAssignee = Task & {
  assignee?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  predecessors?: Task[];
  successors?: Task[];
  subtasks?: Task[];
};
