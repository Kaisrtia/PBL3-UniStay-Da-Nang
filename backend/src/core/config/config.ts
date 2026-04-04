import * as dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

dotenv.config({
  path: path.resolve(__dirname, '../../../.env')
});

const envSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test')
      .required()
      .default('development'),
    SERVER_PORT: Joi.number().required().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    ACCESS_TOKEN_TTL: Joi.number().required(),
    REFRESH_TOKEN_TTL: Joi.number().required(),
    EMAIL_VERIFICATION_TTL: Joi.number().required(),
    EMAIL_USER: Joi.string().email().required(),
    EMAIL_PASSWORD: Joi.string().required(),
    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required()
  })
  .unknown();

const { value: validatedEnv, error } = envSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env, { abortEarly: false, stripUnknown: true });

if (error) {
  throw new Error(
    `Environment variable validation error: \n${error.details
      .map((detail) => detail.message)
      .join('\n')}`
  );
}

const config = {
  node_env: validatedEnv.NODE_ENV,
  server: {
    port: validatedEnv.SERVER_PORT
  },
  db: {
    url: validatedEnv.DATABASE_URL
  },
  jwt: {
    secret: validatedEnv.JWT_SECRET,
    access_token_ttl: validatedEnv.ACCESS_TOKEN_TTL,
    refresh_token_ttl: validatedEnv.REFRESH_TOKEN_TTL
  },
  email: {
    user: validatedEnv.EMAIL_USER,
    password: validatedEnv.EMAIL_PASSWORD,
    verification_ttl: validatedEnv.EMAIL_VERIFICATION_TTL
  },
  google: {
    client_id: validatedEnv.GOOGLE_CLIENT_ID,
    client_secret: validatedEnv.GOOGLE_CLIENT_SECRET
  }
} as const;

export default config;
