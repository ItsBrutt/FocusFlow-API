<?php

namespace App\Utils;

use Throwable;
use ErrorException;
use App\Utils\Response;

class ErrorHandler {

    /**
     * Registra el sistema global de errores
     */
    public static function register() {
        // Convierte warnings/notices de PHP en Excepciones Atrapables
        set_error_handler([self::class, 'handleError']);
        
        // Atrapa Excepciones no procesadas (fatales, DB, etc.)
        set_exception_handler([self::class, 'handleException']);
    }

    public static function handleError(int $level, string $message, string $file, int $line): bool {
        if (error_reporting() !== 0) {
            throw new ErrorException($message, 0, $level, $file, $line);
        }
        return false;
    }

    public static function handleException(Throwable $e) {
        $logMessage = "[" . date('Y-m-d H:i:s') . "] ERROR: " . $e->getMessage() . 
                      " | Archivo: " . $e->getFile() . " (Linea: " . $e->getLine() . ")\n" . 
                      $e->getTraceAsString() . "\n" . str_repeat("-", 50) . "\n";
        
        // Registrar en logs privados 
        $logDir = __DIR__ . '/../../logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0777, true);
        }
        error_log($logMessage, 3, $logDir . '/error.log');

        // Respuesta segura y generica para el frontend (Sin exponer info)
        Response::json(500, "Internal Server Error. Consulte los logs de sistema.");
    }
}
