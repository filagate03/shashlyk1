import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth.js';
import { findImageUrl } from '../utils/pexels.js';

const prisma = new PrismaClient();
let imagesRefreshStarted = false;
const router = Router();

router.get('/', async (_req, res) => {
  const items = await prisma.menuItem.findMany({ orderBy: { id: 'asc' } });
  res.json(items);
  // background refresh once per process
  if (!imagesRefreshStarted) {
    imagesRefreshStarted = true;
    (async () => {
      try {
        for (const it of items) {
          const url = await findImageUrl(`${it.name} еда блюдо`);
          if (url && url !== it.imageUrl) await prisma.menuItem.update({ where: { id: it.id }, data: { imageUrl: url } });
        }
      } catch {}
    })();
  }
});

// Admin can create/update menu
router.post('/', requireAdmin, async (req, res) => {
  const { name, description, price, imageUrl } = req.body || {};
  if (!name || typeof price !== 'number') return res.status(400).json({ error: 'Invalid data' });
  const item = await prisma.menuItem.create({ data: { name, description: description || '', price, imageUrl: imageUrl || '' } });
  res.status(201).json(item);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, price, imageUrl } = req.body || {};
  const item = await prisma.menuItem.update({ where: { id }, data: { name, description, price, imageUrl } });
  res.json(item);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.menuItem.delete({ where: { id } });
  res.json({ ok: true });
});

// Admin: backfill/refresh images from Pexels
router.post('/refresh-images', requireAdmin, async (_req, res) => {
  const items = await prisma.menuItem.findMany({ orderBy: { id: 'asc' } });
  let updated = 0;
  for (const it of items) {
    try {
      const q = `${it.name} еда, блюдо`;
      const url = await findImageUrl(q);
      if (url && url !== it.imageUrl) {
        await prisma.menuItem.update({ where: { id: it.id }, data: { imageUrl: url } });
        updated++;
      }
    } catch {}
  }
  res.json({ updated });
});

export default router;
