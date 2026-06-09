import HttpStatus from 'http-status';
import { AppError } from '../exceptions/AppError';

const parsePositiveInteger = (
  value: unknown,
  fieldName: string,
  defaultValue: number,
  maxValue?: number
) => {
  if (value === undefined) return defaultValue;
  if (Array.isArray(value)) {
    throw new AppError(HttpStatus.BAD_REQUEST, `${fieldName} must be an integer`);
  }

  const parsedValue = Number(value);
  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1 ||
    (maxValue !== undefined && parsedValue > maxValue)
  ) {
    const rangeMessage = maxValue ? ` between 1 and ${maxValue}` : ' greater than 0';
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `${fieldName} must be an integer${rangeMessage}`
    );
  }

  return parsedValue;
};

export const parsePagination = (
  query: { page?: unknown; limit?: unknown },
  defaultLimit: number,
  maxLimit: number
) => ({
  page: parsePositiveInteger(query.page, 'page', 1),
  limit: parsePositiveInteger(query.limit, 'limit', defaultLimit, maxLimit)
});
