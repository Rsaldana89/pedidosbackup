const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Carga las variables de entorno desde el archivo .env
dotenv.config();

/*
 * Crea un pool de conexiones con MySQL.  El uso de un pool permite
 * reutilizar conexiones y mejora el rendimiento cuando hay múltiples
 * peticiones concurrentes.  La configuración se toma de las
 * variables de entorno definidas en .env.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;