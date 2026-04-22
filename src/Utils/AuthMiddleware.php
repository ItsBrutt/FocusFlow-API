<?php

namespace App\Utils;

use App\Utils\JwtHandler;
use App\Utils\Response;
use App\Config\Database;

class AuthMiddleware {
    
    // Almacena estáticamente la sesión decodificada a nivel global de la consulta
    private static ?array $currentPayload = null;

    /**
     * Valida la existencia y firma del Token en los Headers de la peticion HTTP actual.
     * Si falla, corta el hilo y lanza un Error 401. 
     */
    public static function validateToken() {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : getallheaders();
        
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$authHeader) {
            Response::json(401, "Acceso denegado. Se requiere Token en header Authorization.");
        }

        // El formato deberia ser "Bearer <token_jwt>"
        $parts = explode(" ", $authHeader);
        if (count($parts) !== 2 || strcasecmp($parts[0], 'Bearer') !== 0) {
            Response::json(401, "El formato del token es invalido. Usa: Bearer <token>");
        }

        $token = $parts[1];

        $jwtHandler = new JwtHandler();
        $payload = $jwtHandler->validateToken($token);

        if (!$payload) {
            Response::json(401, "Token de acceso expirado o adulterado.");
        }

        // Si pasó todas las pruebas, registrar esta sesión en memoria volátil de PHP
        self::$currentPayload = (array) $payload;

        // Inyectar el ID del usuario en la conexión de Base de Datos para RLS
        Database::getInstance()->setDbUser(self::$currentPayload['id']);
    }

    /**
     * Obtiene el Payload abstraído globalmente por el Middleware si éste ya fue validado en el Router.
     */
    public static function getPayload(): array {
        if (self::$currentPayload === null) {
            Response::json(401, "El Payload fue solicitado, pero el usuario no ha pasado por el Middleware.");
        }
        return self::$currentPayload;
    }
}
