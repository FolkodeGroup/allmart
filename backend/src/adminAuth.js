import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_HASH = process.env.ADMIN_HASH || '$2b$10$zLj./2iqsqnoBqxpT92mVOwUtayNkYy6tL8in443IuB82L905yOau';
const JWT_SECRET = process.env.JWT_SECRET || 'allmart_super_secret';

router.post('/login', async (req, res) => {
  const { user, password } = req.body;
  if (!user || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }
  if (user !== ADMIN_USER) {
    return res.status(401).json({ message: 'Usuario inválido' });
  }
  const valid = await bcrypt.compare(password, ADMIN_HASH);
  if (!valid) {
    return res.status(401).json({ message: 'Contraseña incorrecta' });
  }
  const token = jwt.sign({ user, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

export default router;
