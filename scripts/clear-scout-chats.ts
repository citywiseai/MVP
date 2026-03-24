import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllScoutChats() {
  console.log('🧹 Clearing all Scout chat messages...\n');

  try {
    // Count messages before deletion
    const count = await prisma.chatMessage.count();
    console.log(`📊 Found ${count} chat messages in database`);

    if (count === 0) {
      console.log('✅ No messages to delete!');
      return;
    }

    // Delete all chat messages
    const result = await prisma.chatMessage.deleteMany({});

    console.log(`\n✅ Successfully deleted ${result.count} chat messages!`);
    console.log('🎯 All Scout chats cleared for demo.');

  } catch (error) {
    console.error('❌ Error clearing chat messages:', error);
    process.exit(1);
  }
}

// Optional: Clear chats for a specific project
async function clearProjectChats(projectId: string) {
  console.log(`🧹 Clearing chat messages for project: ${projectId}\n`);

  try {
    // Count messages before deletion
    const count = await prisma.chatMessage.count({
      where: { projectId }
    });

    console.log(`📊 Found ${count} chat messages for this project`);

    if (count === 0) {
      console.log('✅ No messages to delete!');
      return;
    }

    // Delete chat messages for this project
    const result = await prisma.chatMessage.deleteMany({
      where: { projectId }
    });

    console.log(`\n✅ Successfully deleted ${result.count} chat messages!`);
    console.log('🎯 Project chats cleared.');

  } catch (error) {
    console.error('❌ Error clearing chat messages:', error);
    process.exit(1);
  }
}

// Main execution
const projectId = process.argv[2];

if (projectId) {
  clearProjectChats(projectId)
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
} else {
  clearAllScoutChats()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
