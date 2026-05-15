import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import { sendSuccess } from '../../../core/utils/response.handler';
import * as notificationService from '../services/notification.service';

export const handleGetNotifications = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const notifications = await notificationService.getUserNotifications(
    req.user!.id,
    page,
    limit
  );

  sendSuccess(res, HttpStatus.OK, notifications, 'Đã tải danh sách thông báo.');
};

export const handleMarkNotificationAsRead = async (
  req: Request,
  res: Response
) => {
  const notificationId = Number(req.params.id);
  const notification = await notificationService.markNotificationAsRead(
    req.user!.id,
    notificationId
  );

  sendSuccess(res, HttpStatus.OK, notification, 'Đã đánh dấu thông báo là đã đọc.');
};

export const handleMarkAllNotificationsAsRead = async (
  req: Request,
  res: Response
) => {
  await notificationService.markAllNotificationsAsRead(req.user!.id);

  sendSuccess(res, HttpStatus.OK, null, 'Đã đánh dấu tất cả thông báo là đã đọc.');
};
