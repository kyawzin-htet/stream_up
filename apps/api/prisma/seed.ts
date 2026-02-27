import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function getAdminEmail() {
  const raw = process.env.ADMIN_EMAILS || 'admin@example.com';
  return (
    raw
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)[0] || 'admin@example.com'
  );
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const adminEmail = getAdminEmail();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin12345';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash },
      create: {
        email: adminEmail,
        passwordHash,
      },
    });

    console.log(`Seed complete.`);
    console.log(`Admin email: ${admin.email}`);
    console.log(`Admin password: ${adminPassword}`);
    console.log(`Admin id: ${admin.id}`);
    console.log(
      'Note: isAdmin is controlled by ADMIN_EMAILS. Ensure this email is present in ADMIN_EMAILS.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

