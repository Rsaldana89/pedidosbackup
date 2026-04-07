const express = require('express');
const db = require('../db');

const router = express.Router();

/*
 * Ruta de inicio de sesión. Recibe usuario y contraseña en el cuerpo
 * de la solicitud y comprueba si existen en la tabla users. Si las
 * credenciales son válidas, se almacena la información del usuario
 * en la sesión para proteger las rutas de administrador.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son obligatorios' });
    }
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const user = rows[0];
    req.session.userId = user.id;
    req.session.role = user.role;
    // In addition to the success message, return the user role so the frontend can
    // determine which sections of the admin panel to display. This avoids
    // additional requests just to discover the current user role.  Only
    // non-sensitive information (role) is returned here.
    res.json({ message: 'Inicio de sesión exitoso', role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el inicio de sesión' });
  }
});

/*
 * Ruta para cerrar sesión. Destruye la sesión actual y responde con
 * un mensaje de éxito.
 */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Sesión cerrada' });
  });
});

module.exports = router;