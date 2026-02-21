import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'allmart_super_secret';
const VALID_ROLES = ['admin', 'editor'];

export default function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!VALID_ROLES.includes(decoded.role)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}
