<?php

namespace App\Models;

use PDO;
use App\Config\Database;

class Usuario {
    private PDO $conn;
    private string $table_name = "Usuarios";

    // Propiedades de la clase
    public int $id;
    public string $nombre;
    public string $email;
    public string $password_hash;
    public string $fecha_registro;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    /**
     * Busca un usuario por su email
     */
    public function getByEmail(string $email): array|false {
        $query = "SELECT id, nombre, email, password_hash, fecha_registro FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetch(); // Retorna array asociativo o false si no existe
    }

    /**
     * Crea un nuevo usuario
     */
    public function create(): bool {
        $query = "INSERT INTO " . $this->table_name . " (nombre, email, password_hash) VALUES (:nombre, :email, :password_hash)";
        
        $stmt = $this->conn->prepare($query);

        // Limpiar inputs
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        $this->email = htmlspecialchars(strip_tags($this->email));
        
        // En este punto $this->password_hash ya debería estar hasheado desde el controlador
        $stmt->bindParam(':nombre', $this->nombre, PDO::PARAM_STR);
        $stmt->bindParam(':email', $this->email, PDO::PARAM_STR);
        $stmt->bindParam(':password_hash', $this->password_hash, PDO::PARAM_STR);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Verifica que el email no esté en uso (método útil extra)
     */
    public function emailExists(string $email): bool {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
