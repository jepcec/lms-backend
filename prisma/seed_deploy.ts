import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@escuelaglobal.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123'
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Admin'
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'Principal'

async function main() {
  console.log('🔍 Verificando si el admin ya existe...')

  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  if (existingAdmin) {
    console.log(`ℹ️  Admin con email "${ADMIN_EMAIL}" ya existe. Omitiendo creación.`)
    console.log('✅ Seed deploy completado (sin cambios)')
    return
  }

  console.log('👤 Creando usuario admin...')

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  await prisma.user.create({
    data: {
      first_name: ADMIN_FIRST_NAME,
      last_name: ADMIN_LAST_NAME,
      email: ADMIN_EMAIL,
      phone: '+51 000 000 000',
      role: 'admin',
      password_hash: passwordHash,
      email_verified: true,
    },
  })

  console.log(`
✅ Seed deploy completado exitosamente

📋 Datos del admin creado:
   Email: ${ADMIN_EMAIL}
   Password: ${ADMIN_PASSWORD}
   Rol: admin

⚠️  Recuerda cambiar estos valores en producción.
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })