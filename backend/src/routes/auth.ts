import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', (req, res) => {
  let { username, password } = req.body || {};
  if (typeof username === 'string') username = username.trim();
  if (typeof password === 'string') password = password.trim();
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// User login or auto-register by phone
router.post('/user-login', async (req, res) => {
  const { phone, name, acceptTerms } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone required' });
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    if (!acceptTerms) return res.status(400).json({ error: 'TERMS_REQUIRED' });
    user = await prisma.user.create({ data: { phone, name: name || 'Гость', acceptedAt: new Date() } });
  } else {
    const data: any = {};
    if (name && name !== user.name) data.name = name;
    if (!user.acceptedAt && acceptTerms) data.acceptedAt = new Date();
    if (Object.keys(data).length) user = await prisma.user.update({ where: { id: user.id }, data });
    if (!user.acceptedAt) return res.status(400).json({ error: 'TERMS_REQUIRED' });
  }
  const token = jwt.sign({ role: 'user', userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
  return res.json({ token, user });
});

router.get('/me', requireAuth, async (req, res) => {
  const payload = (req as any).user as { role: string; userId?: number };
  if (payload.role === 'user' && payload.userId) {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    const orders = await prisma.order.findMany({ where: { userId: payload.userId }, orderBy: { createdAt: 'desc' }, take: 20 });
    return res.json({ role: 'user', user, orders });
  }
  if (payload.role === 'admin') return res.json({ role: 'admin' });
  return res.status(400).json({ error: 'Unknown role' });
});

export default router;
