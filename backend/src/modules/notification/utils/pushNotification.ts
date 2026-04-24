import { connection } from '../../../core/config/redis.connection';

/**
 * Push a notification to the user via Redis Pub/Sub if they are currently online.
 * @param userId - The target user's ID
 * @param notification - The notification payload to publish
 */
export const pushNotificationIfOnline = async (
  userId: string,
  notification: object
) => {
  const isOnline = await connection.sismember('online_users', userId);
  if (isOnline) {
    await connection.publish(
      `user_notif:${userId}`,
      JSON.stringify(notification)
    );
  }
  return !!isOnline;
};
