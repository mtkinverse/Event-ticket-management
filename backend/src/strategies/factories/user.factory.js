import { v4 as uuidv4 } from 'uuid';
import { hash } from '../../utils/hashing.js';

export const createUser = async ({ name, email, password, role = 'customer', phone = null }) => ({
  id:           uuidv4(),
  name,
  email,
  passwordHash: await hash(password),
  role,
  phone,
});
