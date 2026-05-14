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
  if (data.numberStar < 1 || data.numberStar > 5) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Star rating must be between 1 and 5'
    );
  }

  // Create system feedback
  const feedback = await prismaClient.system_feedback.create({
    data: {
      userId,
      numberStar: data.numberStar,
      description: data.description
    }
  });

  return feedback;
};
