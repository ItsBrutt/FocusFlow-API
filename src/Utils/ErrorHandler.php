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
        
        // En Vercel (y entornos serverless) el filesystem es read-only.
        // Usamos error_log estándar (stderr) que Vercel captura en sus propios logs.
        error_log($logMessage);

        // TODO: Remover el detalle del mensaje antes de ir a producción final
        Response::json(500, "Error: " . $e->getMessage() . " en " . basename($e->getFile()) . ":" . $e->getLine());
    }
}
