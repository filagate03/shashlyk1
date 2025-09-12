import { Router } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { requireAdmin } from '../middleware/auth.js';
import { EventEmitter } from 'events';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const bus = new EventEmitter();
const router = Router();

// Public: create order
router.post('/', async (req, res) => {
  const { customerName, phone, address, comment, items, acceptTerms } = req.body || {};
  if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }
  // Recalculate total and create order + items
  const menuIds = items.map((i: any) => Number(i.menuItemId));
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuIds } } });
  const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
  let total = 0;
  const orderItems = items.map((i: any) => {
    const price = priceMap.get(Number(i.menuItemId)) || 0;
    total += price * Number(i.quantity || 1);
    return { menuItemId: Number(i.menuItemId), quantity: Number(i.quantity || 1), priceAtPurchase: price };
  });
  // Ensure user exists by phone
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    if (!acceptTerms) return res.status(400).json({ error: 'TERMS_REQUIRED' });
    user = await prisma.user.create({ data: { name: customerName, phone, acceptedAt: new Date() } });
  } else if (!user.acceptedAt) {
    if (!acceptTerms) return res.status(400).json({ error: 'TERMS_REQUIRED' });
    user = await prisma.user.update({ where: { id: user.id }, data: { acceptedAt: new Date() } });
  }
  const order = await prisma.order.create({
    data: {
      customerName,
      phone,
      address,
      comment: comment || '',
      total,
      status: OrderStatus.PENDING,
      items: { create: orderItems },
      userId: user.id
    },
    include: { items: { include: { menuItem: true } }, courier: true }
  });
  const userToken = jwt.sign({ role: 'user', userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
  bus.emit('order', { type: 'created', orderId: order.id, at: new Date().toISOString() });
  res.status(201).json({ order, userToken });
});

// Admin: list orders
router.get('/', requireAdmin, async (req, res) => {
  const status = (req.query.status as string) || undefined;
  const where = status ? { status: status as OrderStatus } : {};
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { menuItem: true } }, courier: true }
  });
  res.json(orders);
});

// Admin: update status / assign courier
router.patch('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status, courierId } = req.body || {};
  const data: any = {};
  if (status) data.status = status as OrderStatus;
  if (courierId !== undefined) data.courierId = courierId;
  // set timeline timestamps on first reach of status
  const current = await prisma.order.findUnique({ where: { id } });
  if (status && current) {
    const s = status as OrderStatus;
    if (s === 'ACCEPTED' && !current.acceptedAt) data.acceptedAt = new Date();
    if (s === 'COOKING' && !current.cookingAt) data.cookingAt = new Date();
    if (s === 'ON_THE_WAY' && !current.onWayAt) data.onWayAt = new Date();
    if (s === 'DELIVERED' && !current.deliveredAt) data.deliveredAt = new Date();
    if (s === 'CANCELED' && !current.canceledAt) data.canceledAt = new Date();
  }
  const updated = await prisma.order.update({ where: { id }, data, include: { items: true, courier: true } });
  bus.emit('order', { type: 'updated', orderId: updated.id, status: updated.status, at: new Date().toISOString() });
  res.json(updated);
});

// Server-Sent Events: live activity
router.get('/stream', requireAdmin, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const onEvent = (evt: any) => {
    res.write(`data: ${JSON.stringify(evt)}\n\n`);
  };
  bus.on('order', onEvent);
  const keepalive = setInterval(() => res.write(':keepalive\n\n'), 25000);
  req.on('close', () => {
    clearInterval(keepalive);
    bus.off('order', onEvent);
  });
});

export default router;
