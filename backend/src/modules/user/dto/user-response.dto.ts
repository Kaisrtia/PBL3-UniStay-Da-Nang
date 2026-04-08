import { user } from '@prisma/client';

export interface UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  dob: Date | null;
  gender: string | null;
  status: string | null;
  roles: string[];
}

export const toUserResponseDto = (user: user): UserResponseDto => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  dob: user.dob,
  gender: user.gender,
  status: user.status,
  roles: user.roles
});
