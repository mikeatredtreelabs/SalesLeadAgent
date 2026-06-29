const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Tenant seed emails
const tenantEmails = {
  redtreeai: 'admin@redtreeai.com',
  default: 'admin@salesleadagent.io',
};

async function main() {
  const tenant = process.env.NEXT_PUBLIC_TENANT || 'redtreeai';
  const email = process.env.SEED_EMAIL || tenantEmails[tenant] || tenantEmails.default;
  const password = process.env.SEED_PASSWORD || 'changeme123';
  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Admin', password: hashed },
  });

  console.log('');
  console.log('✓ User created successfully');
  console.log('  Email:    ' + email);
  console.log('  Password: ' + password);
  console.log('  Tenant:   ' + tenant);
  console.log('');
  console.log('  Change your password after first login.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
