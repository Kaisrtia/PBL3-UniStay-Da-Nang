import { Request, Response } from 'express';
import { connection } from '../config/redis.connection';

export const sseHandler = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  await connection.sadd('online_users', userId!);

  const subscriber = connection.duplicate();
  await subscriber.subscribe(`user_notif:${userId}`);

  subscriber.on('message', (channel, message) => {
    res.write(`data: ${message}\n\n`);
  });

  req.on('close', async () => {
    await subscriber.unsubscribe();
    await subscriber.quit();
    await connection.srem('online_users', userId!);
    res.end();
  });
};