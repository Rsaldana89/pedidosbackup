# Pedido Backup

Sistema web simple para subir archivos Excel de pedidos cuando falle la sincronización entre sistemas.

## Qué cambió en esta versión

- Las sucursales ya no están hardcodeadas en el frontend.
- Ahora existe una tabla `sucursales` en MySQL.
- El formulario público carga el combo de sucursales desde la base de datos.
- El admin puede ver, agregar, activar y desactivar sucursales.
- Los uploads guardan el `sucursal_codigo` y se relacionan con `sucursales`.
- Se agregó un indicador visual de qué sucursales ya subieron archivo hoy.

## Requisitos

- Node.js 18 o superior
- MySQL

## Instalación local

1. Crear la base de datos, por ejemplo:

```sql
CREATE DATABASE pedido_backup;
```

2. Copiar `.env.example` a `.env` y ajustar credenciales:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=pedido_backup
SESSION_SECRET=un_secreto_seguro
```

3. Ejecutar el script SQL:

```sql
USE pedido_backup;
SOURCE database.sql;
```

4. Instalar dependencias:

```bash
npm install
```

5. Ejecutar proyecto:

```bash
npm run dev
```

O en modo normal:

```bash
npm start
```

## Credenciales admin por defecto

- Usuario: `admin`
- Password: `admin123`

## Endpoints principales

### Público
- `GET /api/sucursales`
- `GET /api/sucursales-status`
- `POST /api/upload`

### Admin
- `POST /api/login`
- `POST /api/logout`
- `GET /api/uploads?date=YYYY-MM-DD`
- `GET /api/download/:id`
- `GET /api/download-all?date=YYYY-MM-DD`
- `GET /api/admin/sucursales`
- `POST /api/admin/sucursales`
- `PATCH /api/admin/sucursales/:id/status`

## Railway

- Railway usa la variable `PORT`, ya soportada por el proyecto.
- Debes configurar `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `SESSION_SECRET`.
- La carpeta `backend/uploads` guarda archivos localmente. En Railway esto puede no ser persistente si reinicia la instancia. Para persistencia real conviene usar almacenamiento externo.

## Notas

- Las contraseñas siguen en texto plano porque así lo pediste inicialmente. En producción real conviene usar hash.
- El script `database.sql` ya carga tus sucursales iniciales.


## Nota para actualizaciones

Si ya tenías una base creada con la versión anterior del proyecto y ves errores en rutas nuevas (por ejemplo estado de sucursales o cargas), ejecuta `reset_database.sql` en una base de pruebas o recrea la base desde cero. Ese archivo elimina las tablas actuales y vuelve a crear la estructura correcta.


## Cambios recientes

- El sistema ahora intenta **ajustar automáticamente la base de datos** al arrancar si vienes de una versión anterior.
- Si quieres una guía visual junto al campo de archivo, reemplaza `frontend/assets/imagen.png` por tu propia imagen.
- También se incluye `upgrade_legacy.sql` por si prefieres actualizar la base manualmente.
