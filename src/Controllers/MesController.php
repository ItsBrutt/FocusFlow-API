<?php

namespace App\Controllers;

use App\Utils\AuthMiddleware;
use App\Models\ObjetivoAnual;
use App\Models\Mes;
use App\Utils\Response;

class MesController {
    
    public function create($objetivo_id) {
        $payload = AuthMiddleware::getPayload();
        
        if (!is_numeric($objetivo_id)) {
            Response::json(400, "ID de objetivo invalido.");
        }

        // 1. Validar que el Objetivo Anual exista y que le pertenezca a este usuario (Zero Trust / IDOR Prevención)
        $objetivoModel = new ObjetivoAnual();
        $objetivo = $objetivoModel->getOne((int)$objetivo_id, $payload['id']);

        if (!$objetivo) {
            Response::json(403, "No tienes permiso para agregar meses a este objetivo o no existe.");
        }

        // 2. Procesar la entrada
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->mes) && !empty($data->titulo)) {
            $mes_numero = (int)$data->mes;
            if ($mes_numero < 1 || $mes_numero > 12) {
                Response::json(400, "El mes debe estar entre 1 y 12.");
            }

            $mes = new Mes();
            $mes->objetivo_anual_id = (int)$objetivo_id;
            $mes->mes = $mes_numero;
            $mes->titulo = htmlspecialchars(strip_tags($data->titulo));

            if ($mes->create()) {
                Response::json(201, "Mes planificado exitosamente.", [
                    "id" => $mes->id,
                    "mes" => $mes->mes,
                    "titulo" => $mes->titulo,
                    "progreso_total" => 0.00
                ]);
            } else {
                Response::json(400, "Este mes ya ha sido asignado a este objetivo.");
            }
        } else {
            Response::json(400, "Datos incompletos. Se requiere mes y titulo.");
        }
    }
}
