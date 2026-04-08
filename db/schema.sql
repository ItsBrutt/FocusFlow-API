-- 1. Crear y usar la base de datos
CREATE DATABASE IF NOT EXISTS focus_flow_db;
USE focus_flow_db;

-- 2. Crear tabla USUARIOS
CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear tabla Objetivos_Anuales
CREATE TABLE Objetivos_Anuales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    anio INT NOT NULL,
    titulo VARCHAR(255) NOT NULL, -- Ej: "Conseguir empleo como desarrollador"
    descripcion TEXT,
    completado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- 4. Crear tabla Objetivos_Mensuales
CREATE TABLE Objetivos_Mensuales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    objetivo_anual_id INT NOT NULL,
    mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    titulo VARCHAR(255) NOT NULL,
    progreso_total DECIMAL(5,2) DEFAULT 0.00,
    FOREIGN KEY (objetivo_anual_id) REFERENCES Objetivos_Anuales(id) ON DELETE CASCADE
);

-- 5. Crear tabla Planner_Semanal
CREATE TABLE Planner_Semanal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    objetivo_mensual_id INT NOT NULL,
    numero_semana INT NOT NULL CHECK (numero_semana BETWEEN 1 AND 4),
    titulo VARCHAR(255) NULL, -- Ej: "Semana de Detox Total" (editable por el usuario)
    peso_mensual DECIMAL(5,2) DEFAULT 25.00,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    completada BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (objetivo_mensual_id) REFERENCES Objetivos_Mensuales(id) ON DELETE CASCADE
);

-- 6. Crear tabla DIAS
CREATE TABLE Dias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    planner_semanal_id INT NOT NULL,
    nombre_dia VARCHAR(20) NOT NULL, -- Ej: "Lunes"
    fecha_exacta DATE NOT NULL,
    peso_semanal DECIMAL(5,2) DEFAULT 20.00,
    bloqueado BOOLEAN DEFAULT TRUE, -- Por lógica de API, el Lunes debe insertarse como FALSE
    estado_mental VARCHAR(100), -- Ej: "Enfocado", "Distraído"
    reflexion_diaria TEXT,
    FOREIGN KEY (planner_semanal_id) REFERENCES Planner_Semanal(id) ON DELETE CASCADE
);

-- 7. Crear tabla Tareas
CREATE TABLE Tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dia_id INT NOT NULL,
    categoria ENUM('Backend', 'React', 'Entrenamiento', 'Meditacion') NOT NULL,
    descripcion VARCHAR(255) NOT NULL, -- Ej: "Completar 4 horas de estudio práctico"
    estado ENUM('Pendiente', 'En Progreso', 'Finalizado') DEFAULT 'Pendiente',
    prioridad_orden INT NOT NULL,
    FOREIGN KEY (dia_id) REFERENCES Dias(id) ON DELETE CASCADE
);
