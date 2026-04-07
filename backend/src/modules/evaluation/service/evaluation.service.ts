import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user } from '@prisma/client';

export const createEvaluation = async (
  currentUser: user,
  data: {
    hostId: string;
    numberStar: number;
    description: string;
  }
) => {
  if (data.numberStar < 1 || data.numberStar > 5) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Star rating must be between 1 and 5');
  }

  // Check if student exists
  const student = await prismaClient.student.findUnique({
    where: { studentId: currentUser.id }
  });

  if (!student) {
    throw new AppError(HttpStatus.FORBIDDEN, 'Only registered students can evaluate hosts');
  }

  // Check if host exists
  const host = await prismaClient.host.findUnique({
    where: { hostId: data.hostId }
  });

  if (!host) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Host not found');
  }

  // Create evaluation
  const evaluation = await prismaClient.student_evaluate_host.create({
    data: {
      studentId: currentUser.id,
      hostId: data.hostId,
      numberStar: data.numberStar,
      description: data.description
    }
  });

  // Calculate new average star for the host
  const aggregates = await prismaClient.student_evaluate_host.aggregate({
    where: { hostId: data.hostId },
    _avg: {
      numberStar: true
    }
  });

  const newAvgStar = aggregates._avg.numberStar || data.numberStar;

  // Update host
  await prismaClient.host.update({
    where: { hostId: data.hostId },
    data: {
      avgStar: newAvgStar
    }
  });

  return evaluation;
};

export const createSystemFeedback = async (
  currentUser: user,
  data: {
    numberStar: number;
    description: string;
  }
) => {
  if (data.numberStar < 1 || data.numberStar > 5) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Star rating must be between 1 and 5');
  }

  // Create system feedback
  const feedback = await prismaClient.system_feedback.create({
    data: {
      userId: currentUser.id,
      numberStar: data.numberStar,
      description: data.description
    }
  });

  return feedback;
};
