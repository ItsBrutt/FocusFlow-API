<?php

namespace App\Controllers;

use App\Utils\AuthMiddleware;
use App\Models\ObjetivoAnual;
use App\Utils\Response;

class ObjetivoController {
    
    public function create() {
        $payload = AuthMiddleware::getPayload();
        
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->anio) && !empty($data->titulo) && !empty($data->cantidad_meses)) {
            $cantidad_meses = (int)$data->cantidad_meses;
            if ($cantidad_meses < 1 || $cantidad_meses > 12) {
                Response::json(400, "La cantidad de meses debe estar entre 1 y 12.");
            }

            $db = \App\Config\Database::getInstance()->getConnection();
            $db->beginTransaction();

            try {
                $objetivo = new ObjetivoAnual();
                $objetivo->usuario_id = $payload['id']; 
                $objetivo->anio = (int) $data->anio;
                $objetivo->titulo = htmlspecialchars(strip_tags($data->titulo));
                $objetivo->descripcion = htmlspecialchars(strip_tags($data->descripcion ?? ''));

                if (!$objetivo->create()) {
                    throw new \Exception("Error al crear el objetivo base.");
                }

                // Solo crear el esqueleto de Meses vacíos (sin semanas ni días).
                // El usuario los nombrará y luego iniciará cada semana intencionalmente.
                $iMes = "INSERT INTO Objetivos_Mensuales (objetivo_anual_id, mes, titulo) VALUES (?, ?, ?)";
                $stmtM = $db->prepare($iMes);
                for ($m = 1; $m <= $cantidad_meses; $m++) {
                    $stmtM->execute([$objetivo->id, $m, "Mes {$m} — Define tu objetivo aquí"]);
                }

                $db->commit();
                Response::json(201, "Objetivo creado. Ahora asigna un propósito a cada mes.", ["id" => $objetivo->id]);

            } catch (\Exception $e) {
                $db->rollBack();
                Response::json(500, "Error crítico: " . $e->getMessage());
            }

        } else {
            Response::json(400, "Datos incompletos. Se requiere anio, titulo y cantidad_meses.");
        }
    }

    /**
     * Inicia intencionalmente la Semana N de un mes.
     * Valida el Árbol de Habilidades: la semana previa debe estar completada.
     */
    public function initWeek($objetivo_id, $mes_id, $numero_semana) {
        $payload = AuthMiddleware::getPayload();
        $numero_semana = (int)$numero_semana;

        $db = \App\Config\Database::getInstance()->getConnection();

        // Anti-IDOR: Verificar que el mes pertenece al objetivo y al usuario
        $qOwner = "
            SELECT om.id, om.mes FROM Objetivos_Mensuales om
            JOIN Objetivos_Anuales oa ON om.objetivo_anual_id = oa.id
            WHERE om.id = ? AND oa.id = ? AND oa.usuario_id = ?
        ";
        $stmtOwner = $db->prepare($qOwner);
        $stmtOwner->execute([(int)$mes_id, (int)$objetivo_id, $payload['id']]);
        $mesDb = $stmtOwner->fetch(\PDO::FETCH_ASSOC);

        if (!$mesDb) {
            Response::json(403, "No tienes permisos para este mes o no existe.");
        }

        // Verificar que esta semana no existe ya
        $qExist = "SELECT id FROM Planner_Semanal WHERE objetivo_mensual_id = ? AND numero_semana = ?";
        $stmtE = $db->prepare($qExist);
        $stmtE->execute([(int)$mes_id, $numero_semana]);
        if ($stmtE->fetch()) {
            Response::json(409, "Esta semana ya ha sido iniciada.");
        }

        // ÁRBOL DE HABILIDADES: Validar semana previa
        if ($numero_semana > 1) {
            $qPrev = "SELECT completada FROM Planner_Semanal WHERE objetivo_mensual_id = ? AND numero_semana = ?";
            $stmtPrev = $db->prepare($qPrev);
            $stmtPrev->execute([(int)$mes_id, $numero_semana - 1]);
            $semPrev = $stmtPrev->fetch(\PDO::FETCH_ASSOC);

            if (!$semPrev || !$semPrev['completada']) {
                Response::json(403, "Debes conquistar la Semana " . ($numero_semana - 1) . " antes de continuar. El camino se recorre paso a paso. 🔒");
            }
        } else {
            // Semana 1 de un Mes N > 1: requiere que Semana 4 del Mes anterior esté completada
            if ($mesDb['mes'] > 1) {
                $qMesAnterior = "
                    SELECT ps.completada FROM Planner_Semanal ps
                    JOIN Objetivos_Mensuales om ON ps.objetivo_mensual_id = om.id
                    WHERE om.objetivo_anual_id = ? AND om.mes = ? AND ps.numero_semana = 4
                ";
                $stmtMA = $db->prepare($qMesAnterior);
                $stmtMA->execute([(int)$objetivo_id, $mesDb['mes'] - 1]);
                $semAnteriorMes = $stmtMA->fetch(\PDO::FETCH_ASSOC);

                if (!$semAnteriorMes || !$semAnteriorMes['completada']) {
                    Response::json(403, "Debes conquistar completamente el Mes " . ($mesDb['mes'] - 1) . " antes de iniciar este nuevo ciclo. 🔒");
                }
            }
        }

        // Todo validado — Generar la semana y sus días
        $db->beginTransaction();
        try {
            // Calcular la fecha de inicio secuencialmente
            $qLastDate = "
                SELECT ps.fecha_fin FROM Planner_Semanal ps
                JOIN Objetivos_Mensuales om ON ps.objetivo_mensual_id = om.id
                WHERE om.objetivo_anual_id = ?
                ORDER BY ps.fecha_fin DESC LIMIT 1
            ";
            $stmtLD = $db->prepare($qLastDate);
            $stmtLD->execute([(int)$objetivo_id]);
            $lastDate = $stmtLD->fetchColumn();

            $f_inicio = $lastDate 
                ? date('Y-m-d', strtotime('monday', strtotime($lastDate . ' +1 day')))
                : date('Y-m-d', strtotime('next monday', strtotime('yesterday')));
            $f_fin = date('Y-m-d', strtotime($f_inicio . ' +4 days'));

            $stmtSem = $db->prepare("INSERT INTO Planner_Semanal (objetivo_mensual_id, numero_semana, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?) RETURNING id");
            $stmtSem->execute([(int)$mes_id, $numero_semana, $f_inicio, $f_fin]);
            $semana_id = (int)$stmtSem->fetchColumn();

            $diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            $stmtDia = $db->prepare("INSERT INTO Dias (planner_semanal_id, nombre_dia, fecha_exacta, bloqueado) VALUES (?, ?, ?, ?)");
            foreach ($diasNombres as $idx => $nombre_dia) {
                $fecha_dia = date('Y-m-d', strtotime($f_inicio . ' +' . $idx . ' days'));
                $bloqueado = 0; // Toda la semana se puede planificar de inmediato
                $stmtDia->execute([$semana_id, $nombre_dia, $fecha_dia, $bloqueado]);
            }

            $db->commit();
            Response::json(201, "¡Semana {$numero_semana} iniciada! Ahora define tus batallas.", [
                "semana_id" => (int)$semana_id,
                "fecha_inicio" => $f_inicio,
                "fecha_fin" => $f_fin
            ]);
        } catch (\Exception $e) {
            $db->rollBack();
            Response::json(500, "Error al iniciar la semana: " . $e->getMessage());
        }
    }

    /**
     * Renombra un mes (Intencionalidad declarativa)
     */
    public function renameMonth($objetivo_id, $mes_id) {
        $payload = AuthMiddleware::getPayload();
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->titulo)) Response::json(400, "El titulo es requerido.");

        $db = \App\Config\Database::getInstance()->getConnection();
        // PostgreSQL no soporta JOIN en UPDATE: usamos subquery en WHERE
        $q = "UPDATE Objetivos_Mensuales
              SET titulo = ?
              WHERE id = ?
                AND objetivo_anual_id = (
                    SELECT id FROM Objetivos_Anuales
                    WHERE id = ? AND usuario_id = ?
                )";
        $stmt = $db->prepare($q);
        $stmt->execute([htmlspecialchars(strip_tags($data->titulo)), (int)$mes_id, (int)$objetivo_id, $payload['id']]);

        if ($stmt->rowCount() > 0) {
            Response::json(200, "Mes renombrado.", ["titulo" => htmlspecialchars(strip_tags($data->titulo))]);
        } else {
            Response::json(403, "No tienes permiso para renombrar este mes.");
        }
    }

    /**
     * Renombra una semana (Intencionalidad declarativa)
     */
    public function renameWeek($objetivo_id, $semana_id) {
        $payload = AuthMiddleware::getPayload();
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->titulo)) Response::json(400, "El titulo es requerido.");

        $db = \App\Config\Database::getInstance()->getConnection();
        // PostgreSQL no soporta JOIN en UPDATE: usamos subquery en WHERE
        $q = "UPDATE Planner_Semanal
              SET titulo = ?
              WHERE id = ?
                AND objetivo_mensual_id IN (
                    SELECT om.id FROM Objetivos_Mensuales om
                    JOIN Objetivos_Anuales oa ON om.objetivo_anual_id = oa.id
                    WHERE oa.id = ? AND oa.usuario_id = ?
                )";
        $stmt = $db->prepare($q);
        $stmt->execute([htmlspecialchars(strip_tags($data->titulo)), (int)$semana_id, (int)$objetivo_id, $payload['id']]);

        if ($stmt->rowCount() > 0) {
            Response::json(200, "Semana renombrada.", ["titulo" => htmlspecialchars(strip_tags($data->titulo))]);
        } else {
            Response::json(403, "No tienes permiso para renombrar esta semana.");
        }
    }

    public function show($id) {
        $payload = AuthMiddleware::getPayload();
        
        if (!is_numeric($id)) {
            Response::json(400, "ID invalido.");
        }

        $dashboardModel = new \App\Models\Dashboard();
        $objetivo = $dashboardModel->getObjectiveTree((int)$id, $payload['id']);

        if (!$objetivo) {
            Response::json(403, "No tienes permiso para ver este objetivo o no existe.");
        }

        Response::json(200, "Objetivo recuperado.", $objetivo);
    }

    /**
     * Editar titulo/descripcion de un objetivo anual
     */
    public function updateObjetivo($id) {
        $payload = AuthMiddleware::getPayload();
        $data = json_decode(file_get_contents("php://input"));
        $db = \App\Config\Database::getInstance()->getConnection();

        $fields = [];
        $params = [];
        if (!empty($data->titulo))      { $fields[] = 'titulo = ?';      $params[] = htmlspecialchars(strip_tags($data->titulo)); }
        if (!empty($data->descripcion)) { $fields[] = 'descripcion = ?'; $params[] = htmlspecialchars(strip_tags($data->descripcion)); }

        if (empty($fields)) Response::json(400, "Sin campos para actualizar.");

        $params[] = (int)$id;
        $params[] = $payload['id'];
        $stmt = $db->prepare("UPDATE Objetivos_Anuales SET " . implode(', ', $fields) . " WHERE id = ? AND usuario_id = ?");
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            Response::json(200, "Objetivo actualizado.");
        } else {
            Response::json(403, "No tienes permiso o el objetivo no existe.");
        }
    }

    /**
     * Eliminar un objetivo anual y toda su jerarquía (CASCADE configurado en DB)
     */
    public function deleteObjetivo($id) {
        $payload = AuthMiddleware::getPayload();
        $db = \App\Config\Database::getInstance()->getConnection();

        $stmt = $db->prepare("DELETE FROM Objetivos_Anuales WHERE id = ? AND usuario_id = ?");
        $stmt->execute([(int)$id, $payload['id']]);

        if ($stmt->rowCount() > 0) {
            Response::json(200, "Objetivo eliminado.");
        } else {
            Response::json(403, "No tienes permiso o el objetivo no existe.");
        }
    }
}
