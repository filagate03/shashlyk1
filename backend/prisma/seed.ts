import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.menuItem.count();
  if (count === 0) {
    await prisma.menuItem.createMany({
      data: [
        { name: 'Шашлык из свинины', description: 'Сочный, на мангале', price: 65000, imageUrl: 'https://images.unsplash.com/photo-1625944528461-992ca610cb5f?q=80&w=1200&auto=format&fit=crop' },
        { name: 'Шашлык из курицы', description: 'Нежнейший', price: 55000, imageUrl: 'https://images.unsplash.com/photo-1611043714658-a8b0b36a52e9?q=80&w=1200&auto=format&fit=crop' },
        { name: 'Люля-кебаб', description: 'Говядина/баранина', price: 70000, imageUrl: 'https://images.unsplash.com/photo-1617196034796-73dfa6eaeea2?q=80&w=1200&auto=format&fit=crop' },
        { name: 'Овощи гриль', description: 'К набору шашлыков', price: 25000, imageUrl: 'https://images.unsplash.com/photo-1617093727343-3749692e15ec?q=80&w=1200&auto=format&fit=crop' },
        { name: 'Лепёшка', description: 'Тёплая, хрустящая', price: 8000, imageUrl: 'https://images.unsplash.com/photo-1577636707195-9d6b45ed94f9?q=80&w=1200&auto=format&fit=crop' }
      ]
    });
  }

  const couriers = await prisma.courier.count();
  if (couriers === 0) {
    await prisma.courier.createMany({
      data: [
        { name: 'Иван', phone: '+7 999 111-22-33', isAvailable: true },
        { name: 'Олег', phone: '+7 999 222-33-44', isAvailable: true },
        { name: 'Рашид', phone: '+7 999 333-44-55', isAvailable: false }
      ]
    });
  }

  const orders = await prisma.order.count();
  if (orders === 0) {
    const items = await prisma.menuItem.findMany({ take: 3 });
    await prisma.order.create({
      data: {
        customerName: 'Тест Клиент',
        phone: '+7 900 000-00-00',
        address: 'ул. Примерная, д. 1',
        comment: 'Без лука',
        status: OrderStatus.PENDING,
        total: items.reduce((s, i) => s + i.price, 0),
        items: {
          create: items.map((m) => ({ menuItemId: m.id, quantity: 1, priceAtPurchase: m.price }))
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

