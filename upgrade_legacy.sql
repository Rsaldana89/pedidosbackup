-- Ejecuta este script si vienes de una versión anterior del proyecto.
-- Convierte la estructura vieja a la nueva sin borrar los archivos ya registrados.

ALTER TABLE sucursales
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE uploads
  ADD COLUMN IF NOT EXISTS sucursal_codigo VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS filename_original VARCHAR(255) NULL;

UPDATE uploads
SET filename_original = filename
WHERE filename_original IS NULL OR filename_original = '';

-- Si antes guardabas algo como "018 - Tejeda" en uploads.sucursal,
-- el backend nuevo intentará convertirlo automáticamente al arrancar.
