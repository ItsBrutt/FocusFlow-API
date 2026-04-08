<?php

namespace App\Controllers;

use PDO;
use App\Utils\AuthMiddleware;
use App\Config\Database;
use App\Utils\Response;

class SemanaController {
    
    /**
     * "El Buscador del Presente": Trae todo el array listo para iterar si la semana activa existe.
     */
    public function getActiveWeek($objetivo_id) {
        $payload = AuthMiddleware::getPayload();
        $db = Database::getInstance()->getConnection();

        // Verificar propiedad IDOR
        $check = "SELECT id FROM Objetivos_Anuales WHERE id = :id AND usuario_id = :uid LIMIT 1";
        $stmtCheck = $db->prepare($check);
        $stmtCheck->execute(['id' => $objetivo_id, 'uid' => $payload['id']]);
        if (!$stmtCheck->fetch()) {
            Response::json(403, "Acceso Denegado.");
        }

        // Buscar la semana ACTIVA (CURDATE() entre inicio y fin) para este objetivo
        // A través del eslabón: Objetivos_Anuales -> Objetivos_Mensuales -> Planner_Semanal
        $query = "
            SELECT ps.id AS semana_id, ps.numero_semana, ps.fecha_inicio, ps.fecha_fin, ps.completada,
                   om.titulo AS mes_titulo, om.progreso_total
            FROM Planner_Semanal ps
            JOIN Objetivos_Mensuales om ON ps.objetivo_mensual_id = om.id
            WHERE om.objetivo_anual_id = :obj_id 
              AND CURDATE() BETWEEN ps.fecha_inicio AND ps.fecha_fin
            LIMIT 1
        ";

        $stmt = $db->prepare($query);
        $stmt->execute(['obj_id' => $objetivo_id]);
        $semana = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$semana) {
            Response::json(404, "No hay semana activa.");
        }

        // Extraer Días
        $qDias = "SELECT * FROM Dias WHERE planner_semanal_id = :sem_id ORDER BY id ASC";
        $stmtDias = $db->prepare($qDias);
        $stmtDias->execute(['sem_id' => $semana['semana_id']]);
        $semana['dias'] = $stmtDias->fetchAll(PDO::FETCH_ASSOC);

        // Extraer Tareas de esos días
        $qTareas = "SELECT * FROM Tareas WHERE dia_id = :dia_id ORDER BY prioridad_orden ASC";
        $stmtTareas = $db->prepare($qTareas);

        foreach ($semana['dias'] as &$dia) {
            $stmtTareas->execute(['dia_id' => $dia['id']]);
            $dia['tareas'] = $stmtTareas->fetchAll(PDO::FETCH_ASSOC);
        }

        Response::json(200, "Semana Activa Encontrada", $semana);
    }

    /**
     * Auto-Generador de Semana
     */
    public function generateWeek($objetivo_id) {
        $payload = AuthMiddleware::getPayload();
        $db = Database::getInstance()->getConnection();

        // Verificar propiedad IDOR
        $check = "SELECT id FROM Objetivos_Anuales WHERE id = :id AND usuario_id = :uid LIMIT 1";
        $stmtCheck = $db->prepare($check);
        $stmtCheck->execute(['id' => $objetivo_id, 'uid' => $payload['id']]);
        if (!$stmtCheck->fetch()) {
            Response::json(403, "Acceso Denegado.");
        }

        // Atomicidad al generar una jerarquía entera
        $db->beginTransaction();

        try {
            $mes_actual = (int)date('n'); // 1 a 12
            $nombre_mes = date('F'); // English fallback if no lang setup

            // 1. ¿Existe el mes? Si no, crearlo.
            $qMes = "SELECT id FROM Objetivos_Mensuales WHERE objetivo_anual_id = ? AND mes = ? LIMIT 1";
            $stmtM = $db->prepare($qMes);
            $stmtM->execute([$objetivo_id, $mes_actual]);
            $mes_db = $stmtM->fetch(PDO::FETCH_ASSOC);

            if ($mes_db) {
                $mes_id = $mes_db['id'];
            } else {
                $iMes = "INSERT INTO Objetivos_Mensuales (objetivo_anual_id, mes, titulo) VALUES (?, ?, ?)";
                $db->prepare($iMes)->execute([$objetivo_id, $mes_actual, "Plan Generado Automático - Mes " . $mes_actual]);
                $mes_id = $db->lastInsertId();
            }

            // 2. Calcular inicio y fin de la semana vigente (Lunes a Viernes o Domingo a Sabado)
            // Lunes como dia base
            $lunes = date('Y-m-d', strtotime('monday this week'));
            $viernes = date('Y-m-d', strtotime('friday this week'));

            // Prevenir duplicidad si ya existe una semana pisando estos días
            $qSe = "SELECT id FROM Planner_Semanal WHERE objetivo_mensual_id = ? AND (? BETWEEN fecha_inicio AND fecha_fin) LIMIT 1";
            $stmtSe = $db->prepare($qSe);
            $stmtSe->execute([$mes_id, date('Y-m-d')]);
            if ($stmtSe->fetch()) {
                $db->rollBack();
                Response::json(400, "La semana ya está autogenerada.");
            }

            // 3. Crear Planner_Semanal
            $iSem = "INSERT INTO Planner_Semanal (objetivo_mensual_id, numero_semana, fecha_inicio, fecha_fin) VALUES (?, 1, ?, ?)";
            $db->prepare($iSem)->execute([$mes_id, $lunes, $viernes]);
            $semana_id = $db->lastInsertId();

            // 4. Crear los 5 Días
            $diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            $iDia = "INSERT INTO Dias (planner_semanal_id, nombre_dia, fecha_exacta, bloqueado) VALUES (?, ?, ?, ?)";
            $stmtDia = $db->prepare($iDia);
            
            foreach ($diasNombres as $index => $nombre) {
                $fecha_dia = date('Y-m-d', strtotime('monday this week + ' . $index . ' days'));
                $bloqueado = ($index === 0) ? 0 : 1; // Solo el Lunes (0) está desbloqueado
                
                $stmtDia->execute([$semana_id, $nombre, $fecha_dia, $bloqueado]);
            }

            $db->commit();
            Response::json(201, "Jerarquía de semana generada y lista para planificación.");

        } catch (\Exception $e) {
            $db->rollBack();
            Response::json(500, "Error en Transacción de Generación: " . $e->getMessage());
        }
    }
}
