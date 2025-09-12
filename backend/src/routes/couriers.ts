import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  const couriers = await prisma.courier.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(couriers);
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, phone, isAvailable } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Invalid data' });
  const courier = await prisma.courier.create({ data: { name, phone, isAvailable: isAvailable ?? true } });
  res.status(201).json(courier);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, isAvailable } = req.body || {};
  const courier = await prisma.courier.update({ where: { id }, data: { name, phone, isAvailable } });
  res.json(courier);
});

export default router;

