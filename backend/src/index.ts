import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth.js';
import menuRouter from './routes/menu.js';
import ordersRouter from './routes/orders.js';
import couriersRouter from './routes/couriers.js';
import statsRouter from './routes/stats.js';
import uploadsRouter from './routes/uploads.js';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/couriers', couriersRouter);
app.use('/api/stats', statsRouter);
app.use('/api/uploads', uploadsRouter);

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
});
