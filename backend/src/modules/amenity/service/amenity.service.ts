import prismaClient from '../../../core/config/prisma';

export const getAllAmenities = async () => {
  return prismaClient.amenity.findMany({
    orderBy: { name: 'asc' }
  });
};
