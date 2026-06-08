export const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const strongPasswordMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';

export const isStrongPassword = (password: string) =>
  strongPasswordRegex.test(password);
