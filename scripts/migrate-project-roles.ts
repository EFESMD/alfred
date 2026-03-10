import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting project roles migration...');

  const projects = await prisma.project.findMany({
    include: {
      workspace: {
        include: {
          members: true,
        }
      }
    }
  });

  console.log(`Found ${projects.length} projects to process.`);

  for (const project of projects) {
    console.log(`Processing project: ${project.name} (${project.id})`);

    const workspaceMembers = project.workspace.members;
    const workspaceOwnerId = project.workspace.ownerId;
    const projectLeaderId = project.projectLeaderId;

    for (const member of workspaceMembers) {
      let role = 'MEMBER';
      
      // If user is Workspace Owner or Project Leader, grant OWNER role
      if (member.userId === workspaceOwnerId || member.userId === projectLeaderId) {
        role = 'OWNER';
      }

      try {
        await prisma.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: member.userId,
            }
          },
          update: { role },
          create: {
            projectId: project.id,
            userId: member.userId,
            role,
          }
        });
        console.log(`  - User ${member.userId} added as ${role}`);
      } catch (error) {
        console.error(`  - Error adding user ${member.userId}:`, error);
      }
    }
  }

  console.log('✅ Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
