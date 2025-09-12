import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7));

  const [totalOrders, totalRevenueAgg, todayOrders, weekOrders, topItems] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.orderItem.groupBy({ by: ['menuItemId'], _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 })
  ]);

  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: topItems.map(t => t.menuItemId) } } });
  const items = topItems.map((t) => ({
    menuItemId: t.menuItemId,
    name: menuItems.find(m => m.id === t.menuItemId)?.name || `#${t.menuItemId}`,
    quantity: t._sum.quantity || 0
  }));

  res.json({
    totalOrders,
    totalRevenue: totalRevenueAgg._sum.total || 0,
    todayOrders,
    weekOrders,
    topItems: items
  });
});

export default router;

