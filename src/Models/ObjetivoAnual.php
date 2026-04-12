<?php

namespace App\Models;

use PDO;
use App\Config\Database;

class ObjetivoAnual {
    private PDO $conn;
    private string $table_name = "Objetivos_Anuales";

    public int $id;
    public int $usuario_id;
    public int $anio;
    public string $titulo;
    public string $descripcion;
    public bool $completado;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Crea un nuevo objetivo anual para un usuario
     */
    public function create(): bool {
        $query = "INSERT INTO " . $this->table_name . " (usuario_id, anio, titulo, descripcion) VALUES (:usuario_id, :anio, :titulo, :descripcion) RETURNING id";
        
        $stmt = $this->conn->prepare($query);

        // Limpiar
        $this->titulo = htmlspecialchars(strip_tags($this->titulo));
        $this->descripcion = htmlspecialchars(strip_tags($this->descripcion));
        
        // Bind parameters
        $stmt->bindParam(':usuario_id', $this->usuario_id, PDO::PARAM_INT);
        $stmt->bindParam(':anio', $this->anio, PDO::PARAM_INT);
        $stmt->bindParam(':titulo', $this->titulo, PDO::PARAM_STR);
        $stmt->bindParam(':descripcion', $this->descripcion, PDO::PARAM_STR);

        if ($stmt->execute()) {
            $this->id = (int)$stmt->fetchColumn();
            return true;
        }

        return false;
    }

    /**
     * Recupera un único objetivo anual y sus meses, verificando propiedad (IDOR protection)
     */
    public function getOne(int $id, int $usuario_id): ?array {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id AND usuario_id = :usuario_id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
        $stmt->execute();
        
        $objetivo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$objetivo) {
            return null; // No encontrado o no es propietario
        }

        // Buscar meses asociados
        $queryMeses = "SELECT id, mes, titulo, progreso_total FROM Objetivos_Mensuales WHERE objetivo_anual_id = :objetivo_id ORDER BY mes ASC";
        $stmtMeses = $this->conn->prepare($queryMeses);
        $stmtMeses->bindParam(':objetivo_id', $id, PDO::PARAM_INT);
        $stmtMeses->execute();

        $meses = $stmtMeses->fetchAll(PDO::FETCH_ASSOC);
        $objetivo['meses'] = $meses;

        // Bottom-Up logic: Calculate annual progression AVG()
        $totalProgreso = 0;
        foreach ($meses as $mes) {
            $totalProgreso += $mes['progreso_total'];
        }
        $objetivo['progreso_total'] = count($meses) > 0 ? round($totalProgreso / count($meses), 2) : 0;

        return $objetivo;
    }
}
