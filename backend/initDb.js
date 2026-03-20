const db = require('./db');
const branches = require('./data/branches');

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function tableExists(name) {
  const [rows] = await db.execute('SHOW TABLES LIKE ?', [name]);
  return rows.length > 0;
}

async function getColumns(tableName) {
  const [rows] = await db.execute(`SHOW COLUMNS FROM ${tableName}`);
  return rows.map((row) => row.Field);
}

async function ensureBaseTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sucursales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigo VARCHAR(10) NOT NULL UNIQUE,
      nombre VARCHAR(255) NOT NULL,
      activo TINYINT(1) NOT NULL DEFAULT 1
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS uploads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sucursal_codigo VARCHAR(10) NULL,
      filename_original VARCHAR(255) NULL,
      filename VARCHAR(255) NOT NULL,
      filepath VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await getColumns(tableName);
  if (!columns.includes(columnName)) {
    await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function seedAdminUser() {
  const [rows] = await db.execute('SELECT id FROM users WHERE username = ? LIMIT 1', ['admin']);
  if (rows.length === 0) {
    await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', 'admin123', 'admin']);
  }
}

async function seedBranchesIfEmpty() {
  const [rows] = await db.execute('SELECT COUNT(*) AS total FROM sucursales');
  if (Number(rows[0].total || 0) > 0) {
    return;
  }

  for (const branch of branches) {
    await db.execute(
      'INSERT INTO sucursales (codigo, nombre, activo) VALUES (?, ?, ?)',
      [branch.codigo, branch.nombre, branch.activo]
    );
  }
}

async function backfillLegacyUploads() {
  const columns = await getColumns('uploads');
  const hasLegacySucursal = columns.includes('sucursal');

  await db.execute(`UPDATE uploads SET filename_original = filename WHERE filename_original IS NULL OR filename_original = ''`);

  if (!hasLegacySucursal) {
    return;
  }

  const [branchRows] = await db.execute('SELECT codigo, nombre FROM sucursales');
  const byCode = new Map(branchRows.map((row) => [String(row.codigo), row.codigo]));
  const byName = new Map(branchRows.map((row) => [normalizeText(row.nombre), row.codigo]));

  const [uploads] = await db.execute(
    `SELECT id, sucursal
     FROM uploads
     WHERE sucursal_codigo IS NULL OR sucursal_codigo = ''`
  );

  for (const upload of uploads) {
    const raw = String(upload.sucursal || '').trim();
    if (!raw) continue;

    let codigo = null;
    const match = raw.match(/(\d{1,3})/);
    if (match) {
      const padded = match[1].padStart(3, '0');
      codigo = byCode.get(padded) || padded;
    }

    if (!codigo) {
      codigo = byName.get(normalizeText(raw)) || null;
    }

    if (codigo) {
      await db.execute('UPDATE uploads SET sucursal_codigo = ? WHERE id = ?', [codigo, upload.id]);
    }
  }
}

async function ensureForeignKeyIfPossible() {
  const [missing] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM uploads
     WHERE sucursal_codigo IS NULL OR sucursal_codigo = ''`
  );

  if (Number(missing[0].total || 0) > 0) {
    return;
  }

  const [indexes] = await db.execute(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'uploads'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`
  );

  if (indexes.length === 0) {
    try {
      await db.execute(
        'ALTER TABLE uploads ADD CONSTRAINT fk_uploads_sucursal FOREIGN KEY (sucursal_codigo) REFERENCES sucursales(codigo)'
      );
    } catch (error) {
      console.warn('No se pudo crear la llave foránea de uploads:', error.message);
    }
  }
}

async function initDatabase() {
  await ensureBaseTables();
  await ensureColumn('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await ensureColumn('sucursales', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await ensureColumn('uploads', 'sucursal_codigo', 'VARCHAR(10) NULL');
  await ensureColumn('uploads', 'filename_original', 'VARCHAR(255) NULL');
  await ensureColumn('uploads', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await seedAdminUser();
  await seedBranchesIfEmpty();
  await backfillLegacyUploads();
  await ensureForeignKeyIfPossible();
}

module.exports = initDatabase;
