import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import { faker } from '@faker-js/faker'

faker.seed(42)

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // ── Cleanup (orden inverso a FK) ──────────────────────────────
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.certificate.deleteMany()
  await prisma.review.deleteMany()
  await prisma.lessonProgress.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.promotion.deleteMany()
  await prisma.sliderCourse.deleteMany()
  await prisma.slider.deleteMany()
  await prisma.material.deleteMany()
  await prisma.session.deleteMany()
  await prisma.module.deleteMany()
  await prisma.instructor.deleteMany()
  await prisma.certificateTemplate.deleteMany()
  await prisma.course.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleanup completado')

  const passwordHash = await bcrypt.hash('password123', 10)

  // ── Users ────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      first_name: 'Admin', last_name: 'Principal', email: 'admin@escuelaglobal.com',
      phone: faker.phone.number(), role: 'admin', password_hash: passwordHash,
      email_verified: true,
    },
  })
  const soporte = await prisma.user.create({
    data: {
      first_name: 'Soporte', last_name: 'Tecnico', email: 'soporte@escuelaglobal.com',
      phone: faker.phone.number(), role: 'soporte', password_hash: passwordHash,
      email_verified: true,
    },
  })
  const marketingUser = await prisma.user.create({
    data: {
      first_name: 'Marketing', last_name: 'Lead', email: 'marketing@escuelaglobal.com',
      phone: faker.phone.number(), role: 'marketing', password_hash: passwordHash,
      email_verified: true,
    },
  })

  const students: Awaited<ReturnType<typeof prisma.user.create>>[] = []
  for (let i = 0; i < 10; i++) {
    const student = await prisma.user.create({
      data: {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        country: faker.location.country(),
        role: 'estudiante',
        password_hash: passwordHash,
        email_verified: true,
      },
    })
    students.push(student)
  }
  console.log(`👤 ${13} usuarios creados`)

  // ── Categories ────────────────────────────────────────────────
  const categoryData = [
    { name: 'Desarrollo Web', slug: 'desarrollo-web', icon: 'code', color: '#3B82F6', description: 'Aprende desarrollo web desde cero', display_order: 1 },
    { name: 'Data Science', slug: 'data-science', icon: 'chart', color: '#10B981', description: 'Ciencia de datos e inteligencia artificial', display_order: 2 },
    { name: 'Diseño UX/UI', slug: 'diseno-ux-ui', icon: 'palette', color: '#F59E0B', description: 'Diseño de experiencia de usuario', display_order: 3 },
    { name: 'Marketing Digital', slug: 'marketing-digital', icon: 'megaphone', color: '#EF4444', description: 'Estrategias de marketing online', display_order: 4 },
    { name: 'Negocios', slug: 'negocios', icon: 'briefcase', color: '#8B5CF6', description: 'Gestión empresarial y emprendimiento', display_order: 5 },
  ]
  const categories: Awaited<ReturnType<typeof prisma.category.create>>[] = []
  for (const cat of categoryData) {
    categories.push(await prisma.category.create({ data: cat }))
  }
  console.log(`📂 ${categories.length} categorías creadas`)

  // ── Courses ──────────────────────────────────────────────────
  const rawCourses = [
    { title: 'React desde Cero', slug: 'react-desde-cero', tagline: 'Aprende React paso a paso', level: 'principiante' as const, price: 49.99, currency: 'USD' as const, access_duration: 'lifetime' as const, published: true, catIdx: 0 },
    { title: 'Node.js Avanzado', slug: 'nodejs-avanzado', tagline: 'Domina Node.js en producción', level: 'avanzado' as const, price: 79.99, currency: 'USD' as const, access_duration: 'lifetime' as const, published: false, catIdx: 0 },
    { title: 'Python para Data Science', slug: 'python-data-science', tagline: 'Introducción al análisis de datos', level: 'principiante' as const, price: 59.99, currency: 'USD' as const, access_duration: 'one_year' as const, published: true, catIdx: 1 },
    { title: 'Figma para UX/UI', slug: 'figma-ux-ui', tagline: 'Diseña interfaces modernas', level: 'intermedio' as const, price: 39.99, currency: 'PEN' as const, access_duration: 'lifetime' as const, published: false, catIdx: 2 },
    { title: 'SEO Avanzado', slug: 'seo-avanzado', tagline: 'Posiciona tu sitio web', level: 'intermedio' as const, price: 44.99, currency: 'USD' as const, access_duration: 'one_year' as const, published: true, catIdx: 3 },
  ]
  const courses: Awaited<ReturnType<typeof prisma.course.create>>[] = []
  for (const rc of rawCourses) {
    const course = await prisma.course.create({
      data: {
        category_id: categories[rc.catIdx].id,
        title: rc.title,
        slug: rc.slug,
        tagline: rc.tagline,
        description: faker.lorem.paragraphs(3),
        thumbnail_url: faker.image.urlPicsumPhotos(),
        level: rc.level,
        software_tools: faker.helpers.arrayElements(['Git', 'Docker', 'VS Code', 'Postman', 'Figma', 'Webpack', 'Jest'], 3),
        price: rc.price,
        currency: rc.currency,
        access_duration: rc.access_duration,
        prerequisites: ['Conocimientos básicos de programación', 'Manejo de terminal'],
        outcomes: ['Crear proyectos reales', 'Certificación oficial'],
        status: rc.published ? 'published' : 'draft',
        published_at: rc.published ? new Date() : null,
        created_by: admin.id,
        avg_rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 2 }),
        review_count: faker.number.int({ min: 0, max: 20 }),
        enrolled_count: faker.number.int({ min: 5, max: 100 }),
        total_duration_minutes: faker.number.int({ min: 300, max: 3000 }),
      },
    })
    courses.push(course)
  }
  console.log(`📚 ${courses.length} cursos creados`)

  // ── Instructors ──────────────────────────────────────────────
  for (const course of courses) {
    for (let i = 0; i < 2; i++) {
      await prisma.instructor.create({
        data: {
          course_id: course.id,
          full_name: faker.person.fullName(),
          title: faker.person.jobTitle(),
          description: faker.lorem.sentence(),
          photo_url: faker.image.urlPicsumPhotos(),
          display_order: i + 1,
        },
      })
    }
  }
  console.log(`👨‍🏫 ${courses.length * 2} instructores creados`)

  // ── Modules & Sessions & Materials ──────────────────────────
  for (const course of courses) {
    for (let m = 0; m < 6; m++) {
      const module = await prisma.module.create({
        data: {
          course_id: course.id,
          title: faker.company.buzzNoun(),
          description: faker.lorem.sentence(),
          display_order: m + 1,
        },
      })
      for (let s = 0; s < 8; s++) {
        const session = await prisma.session.create({
          data: {
            module_id: module.id,
            title: faker.lorem.words(3),
            description: faker.lorem.sentence(),
            youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            youtube_video_id: 'dQw4w9WgXcQ',
            duration_minutes: faker.number.int({ min: 5, max: 30 }),
            display_order: s + 1,
          },
        })
        for (let mt = 0; mt < 2; mt++) {
          await prisma.material.create({
            data: {
              session_id: session.id,
              name: faker.system.fileName(),
              drive_url: faker.internet.url(),
              type: faker.helpers.arrayElement(['PDF', 'Excel', 'Word', 'Otro'] as const),
            },
          })
        }
      }
    }
  }
  console.log(`📦 ${courses.length * 6} módulos, ${courses.length * 6 * 8} sesiones, ${courses.length * 6 * 8 * 2} materiales creados`)

  // ── CertificateTemplate ─────────────────────────────────────
  const certTemplate = await prisma.certificateTemplate.create({
    data: {
      name: 'Plantilla Estándar',
      background_image_url: faker.image.urlPicsumPhotos(),
      student_name_position: { x: 100, y: 200 },
      course_name_position: { x: 100, y: 300 },
      dates_position: { x: 100, y: 400 },
      verification_code_position: { x: 100, y: 500 },
      qr_position: { x: 400, y: 400 },
      font_family: 'Arial',
      font_sizes: { student_name: 24, course_name: 20, dates: 14, verification_code: 12 },
      is_active: true,
    },
  })

  // ── Orders & OrderItems ─────────────────────────────────────
  const orders: Awaited<ReturnType<typeof prisma.order.create>>[] = []
  for (let i = 0; i < 10; i++) {
    const student = students[i]
    const course = courses[i % courses.length]
    const order = await prisma.order.create({
      data: {
        user_id: student.id,
        order_number: `ORD-${String(i + 1).padStart(5, '0')}`,
        subtotal: course.price,
        total: course.price,
        currency: course.currency === 'USD' ? 'USD' : 'PEN',
        payment_method: faker.helpers.arrayElement(['stripe', 'niubiz'] as const),
        payment_status: 'paid',
        gateway_transaction_id: faker.string.alphanumeric(24),
        billing_name: `${student.first_name} ${student.last_name}`,
        billing_email: student.email,
        billing_country: student.country ?? 'Perú',
        billing_dni_ruc: faker.string.numeric(8),
      },
    })
    orders.push(order)

    await prisma.orderItem.create({
      data: {
        order_id: order.id,
        course_id: course.id,
        unit_price: course.price,
        final_price: course.price,
      },
    })
  }
  console.log(`🧾 ${orders.length} órdenes creadas`)

  // ── Enrollments ──────────────────────────────────────────────
  const enrollments: Awaited<ReturnType<typeof prisma.enrollment.create>>[] = []
  for (let i = 0; i < 10; i++) {
    const student = students[i]
    const course = courses[i % courses.length]
    const order = orders[i]
    const enrollment = await prisma.enrollment.create({
      data: {
        user_id: student.id,
        course_id: course.id,
        order_id: order.id,
        enrollment_type: 'online',
        enrolled_by: admin.id,
        progress_percent: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
        last_accessed_at: faker.date.recent(),
      },
    })
    enrollments.push(enrollment)
  }
  console.log(`📝 ${enrollments.length} matrículas creadas`)

  // ── LessonProgress ──────────────────────────────────────────
  const sessions = await prisma.session.findMany()
  for (let i = 0; i < 10; i++) {
    await prisma.lessonProgress.create({
      data: {
        enrollment_id: enrollments[i].id,
        session_id: sessions[i % sessions.length].id,
        watched_seconds: faker.number.int({ min: 0, max: 1800 }),
        completed: faker.datatype.boolean(),
        completed_at: faker.datatype.boolean() ? faker.date.recent() : null,
      },
    })
  }
  console.log(`✅ ${10} progresos de lección creados`)

  // ── Reviews + Certificates ──────────────────────────────────
  for (let i = 0; i < 8; i++) {
    const enrollment = enrollments[i]
    const course = courses[i % courses.length]
    const review = await prisma.review.create({
      data: {
        user_id: students[i].id,
        course_id: course.id,
        enrollment_id: enrollment.id,
        rating: faker.number.int({ min: 3, max: 5 }),
        comment: faker.lorem.paragraph(),
        status: 'approved',
      },
    })
    if (i < 5) {
      await prisma.certificate.create({
        data: {
          enrollment_id: enrollment.id,
          template_id: certTemplate.id,
          type: faker.helpers.arrayElement(['Certificado', 'Constancia'] as const),
          pdf_url: faker.internet.url(),
          review_id: review.id,
        },
      })
    }
  }
  console.log(`⭐ ${8} reseñas y ${5} certificados creados`)

  // ── Slider ────────────────────────────────────────────────────
  const slider = await prisma.slider.create({
    data: {
      title: 'Cursos Destacados',
      type: 'courses',
      position_on_page: 'top',
      display_order: 1,
      status: 'active',
    },
  })
  for (let i = 0; i < Math.min(3, courses.length); i++) {
    await prisma.sliderCourse.create({
      data: {
        slider_id: slider.id,
        course_id: courses[i].id,
        display_order: i + 1,
      },
    })
  }
  console.log(`🎠 1 slider con ${3} cursos asociados`)

  // ── Promotion ────────────────────────────────────────────────
  await prisma.promotion.create({
    data: {
      title: 'Descuento de Lanzamiento',
      image_url: faker.image.urlPicsumPhotos(),
      destination_url: faker.internet.url(),
      destination_course_id: courses[0].id,
      display_order: 1,
      status: 'active',
      starts_at: faker.date.past(),
      ends_at: faker.date.future(),
    },
  })
  console.log(`🏷️ 1 promoción creada`)

  // ── Notification ─────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    await prisma.notification.create({
      data: {
        user_id: students[i].id,
        type: faker.helpers.arrayElement(['nuevo_curso', 'completado', 'recordatorio', 'matriculacion', 'certificado'] as const),
        title: faker.lorem.words(3),
        body: faker.lorem.sentence(),
        is_read: faker.datatype.boolean(),
        redirect_url: faker.internet.url(),
      },
    })
  }
  console.log(`🔔 ${5} notificaciones creadas`)

  // ── AuditLog ─────────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    await prisma.auditLog.create({
      data: {
        user_id: admin.id,
        entity_type: faker.helpers.arrayElement(['Course', 'Enrollment', 'User']),
        entity_id: faker.string.uuid(),
        action: faker.helpers.arrayElement(['create', 'update', 'delete'] as const),
        changes: { before: {}, after: { example: 'change' } },
      },
    })
  }
  console.log(`📋 ${5} auditorías creadas`)

  // ── CartItem ─────────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    await prisma.cartItem.create({
      data: {
        user_id: i < 3 ? students[i].id : null,
        course_id: courses[(i + 2) % courses.length].id,
        session_token: i >= 3 ? faker.string.alphanumeric(32) : null,
      },
    })
  }
  console.log(`🛒 ${5} items de carrito creados`)

  console.log('\n✅ Seed completado exitosamente')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
