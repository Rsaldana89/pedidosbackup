const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const initDatabase = require('./initDb');
const db = require('./db'); // 👈 IMPORTANTE

const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

app.use('/', express.static(path.join(__dirname, '../frontend')));

app.use('/api', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', adminRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;

initDatabase()
  .then(async () => {
    try {
      // 🔥 AJUSTE DE ZONA HORARIA A MÉXICO
      await db.execute("SET time_zone = '-06:00'");
      console.log('🕒 Zona horaria MySQL configurada a México (-06:00)');
    } catch (err) {
      console.error('Error configurando zona horaria:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`Servidor iniciado en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo inicializar la base de datos:', error);
    process.exit(1);
  });