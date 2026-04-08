-- Migration Nivel 9: Planner Horario Granular y Estados de Tareas
-- Adds hourly scheduling and duration to tasks for fine-grained planning.

-- 1. Añadir campos hora_inicio y duracion_minutos
ALTER TABLE Tareas
ADD COLUMN hora_inicio TIME DEFAULT '10:00:00' AFTER bloque_horario,
ADD COLUMN duracion_minutos INT DEFAULT 60 AFTER hora_inicio;
