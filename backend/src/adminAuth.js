import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'allmart_super_secret';

// Usuarios del panel de administración
// Contraseñas: admin → 'admin', editor → 'editor123'
const USERS = [
  {
    user: process.env.ADMIN_USER || 'admin',
    hash: process.env.ADMIN_HASH || '$2b$10$zLj./2iqsqnoBqxpT92mVOwUtayNkYy6tL8in443IuB82L905yOau',
    role: 'admin',
  },
  {
    user: process.env.EDITOR_USER || 'editor',
    hash: process.env.EDITOR_HASH || '$2b$10$mt.YMa6mFiMmnnxRettsAO/brFQfx1rJQBWFN.HePpYNYtoj7ZRhu',
    role: 'editor',
  },
];

router.post('/login', async (req, res) => {
  const { user, password } = req.body;
  if (!user || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  const found = USERS.find(u => u.user === user);
  if (!found) {
    return res.status(401).json({ message: 'Usuario inválido' });
  }

  const valid = await bcrypt.compare(password, found.hash);
  if (!valid) {
    return res.status(401).json({ message: 'Contraseña incorrecta' });
  }

  const token = jwt.sign({ user: found.user, role: found.role }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, role: found.role });
});

export default router;
