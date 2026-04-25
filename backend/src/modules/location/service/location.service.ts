import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';



export const getWardById = async (id: number) => {
  const ward = await prismaClient.ward.findUnique({
    where: { id: id },
    include: { universities: true }
  });

  if (!ward) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Ward not found');
  }

  return ward;
};

export const getAllUniversities = async () => {
  return prismaClient.university.findMany({
    include: { ward: true }
  });
};

export const getUniversitiesByWard = async (wardId: number) => {
  const wardExists = await prismaClient.ward.findUnique({
    where: { id: wardId }
  });

  if (!wardExists) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Ward not found');
  }

  return prismaClient.university.findMany({
    where: { wardId: wardId }
  });
};

export const getUniversityById = async (id: string) => {
  const university = await prismaClient.university.findUnique({
    where: { id },
    include: { ward: true }
  });

  if (!university) {
    throw new AppError(HttpStatus.NOT_FOUND, 'University not found');
  }

  return university;
};
