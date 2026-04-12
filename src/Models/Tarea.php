<?php

namespace App\Models;

use PDO;
use App\Config\Database;

class Tarea {
    private PDO $conn;
    private string $table_name = "Tareas";

    public int $id;
    public string $estado; // 'Pendiente', 'En Progreso', 'Finalizado'

    public int $dia_id;
    public string $categoria;
    public string $descripcion;
    public string $bloque_horario = 'Mañana'; // Nivel 8
    public string $hora_inicio = '10:00:00';
    public int $duracion_minutos = 60;
    public int $prioridad_orden;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Verifica que el día pertenezca al usuario proporcionado para creación autorizada
     */
    public function isDayOwnedByUser(int $dia_id, int $usuario_id): bool {
        $query = "
            SELECT d.id 
            FROM Dias d
            JOIN Planner_Semanal ps ON d.planner_semanal_id = ps.id
            JOIN Objetivos_Mensuales om ON ps.objetivo_mensual_id = om.id
            JOIN Objetivos_Anuales oa ON om.objetivo_anual_id = oa.id
            WHERE d.id = :dia_id AND oa.usuario_id = :usuario_id
            LIMIT 1
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':dia_id', $dia_id, PDO::PARAM_INT);
        $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Verifica que la tarea pertenezca al usuario proporcionado haciendo un JOIN 
     * hasta la tabla Objetivos_Anuales
     */
    public function isOwnedByUser(int $tarea_id, int $usuario_id): bool {
        $query = "
            SELECT t.id 
            FROM Tareas t
            JOIN Dias d ON t.dia_id = d.id
            JOIN Planner_Semanal ps ON d.planner_semanal_id = ps.id
            JOIN Objetivos_Mensuales om ON ps.objetivo_mensual_id = om.id
            JOIN Objetivos_Anuales oa ON om.objetivo_anual_id = oa.id
            WHERE t.id = :tarea_id AND oa.usuario_id = :usuario_id
            LIMIT 1
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':tarea_id', $tarea_id, PDO::PARAM_INT);
        $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    public function create(): bool {
        $query = "INSERT INTO " . $this->table_name . "
            (dia_id, categoria, descripcion, bloque_horario, hora_inicio, duracion_minutos, prioridad_orden)
            VALUES (:dia_id, :categoria, :descripcion, :bloque_horario, :hora_inicio, :duracion_minutos, :prioridad_orden)
            RETURNING id";
        
        $stmt = $this->conn->prepare($query);
        
        $this->descripcion     = htmlspecialchars(strip_tags($this->descripcion));
        $this->categoria       = htmlspecialchars(strip_tags($this->categoria));
        $this->bloque_horario  = in_array($this->bloque_horario, ['Madrugada','Mañana','Tarde','Noche'])
            ? $this->bloque_horario : 'Mañana';
        $this->hora_inicio = htmlspecialchars(strip_tags($this->hora_inicio));

        $stmt->bindParam(':dia_id',         $this->dia_id,         PDO::PARAM_INT);
        $stmt->bindParam(':categoria',      $this->categoria,      PDO::PARAM_STR);
        $stmt->bindParam(':descripcion',    $this->descripcion,    PDO::PARAM_STR);
        $stmt->bindParam(':bloque_horario', $this->bloque_horario, PDO::PARAM_STR);
        $stmt->bindParam(':hora_inicio',    $this->hora_inicio,    PDO::PARAM_STR);
        $stmt->bindParam(':duracion_minutos',$this->duracion_minutos,PDO::PARAM_INT);
        $stmt->bindParam(':prioridad_orden',$this->prioridad_orden,PDO::PARAM_INT);

        if ($stmt->execute()) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = (int)($row['id'] ?? 0);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Actualiza unicamente el estado de la tarea (Lectura optima vs Escritura Atomica)
     */
    public function updateStatus(): bool {
        $query = "UPDATE " . $this->table_name . " SET estado = :estado WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);

        $this->estado = htmlspecialchars(strip_tags($this->estado));

        $stmt->bindParam(':estado', $this->estado, PDO::PARAM_STR);
        $stmt->bindParam(':id', $this->id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }
}
