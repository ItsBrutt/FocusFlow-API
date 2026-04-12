<?php

namespace App\Models;

use PDO;
use App\Config\Database;

class Mes {
    private PDO $conn;
    private string $table_name = "Objetivos_Mensuales";

    public int $id;
    public int $objetivo_anual_id;
    public int $mes;
    public string $titulo;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Crea un nuevo mes planificado
     */
    public function create(): bool {
        // Verificar si el mes ya existe para ese objetivo
        $queryCheck = "SELECT id FROM " . $this->table_name . " WHERE objetivo_anual_id = :objetivo_anual_id AND mes = :mes LIMIT 1";
        $stmtCheck = $this->conn->prepare($queryCheck);
        $stmtCheck->bindParam(':objetivo_anual_id', $this->objetivo_anual_id, PDO::PARAM_INT);
        $stmtCheck->bindParam(':mes', $this->mes, PDO::PARAM_INT);
        $stmtCheck->execute();
        
        if ($stmtCheck->rowCount() > 0) {
            return false; // Mes ya asignado
        }

        $query = "INSERT INTO " . $this->table_name . " (objetivo_anual_id, mes, titulo) VALUES (:objetivo_anual_id, :mes, :titulo) RETURNING id";
        
        $stmt = $this->conn->prepare($query);

        // Limpiar
        $this->titulo = htmlspecialchars(strip_tags($this->titulo));
        
        // Bind parameters
        $stmt->bindParam(':objetivo_anual_id', $this->objetivo_anual_id, PDO::PARAM_INT);
        $stmt->bindParam(':mes', $this->mes, PDO::PARAM_INT);
        $stmt->bindParam(':titulo', $this->titulo, PDO::PARAM_STR);

        if ($stmt->execute()) {
            $this->id = (int)$stmt->fetchColumn();
            return true;
        }

        return false;
    }
}
