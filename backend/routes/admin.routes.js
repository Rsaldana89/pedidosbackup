const express = require('express');
const archiver = require('archiver');
const db = require('../db');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

function sanitizeText(value, maxLength = 255) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function sanitizeCode(value) {
  return String(value || '').trim().replace(/[^0-9]/g, '').slice(0, 10);
}

router.get('/uploads', isAuthenticated, async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT
        u.id,
        u.sucursal_codigo,
        s.nombre AS sucursal_nombre,
        u.filename,
        COALESCE(NULLIF(u.filename_original, ''), u.filename) AS filename_original,
        u.created_at
      FROM uploads u
      LEFT JOIN sucursales s ON s.codigo = u.sucursal_codigo
    `;
    const params = [];

    if (date) {
      query += ' WHERE DATE(u.created_at) = ?';
      params.push(date);
    }

    query += ' ORDER BY u.created_at DESC';
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la lista de archivos' });
  }
});

router.get('/admin/dashboard', isAuthenticated, async (req, res) => {
  try {
    const rawDate = String(req.query.date || '').trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date().toISOString().split('T')[0];

    const [statusRows] = await db.execute(
      `SELECT
         s.codigo,
         s.nombre,
         COUNT(u.id) AS total_archivos,
         CASE WHEN COUNT(u.id) > 0 THEN 1 ELSE 0 END AS subio_hoy
       FROM sucursales s
       LEFT JOIN uploads u
         ON u.sucursal_codigo = s.codigo
        AND DATE(u.created_at) = ?
       WHERE s.activo = 1
       GROUP BY s.codigo, s.nombre
       ORDER BY s.codigo ASC`,
      [date]
    );

    const totalUploads = statusRows.reduce((acc, row) => acc + Number(row.total_archivos || 0), 0);
    const activeBranches = statusRows.length;
    const branchesLoaded = statusRows.filter((row) => Number(row.subio_hoy) === 1).length;
    const branchesPending = activeBranches - branchesLoaded;

    res.json({
      date,
      stats: {
        totalUploads,
        activeBranches,
        branchesLoaded,
        branchesPending
      },
      statuses: statusRows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el resumen del panel' });
  }
});

router.get('/admin/sucursales', isAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, codigo, nombre, activo FROM sucursales ORDER BY codigo ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las sucursales' });
  }
});

router.post('/admin/sucursales', isAdmin, async (req, res) => {
  try {
    const codigo = sanitizeCode(req.body.codigo);
    const nombre = sanitizeText(req.body.nombre);
    const activo = String(req.body.activo) === '0' ? 0 : 1;

    if (!codigo || !nombre) {
      return res.status(400).json({ message: 'Código y nombre son obligatorios' });
    }

    const [existing] = await db.execute(
      'SELECT id FROM sucursales WHERE codigo = ? LIMIT 1',
      [codigo]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ya existe una sucursal con ese código' });
    }

    await db.execute(
      'INSERT INTO sucursales (codigo, nombre, activo) VALUES (?, ?, ?)',
      [codigo, nombre, activo]
    );

    res.status(201).json({ message: 'Sucursal agregada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar la sucursal' });
  }
});

router.patch('/admin/sucursales/:id/status', isAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const activo = String(req.body.activo) === '0' ? 0 : 1;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const [result] = await db.execute('UPDATE sucursales SET activo = ? WHERE id = ?', [activo, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }

    res.json({ message: 'Estado de sucursal actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la sucursal' });
  }
});

router.get('/download/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM uploads WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }
    const fileRecord = rows[0];
    res.download(fileRecord.filepath, fileRecord.filename_original || fileRecord.filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al descargar el archivo' });
  }
});

router.get('/download-all', isAuthenticated, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'El parámetro date es obligatorio' });
    }

    const [rows] = await db.execute(
      `SELECT
         u.*,
         s.nombre AS sucursal_nombre
       FROM uploads u
       LEFT JOIN sucursales s ON s.codigo = u.sucursal_codigo
       WHERE DATE(u.created_at) = ?
       ORDER BY COALESCE(u.sucursal_codigo, ''), u.created_at ASC`,
      [date]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No hay archivos para esa fecha' });
    }

    const zipName = `archivos_${date}.zip`;
    res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('warning', (err) => {
      console.warn(err);
    });
    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    rows.forEach((record) => {
      const folderName = record.sucursal_codigo && record.sucursal_nombre
        ? `${record.sucursal_codigo}-${record.sucursal_nombre}`
        : 'sin-sucursal';

      archive.file(record.filepath, {
        name: `${folderName}/${record.filename_original || record.filename}`
      });
    });

    archive.finalize();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el ZIP' });
  }
});

module.exports = router;
