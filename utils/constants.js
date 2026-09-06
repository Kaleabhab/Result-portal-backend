export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
};

export const DEFAULT_TEMP_PASSWORD_LENGTH = 10;

export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;