import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';

export const createSystemFeedback = async (
  userId: string,
  data: {
    numberStar: number;
    description: string;
  }
) => {
  if (
    !Number.isInteger(data.numberStar) ||
    data.numberStar < 1 ||
    data.numberStar > 5
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Star rating must be an integer between 1 and 5'
    );
  }

  const description = data.description.trim();

  if (!description) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Description is required');
  }

  return prismaClient.system_feedback.create({
    data: {
      userId,
      numberStar: data.numberStar,
      description
    }
  });
};
