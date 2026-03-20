const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.xls', '.xlsx'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos Excel (.xls, .xlsx)'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

function sanitizeCode(value) {
  return String(value || '').trim().replace(/[^0-9]/g, '').slice(0, 10);
}

router.get('/sucursales', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT codigo, nombre FROM sucursales WHERE activo = 1 ORDER BY codigo ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las sucursales' });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const sucursalCodigo = sanitizeCode(req.body.sucursal);
    if (!sucursalCodigo) {
      return res.status(400).json({ message: 'La sucursal es obligatoria' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    const [branchRows] = await db.execute(
      'SELECT codigo, nombre FROM sucursales WHERE codigo = ? AND activo = 1 LIMIT 1',
      [sucursalCodigo]
    );

    if (branchRows.length === 0) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ message: 'La sucursal seleccionada no es válida' });
    }

    await db.execute(
      'INSERT INTO uploads (sucursal_codigo, filename_original, filename, filepath) VALUES (?, ?, ?, ?)',
      [sucursalCodigo, file.originalname, file.filename, file.path]
    );

    res.json({
      message: 'Archivo subido correctamente',
      sucursal: `${branchRows[0].codigo} - ${branchRows[0].nombre}`
    });
  } catch (error) {
    console.error(error);
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ message: 'Error al subir el archivo' });
  }
});

module.exports = router;
