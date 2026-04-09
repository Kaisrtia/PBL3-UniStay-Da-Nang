import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';

export const getAllDistricts = async () => {
  return prismaClient.district.findMany();
};

export const getDistrictById = async (id: number) => {
  const district = await prismaClient.district.findUnique({
    where: { id: id },
    include: { wards: true }
  });

  if (!district) {
    throw new AppError(HttpStatus.NOT_FOUND, 'District not found');
  }

  return district;
};

export const getWardsByDistrict = async (districtId: number) => {
  const districtExists = await prismaClient.district.findUnique({
    where: { id: districtId }
  });

  if (!districtExists) {
    throw new AppError(HttpStatus.NOT_FOUND, 'District not found');
  }

  return prismaClient.ward.findMany({
    where: { districtId: districtId }
  });
};

export const getWardById = async (id: number) => {
  const ward = await prismaClient.ward.findUnique({
    where: { id: id },
    include: { district: true, universities: true }
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
