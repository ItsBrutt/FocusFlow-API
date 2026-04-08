<?php

namespace App\Config;

use PDO;
use PDOException;

class Database {
    private static ?Database $instance = null;
    private ?PDO $conn = null;

    // Configuración usando variables de entorno o valores por defecto
    private string $host;
    private string $db_name;
    private string $username;
    private string $password; 
    private string $charset = 'utf8mb4';

    private function __construct() {
        $this->host = getenv('DB_HOST');
        $this->db_name = getenv('DB_NAME');
        $this->username = getenv('DB_USER');
        $this->password = getenv('DB_PASS');
        $port = getenv('DB_PORT') ?: '6543';

        $dsn = "pgsql:host={$this->host};port={$port};dbname={$this->db_name};sslmode=require";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            // Enviar error detallado a los logs de Vercel
            error_log("Fallo de conexión PDO: " . $e->getMessage());
            
            header('HTTP/1.1 500 Internal Server Error');
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                "success" => false, 
                "message" => "Error de conexion a la base de datos", 
                "details" => $e->getMessage() // Esto nos dirá si es pass incorrecto o SSL
            ]);
            exit;
        }
    }

    // Evitar clonación del Singleton
    private function __clone() {}

    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection(): PDO {
        return $this->conn;
    }
}
