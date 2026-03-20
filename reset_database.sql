-- Usa este script si vienes de una versión anterior del proyecto y quieres
-- reconstruir la estructura completa desde cero.
-- ADVERTENCIA: elimina las tablas actuales y sus datos.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS uploads;
DROP TABLE IF EXISTS sucursales;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- Base de datos mínima para respaldo de pedidos
-- Crea tablas de usuarios, sucursales y cargas de archivos.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sucursales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sucursal_codigo VARCHAR(10) NOT NULL,
  filename_original VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_uploads_sucursal FOREIGN KEY (sucursal_codigo) REFERENCES sucursales(codigo)
);

INSERT INTO users (username, password, role)
SELECT 'admin', 'admin123', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin'
);

INSERT INTO sucursales (codigo, nombre, activo) VALUES
('001','Abastos',1),
('002','Satélite',1),
('003','Carrillo',1),
('005','Presidentes',1),
('006','San Roque',1),
('008','Sauces',1),
('009','Plazas Del Sol',1),
('011','L. Del Marques',1),
('012','Pie De La Cuesta',1),
('014','Cerrito Colorado',1),
('015','Paseo San Miguel',1),
('016','Andadores',1),
('017','Reforma Agraria',1),
('018','Tejeda',1),
('019','Satélite II',1),
('020','Ensueño',1),
('021','Candiles',1),
('022','Tintero',1),
('023','Cerrito Colorado II',1),
('024','Tejeda II',1),
('025','Pie De La Cuesta II',1),
('026','La Pradera II',1),
('027','San Juan De Letran',1),
('028','Loarca',1),
('029','La Pradera I',1),
('030','San Miguel De Allende',1),
('031','Cerrito Colorado III',1),
('032','San Pablo',1),
('033','Irapuato',1),
('034','Hacienda La Cruz',1),
('035','Campo Militar',1),
('036','Miranda',1),
('038','El Mirador',1),
('039','Insurgentes',1),
('040','Paseos Del Pedregal',1),
('041','Juriquilla',1),
('042','Real De La Loma',1),
('043','Av. De La Luz',1),
('044','Viñedos',1),
('045','Santa Maria',1),
('046','Tintero II',1),
('047','El Refugio',1),
('048','Villas De Santiago',1),
('049','Prol Pasteur',1),
('050','Ciudad del Sol',1),
('051','Milenio III',1),
('052','Sonterra',1),
('053','Valle Diamante',1),
('054','Vista Real',1),
('056','Valle de Santiago',1),
('057','Sauces II',1),
('058','Los Heroes',1),
('059','Rincones del Marqués',1),
('060','Puerta Verona',1),
('061','Palmares',1),
('062','Real Solare',1),
('063','Ciudad del Sol II',1),
('064','Santuario',1),
('065','San Miguel de Allende II',1),
('066','Los Olvera',1),
('067','Real del Bosque',1),
('068','Alcanfores',1),
('069','San Isidro',1),
('070','Atelier',1),
('071','Tecnologico',1),
('072','Candiles II',1),
('073','Refugio II',1),
('074','Jacal',1),
('075','Jardines de la Hacienda',1),
('077','El Sol',1),
('078','Plaza Candiles',1),
('079','Los Huertos',1),
('080','Cimatario',1),
('081','Platon',1),
('082','Piramides',1),
('083','Zibata',1),
('085','Zakia',1),
('086','Puerta Navarra',1),
('087','Pedro Escobedo',1),
('088','Geo Plazas',1),
('089','Candiles III',1),
('090','Pedro Escobedo II',1),
('091','Plaza Belen',1),
('092','Fuentes de Balvanera',1),
('093','Refugio III',1),
('094','La Gloria',1),
('102','San Miguel de Allende III',1),
('103','San Juan del Rio',1),
('104','El Pueblito',1),
('105','Sombrerete',1),
('106','Plaza Naciones',1),
('107','Lomas Calle 27',1),
('108','Niños Heroes',1),
('109','La Negreta',1),
('110','Villas del Refugio',1),
('111','Loma Bonita',1),
('112','Menchaca',1),
('113','Plaza Garibaldi SMA',1),
('114','Xentric Zibata',1),
('115','Burocrata',1),
('116','Milenio #100',1),
('117','Tequisquiapan Centro',1),
('118','Lomas Calle 25',1),
('119','Privada Juriquilla',1),
('120','Colinas del Sol',1),
('121','La Popular',1),
('122','Santa Fe',1),
('123','Colonia Cimatario',1),
('124','Plaza el Roble SJR',1),
('125','Av. Corregidora Nte',1),
('126','El Condado',1),
('127','El Rocio',1),
('128','Pueblo de Jurica',1),
('129','Zakia Zizana',1),
('130','Ejido San Miguel',1),
('131','Marques Queretano',1),
('132','Loarca II',1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo);
