import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import HttpStatus from 'http-status';
import { AppError } from '../exceptions/AppError';

export const validate =
  (schema: {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
  }) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          `Body Validation Error: ${error.details.map((x) => x.message).join(', ')}`
        );
      }
      req.body = value;
    }

    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          `Query Validation Error: ${error.details.map((x) => x.message).join(', ')}`
        );
      }
      req.query = value;
    }

    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });
      if (error) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          `Params Validation Error: ${error.details.map((x) => x.message).join(', ')}`
        );
      }
      req.params = value;
    }

    next();
  };
