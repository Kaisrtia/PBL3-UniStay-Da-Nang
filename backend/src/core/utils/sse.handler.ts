import { Request, Response } from 'express';
import { connection } from '../config/redis.connection';

export const sseHandler = async (req: Request, res: Response) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res
      .status(400)
      .json({ error: 'Missing userId in query parameters' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();

  res.write(': connected\n\n');

  try {
    await connection.sadd('online_users', userId);

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
      await connection.srem('online_users', userId);
      res.end();
    });
  } catch (error) {
    console.error('Lỗi khi thiết lập SSE:', error);
    res.end(); // Đóng kết nối nếu có lỗi Redis
  }
};