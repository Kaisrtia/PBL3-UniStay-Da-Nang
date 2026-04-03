import { nanoid } from "nanoid";

export const generateHybridId = (prefix: string) => {
  return prefix + nanoid();
}
