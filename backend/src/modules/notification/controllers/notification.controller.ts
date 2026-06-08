import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import { sendSuccess } from '../../../core/utils/response.handler';
import * as notificationService from '../services/notification.service';
import { AppError } from '../../../core/exceptions/AppError';

export const handleGetNotifications = async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'page must be a positive integer');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'limit must be an integer between 1 and 50'
    );
  }

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

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Notification ID must be a positive integer'
    );
  }

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
