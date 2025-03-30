import bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds: number = 10;
  const hashedPassword: string = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

export const checkPassword = async (inputPassword: string, storedHash: string): Promise<boolean> => {
  return await bcrypt.compare(inputPassword, storedHash);
};
