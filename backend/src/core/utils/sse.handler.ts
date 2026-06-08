import { Request, Response } from 'express';
import { connection } from '../config/redis.connection';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import prismaClient from '../config/prisma';
import { account_status } from '@prisma/client';

const resolveUserId = async (req: Request) => {
  if (req.user) {
    return req.user.id;
  }

  const bearerToken = req.headers.authorization?.split(' ')[1];
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = bearerToken || queryToken;

  if (!token) {
    return undefined;
  }

  const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
  const user = await prismaClient.user.findUnique({
    where: { id: decoded.id }
  });

  if (
    !user ||
    user.status === account_status.BANNED ||
    user.status === account_status.LOCKED ||
    user.status === account_status.HIDDEN
  ) {
    return undefined;
  }

  return user.id;
};

export const sseHandler = async (req: Request, res: Response) => {
  let userId: string | undefined;

  try {
    userId = await resolveUserId(req);
  } catch {
    userId = undefined;
  }

  if (!userId) {
    return res
      .status(401)
      .json({ error: 'Không thể xác thực người dùng để mở kênh thông báo.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();

  res.write(': connected\n\n');

  try {
    const subscriber = connection.duplicate();
    await subscriber.subscribe(`user_notif:${userId}`);

    subscriber.on('message', (channel, message) => {
      res.write(`data: ${message}\n\n`);
    });

    const heartbeatInterval = setInterval(() => {
      res.write(': ping\n\n');
    }, 30000);

    req.on('close', async () => {
      console.log('User disconnected:', userId);
      clearInterval(heartbeatInterval);
      await subscriber.unsubscribe();
      await subscriber.quit();
      res.end();
    });
  } catch (error) {
    console.error('Lỗi khi thiết lập SSE:', error);
    res.end(); // Đóng kết nối nếu có lỗi Redis
  }
};
