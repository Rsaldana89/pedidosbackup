/*
 * Middleware para comprobar si el usuario tiene una sesión válida.
 * Cualquier usuario autenticado (admin o manager) puede entrar al panel.
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: 'No autorizado' });
}

/*
 * Middleware exclusivo para administradores.
 * Se usa en las rutas de alta y mantenimiento de sucursales.
 */
function isAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Solo administrador' });
}

module.exports = { isAuthenticated, isAdmin };
