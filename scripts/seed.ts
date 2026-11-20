import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_EMAIL = 'abacus-094eaab6@example.com';
const TEST_PASSWORD = 'H@9MIqnxWi';

const now = new Date();
const year = now.getUTCFullYear();
const month = now.getUTCMonth();
const dayOfMonth = now.getUTCDate();

function dayDate(day: number): Date {
  return new Date(Date.UTC(year, month, Math.max(1, Math.min(day, dayOfMonth))));
}

function dayKey(offset: number): Date {
  const date = new Date(Date.UTC(year, month, dayOfMonth));
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: { passwordHash },
    create: { email: TEST_EMAIL, name: 'Planned Life', passwordHash },
  });

  const expenseCount = await prisma.expense.count({ where: { userId: user.id } });
  if (expenseCount === 0) {
    const demoExpenses = [
      { day: 1, amount: 420.5, category: 'market', note: 'Haftalık market' },
      { day: 2, amount: 85, category: 'yemek', note: 'Öğle yemeği' },
      { day: 3, amount: 240, category: 'fatura', note: 'Elektrik' },
      { day: 5, amount: 60, category: 'ulasim', note: 'Otobüs kartı' },
      { day: 7, amount: 310, category: 'market', note: 'Manav ve kahvaltılık' },
      { day: 9, amount: 150, category: 'saglik', note: 'Vitamin' },
      { day: 11, amount: 95, category: 'eglence', note: 'Sinema' },
      { day: 13, amount: 520, category: 'giyim', note: 'Kışlık mont' },
      { day: 15, amount: 180, category: 'yemek', note: 'Arkadaşlarla akşam yemeği' },
      { day: 17, amount: 275, category: 'market', note: 'Haftalık market' },
      { day: 18, amount: 45, category: 'ulasim', note: 'Taksi' },
      { day: 19, amount: 120, category: 'diger', note: 'Kitap' },
    ];

    await prisma.expense.createMany({
      data: demoExpenses.map((item) => ({
        userId: user.id,
        amount: item.amount,
        category: item.category,
        date: dayDate(item.day),
        note: item.note,
      })),
    });
  }

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  await prisma.budget.upsert({
    where: { userId_month: { userId: user.id, month: monthKey } },
    update: {},
    create: { userId: user.id, month: monthKey, amount: 8000 },
  });

  const routineCount = await prisma.routine.count({ where: { userId: user.id } });
  if (routineCount === 0) {
    const demoRoutines = [
      { title: '2 litre su iç', period: 'daily', icon: 'water', target: 1, reminderTime: '09:00' },
      { title: '10.000 adım yürü', period: 'daily', icon: 'walk', target: 1, reminderTime: '19:00' },
      { title: 'Vitamin al', period: 'daily', icon: 'pill', target: 1, reminderTime: '08:30' },
      { title: 'Spor salonuna git', period: 'weekly', icon: 'dumbbell', target: 3, reminderTime: null },
      { title: 'Kitap oku (20 gün)', period: 'monthly', icon: 'book', target: 20, reminderTime: null },
    ];

    for (const routine of demoRoutines) {
      const created = await prisma.routine.create({
        data: {
          userId: user.id,
          title: routine.title,
          period: routine.period,
          icon: routine.icon,
          target: routine.target,
          reminderTime: routine.reminderTime,
        },
      });

      const offsets = routine.period === 'daily' ? [0, -1, -2, -4] : [0, -1, -3, -5, -8];
      for (const offset of offsets) {
        const date = dayKey(offset);
        try {
          await prisma.routineCompletion.upsert({
            where: { routineId_date: { routineId: created.id, date } },
            update: {},
            create: { routineId: created.id, userId: user.id, date },
          });
        } catch {
          // ignore duplicate days
        }
      }
    }
  }

  const todoCount = await prisma.todo.count({ where: { userId: user.id } });
  if (todoCount === 0) {
    await prisma.todo.createMany({
      data: [
        {
          userId: user.id,
          title: 'Su faturasını öde',
          priority: 'high',
          dueDate: dayKey(2),
          reminderAt: new Date(Date.UTC(year, month, dayOfMonth, 9, 0)),
        },
        { userId: user.id, title: 'Eczaneden vitamin al', priority: 'normal', dueDate: dayKey(1) },
        { userId: user.id, title: 'Hafta sonu için plan yap', priority: 'low' },
        {
          userId: user.id,
          title: 'Doktor randevusu al',
          priority: 'normal',
          completed: true,
          completedAt: dayKey(-1),
        },
      ],
    });
  }

  const noteCount = await prisma.note.count({ where: { userId: user.id } });
  if (noteCount === 0) {
    await prisma.note.createMany({
      data: [
        {
          userId: user.id,
          title: 'Alışveriş listesi',
          content: 'Yumurta\nSüt\nTam buğday ekmeği\nMuz\nZeytinyağı',
          pinned: true,
        },
        {
          userId: user.id,
          title: 'Bu ayın hedefleri',
          content: '1. Haftada 3 gün spor\n2. Günlük 10.000 adım\n3. Aylık bütçeyi 8.000 TL altında tutmak',
        },
      ],
    });
  }

  console.log('Seed tamamlandı:', user.email);
}

main()
  .catch((error) => {
    console.error('Seed hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
