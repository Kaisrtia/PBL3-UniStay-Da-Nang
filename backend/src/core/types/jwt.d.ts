import * as jwt from 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id: string;
    roles: string[];
  }
}
