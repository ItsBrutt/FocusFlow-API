-- Migration Nivel 8: Planner Semanal Unificado
-- Run in your MySQL client:

-- 1. Bloques horarios en tareas (4 bloques de 6h = 24h)
ALTER TABLE Tareas
ADD COLUMN bloque_horario ENUM('Madrugada','Mañana','Tarde','Noche')
DEFAULT 'Mañana' AFTER categoria;

-- 2. Color de identificación visual por objetivo anual
ALTER TABLE Objetivos_Anuales
ADD COLUMN color VARCHAR(7) DEFAULT '#0d6efd' AFTER titulo;
