import prisma from "@/lib/prisma";

/**
 * Manual ordering of top-level tasks inside a section.
 *
 * Positions are floats: a moved task gets the midpoint between its new
 * neighbours, so a move is a single write. When neighbours are tied (e.g.
 * legacy tasks that all default to 0) or the gap gets too small, the whole
 * section is renumbered 1..n once.
 */

const MIN_GAP = 1e-6;

type SectionScope = {
  projectId: string;
  sectionId: string | null;
};

export const TASK_ORDER = [{ position: "asc" as const }, { createdAt: "asc" as const }];

/**
 * Position that puts a task at the end of its section.
 */
export async function getEndPosition({ projectId, sectionId }: SectionScope) {
  const last = await prisma.task.findFirst({
    where: { projectId, sectionId, parentId: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return last ? last.position + 1 : 1;
}

/**
 * Position for `taskId` dropped between `prevTaskId` and `nextTaskId`
 * (either may be null at the section edges). May renumber the section's
 * other tasks when there is no room between the neighbours.
 */
export async function getMovePosition({
  projectId,
  sectionId,
  taskId,
  prevTaskId,
  nextTaskId,
}: SectionScope & {
  taskId: string;
  prevTaskId: string | null;
  nextTaskId: string | null;
}) {
  const findNeighbour = (id: string | null) =>
    id && id !== taskId
      ? prisma.task.findFirst({
          where: { id, projectId, sectionId, parentId: null },
          select: { id: true, position: true },
        })
      : null;

  const [prev, next] = await Promise.all([
    findNeighbour(prevTaskId),
    findNeighbour(nextTaskId),
  ]);

  if (prev && next) {
    if (next.position - prev.position > MIN_GAP) {
      return (prev.position + next.position) / 2;
    }
  } else if (prev) {
    return prev.position + 1;
  } else if (next) {
    return next.position - 1;
  } else {
    // Empty section, or neighbours that no longer belong here
    return getEndPosition({ projectId, sectionId });
  }

  // No room between prev and next: renumber the section with the task in place
  const siblings = await prisma.task.findMany({
    where: { projectId, sectionId, parentId: null, id: { not: taskId } },
    orderBy: TASK_ORDER,
    select: { id: true },
  });

  const insertAt = siblings.findIndex((t) => t.id === prev.id) + 1;

  await prisma.$transaction(
    siblings.map((t, i) =>
      prisma.task.update({
        where: { id: t.id },
        data: { position: i < insertAt ? i + 1 : i + 2 },
      })
    )
  );

  return insertAt + 1;
}
