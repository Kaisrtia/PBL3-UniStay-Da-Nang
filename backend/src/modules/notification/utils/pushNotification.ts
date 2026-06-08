import { connection } from '../../../core/config/redis.connection';

export const pushNotificationIfOnline = async (
  userId: string,
  notification: object
) => {
  const subscriberCount = await connection.publish(
    `user_notif:${userId}`,
    JSON.stringify(notification)
  );

  return subscriberCount > 0;
};
