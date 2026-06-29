import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL || 'admin@salesleadagent.io';
  const password = process.env.SEED_PASSWORD || 'changeme123';
  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Admin', password: hashed },
  });
  console.log(`✓ User created: ${email} / ${password}`);
  console.log('  Change your password after first login.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
