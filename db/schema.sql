-- 1. Usuarios
CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Objetivos_Anuales
CREATE TABLE Objetivos_Anuales (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    anio INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#0d6efd', -- Agregado en Migración Nivel 8
    descripcion TEXT,
    completado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- 3. Objetivos_Mensuales
CREATE TABLE Objetivos_Mensuales (
    id SERIAL PRIMARY KEY,
    objetivo_anual_id INT NOT NULL,
    mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    titulo VARCHAR(255) NOT NULL,
    progreso_total DECIMAL(5,2) DEFAULT 0.00,
    FOREIGN KEY (objetivo_anual_id) REFERENCES Objetivos_Anuales(id) ON DELETE CASCADE
);

-- 4. Planner_Semanal
CREATE TABLE Planner_Semanal (
    id SERIAL PRIMARY KEY,
    objetivo_mensual_id INT NOT NULL,
    numero_semana INT NOT NULL CHECK (numero_semana BETWEEN 1 AND 4),
    titulo VARCHAR(255) NULL, -- Agregado en Migración Nivel 7
    peso_mensual DECIMAL(5,2) DEFAULT 25.00,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    completada BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (objetivo_mensual_id) REFERENCES Objetivos_Mensuales(id) ON DELETE CASCADE
);

-- 5. Dias
CREATE TABLE Dias (
    id SERIAL PRIMARY KEY,
    planner_semanal_id INT NOT NULL,
    nombre_dia VARCHAR(20) NOT NULL, -- Ej: "Lunes"
    fecha_exacta DATE NOT NULL,
    peso_semanal DECIMAL(5,2) DEFAULT 20.00,
    bloqueado BOOLEAN DEFAULT TRUE,
    estado_mental VARCHAR(100),
    reflexion_diaria TEXT,
    FOREIGN KEY (planner_semanal_id) REFERENCES Planner_Semanal(id) ON DELETE CASCADE
);

-- 6. Tareas
CREATE TABLE Tareas (
    id SERIAL PRIMARY KEY,
    dia_id INT NOT NULL,
    categoria TEXT CHECK (categoria IN ('Backend', 'React', 'Entrenamiento', 'Meditacion')) NOT NULL,
    bloque_horario TEXT CHECK (bloque_horario IN ('Madrugada','Mañana','Tarde','Noche')) DEFAULT 'Mañana', -- Agregado en Migración Nivel 8
    hora_inicio TIME DEFAULT '10:00:00', -- Agregado en Migración Nivel 9
    duracion_minutos INT DEFAULT 60, -- Agregado en Migración Nivel 9
    descripcion VARCHAR(255) NOT NULL,
    estado TEXT CHECK (estado IN ('Pendiente', 'En Progreso', 'Finalizado')) DEFAULT 'Pendiente',
    prioridad_orden INT NOT NULL,
    FOREIGN KEY (dia_id) REFERENCES Dias(id) ON DELETE CASCADE
);
