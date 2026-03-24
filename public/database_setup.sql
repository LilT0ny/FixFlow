-- SQL Setup for sistema_reparaciones
-- Compatible with TypeScript interfaces in src/types/index.ts

DROP DATABASE IF EXISTS sistema_reparaciones;
CREATE DATABASE sistema_reparaciones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_reparaciones;

-- Table: Clientes (CustomerData)
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table: Dispositivos (DeviceData)
CREATE TABLE dispositivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    imei_sn VARCHAR(100) NOT NULL,
    tipo_dispositivo ENUM('celular', 'impresora', 'tablet', 'laptop', 'otro', '') DEFAULT 'celular',
    estado_fisico TEXT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table: Ordenes de Servicio (ServiceOrder)
CREATE TABLE ordenes_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_orden VARCHAR(50) NOT NULL UNIQUE,
    id_dispositivo INT NOT NULL,
    falla_reportada TEXT NOT NULL,
    costo_total_reparacion DECIMAL(10, 2) DEFAULT 0.00,
    abono_inicial DECIMAL(10, 2) DEFAULT 0.00,
    precio_final DECIMAL(10, 2) DEFAULT 0.00,
    estado ENUM('recibido', 'diagnostico', 'esperando_repuestos', 'listo', 'entregado') DEFAULT 'recibido',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eliminado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_dispositivo) REFERENCES dispositivos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table: Fotos de Evidencia (EvidencePhoto)
CREATE TABLE fotos_evidencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    etapa ENUM('antes', 'durante', 'despues') NOT NULL,
    url_foto TEXT NOT NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes_servicio(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table: Transacciones (PaymentTransaction)
CREATE TABLE transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    monto DECIMAL(10, 2) NOT NULL,
    metodo ENUM('efectivo', 'transferencia') NOT NULL,
    tipo EN 'reparacion', 'repuestos', 'arriendo', 'servicios', 'insumos', 'otro') NOT NULL,
    tipo_transaccion ENUM('ingreso', 'egreso') NOT NULL,
    descripcion TEXT,
    id_orden INT NULL,
    numero_venta VARCHAR(50) NULL,
    FOREIGN KEY (id_orden) REFERENCES ordenes_servicio(id) ON DELETE SET NULL
) ENGINE=InnoDB;
