<?php

namespace App\Utils;

class Response {
    
    /**
     * Envia una respuesta JSON y finaliza la ejecucion (opcional).
     *
     * @param int $statusCode El codigo de estado HTTP (ej. 200, 400).
     * @param string $message Mensaje principal de la respuesta.
     * @param mixed $data Datos adjuntos (arrays, diccionarios, objetos).
     * @param bool $exit Detener la ejecución del script tras responder.
     */
    public static function json(int $statusCode, string $message, $data = null, bool $exit = true) {
        http_response_code($statusCode);
        
        $response = [
            "success" => ($statusCode >= 200 && $statusCode < 300),
            "message" => $message
        ];

        // Añadir contexto extra (errores de validacion, o payload del dashboard)
        if ($data !== null) {
            $response["data"] = $data;
        }

        echo json_encode($response);
        
        if ($exit) {
            exit;
        }
    }
}
