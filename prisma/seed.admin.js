require('dotenv/config')
const { PrismaClient } = require('../src/generated/prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcrypt')

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    'Faltan variables de entorno. Define ADMIN_EMAIL y ADMIN_PASSWORD en tu .env',
  )
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password_hash: passwordHash,
      role: 'admin',
      email_verified: true,
      email_verified_at: new Date(),
      status: 'active',
    },
    create: {
      first_name: 'Admin',
      last_name: 'Principal',
      email: ADMIN_EMAIL,
      phone: '+000000000',
      role: 'admin',
      password_hash: passwordHash,
      email_verified: true,
      email_verified_at: new Date(),
      status: 'active',
    },
  })

  console.log(`Admin seed aplicado: ${admin.email}`)
}

main()
  .catch((e) => {
    console.error('Error durante el seed admin:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
