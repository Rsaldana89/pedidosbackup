/*
 * Middleware simple para comprobar si el usuario está autenticado y
 * tiene rol de administrador. Si la sesión contiene el userId y el
 * rol es 'admin', se continúa con la siguiente función; de lo
 * contrario, se devuelve un error 401 Unauthorized. Esto se utiliza
 * para proteger las rutas de administración.
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    return next();
  }
  return res.status(401).json({ message: 'No autorizado' });
}

module.exports = { isAuthenticated };