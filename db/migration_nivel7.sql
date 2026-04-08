-- Migration: Add titulo column to Planner_Semanal for intentional week naming
-- Run this manually in your MySQL client:

ALTER TABLE Planner_Semanal 
ADD COLUMN titulo VARCHAR(255) NULL AFTER numero_semana;
