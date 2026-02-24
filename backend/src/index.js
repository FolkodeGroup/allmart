import express from 'express';
import adminAuthMiddleware from './adminAuthMiddleware.js';
import adminCategoriesRoutes from './routes/admin/categories.ts';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.get('/', (req, res) => {
  res.send('Backend Allmart funcionando');
});

import adminAuth from './adminAuth.js';
app.use('/api/admin', adminAuth);

// Ejemplo de ruta protegida para admins
app.get('/api/admin/panel', adminAuthMiddleware, (req, res) => {
  res.json({ message: 'Bienvenido al panel de administración', user: req.admin.user });
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
