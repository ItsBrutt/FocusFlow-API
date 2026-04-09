<?php

namespace App\Controllers;

use App\Utils\AuthMiddleware;
use App\Models\Tarea;
use App\Utils\Response;
use App\Utils\Validator;

class TareaController {

    public function create() {
        $payload = AuthMiddleware::getPayload();
        $usuario_id = $payload['id'];
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->dia_id) || empty($data->descripcion)) {
            Response::json(400, "El dia_id y la descripcion son obligatorios.");
        }

        $tarea = new Tarea();
        
        // Anti-IDOR: El dia_id debe pertenecer al usuario
        if (!$tarea->isDayOwnedByUser((int)$data->dia_id, $usuario_id)) {
            Response::json(403, "No tienes permisos para planificar en este día.");
        }

        // Validación: Solo impedir planificar en semanas ya cerradas (historial inmutable)
        // La planificación es LIBRE dentro de cualquier día de la semana activa
        $db = \App\Config\Database::getInstance()->getConnection();
        $qDia = "SELECT ps.fecha_fin FROM Dias d JOIN Planner_Semanal ps ON d.planner_semanal_id = ps.id WHERE d.id = ?";
        $stmtDia = $db->prepare($qDia);
        $stmtDia->execute([(int)$data->dia_id]);
        $diaDb = $stmtDia->fetch(\PDO::FETCH_ASSOC);

        if (!$diaDb) {
            Response::json(404, "No se encontró el día en la base de datos. Puede que la semana no esté correctamente iniciada.");
        }

        if (strtotime($diaDb['fecha_fin']) < strtotime(date('Y-m-d'))) {
            Response::json(403, "Esta semana ya es parte de tu historial inmutable. No puedes agregar tareas en el pasado.");
        }

        $tarea->dia_id = (int)$data->dia_id;
        $tarea->descripcion = $data->descripcion;
        $tarea->categoria = $data->categoria ?? 'Backend';
        $tarea->bloque_horario = $data->bloque_horario ?? 'Mañana';
        $tarea->hora_inicio = $data->hora_inicio ?? '10:00:00';
        $tarea->duracion_minutos = isset($data->duracion_minutos) ? (int)$data->duracion_minutos : 60;
        
        // Obtener el count para saber la prioridad
        $db = \App\Config\Database::getInstance()->getConnection();
        $stmtC = $db->prepare("SELECT COUNT(id) FROM Tareas WHERE dia_id = ?");
        $stmtC->execute([$tarea->dia_id]);
        $count = $stmtC->fetchColumn();
        $tarea->prioridad_orden = $count + 1;

        if ($tarea->create()) {
            // Edge Case: Revocar Trofeo Si añadimos Scope a una semana completada
            $qRevoke = "
                SELECT ps.id as semana_id, om.id as mes_id
                FROM Planner_Semanal ps
                JOIN Dias d ON ps.id = d.planner_semanal_id
                JOIN Objetivos_Mensuales om ON ps.objetivo_mensual_id = om.id
                WHERE d.id = ?
                LIMIT 1
            ";
            $rStmt = $db->prepare($qRevoke);
            $rStmt->execute([$tarea->dia_id]);
            $rTraza = $rStmt->fetch(\PDO::FETCH_ASSOC);

            if ($rTraza) {
                $db->prepare("UPDATE Planner_Semanal SET completada = false WHERE id = ? AND completada = true")
                   ->execute([$rTraza['semana_id']]);
                $this->recalcularProgresoMes($rTraza['mes_id'], $db); // Nuevo denominador = nuevo progreso
            }

            Response::json(201, "Tarea creada.", [
                "id"             => $tarea->id,
                "descripcion"    => $tarea->descripcion,
                "categoria"      => $tarea->categoria,
                "bloque_horario" => $tarea->bloque_horario,
                "hora_inicio"    => $tarea->hora_inicio,
                "duracion_minutos" => $tarea->duracion_minutos,
                "estado"         => "Pendiente",
                "prioridad_orden" => $tarea->prioridad_orden
            ]);
        } else {
            Response::json(500, "Error al crear tarea.");
        }
    }
    
    public function update($id) {
        $payload = AuthMiddleware::getPayload();
        $usuario_id = $payload['id'];
        
        $data = json_decode(file_get_contents("php://input"));

        $validator = new Validator($data);
        $validator->require(['estado'])
                  ->validateEnum('estado', ['Pendiente', 'En Progreso', 'Finalizado']);

        if ($validator->fails()) {
            Response::json(400, "Errores de validacion.", $validator->getErrors());
        }
        
        $cleanData = $validator->getRawData();
        $tarea = new Tarea();

        if (!$tarea->isOwnedByUser($id, $usuario_id)) {
            Response::json(403, "No tienes permisos para modificar esta tarea.");
        }

        $db = \App\Config\Database::getInstance()->getConnection();

        $nuevo_estado = $cleanData['estado'];

        // Validación de Ejecución Secuencial: el día anterior debe estar completo para avanzar a Finalizado
        $qTraza = "
            SELECT d.fecha_exacta, ps.id as semana_id, ps.fecha_fin,
                   (SELECT COUNT(t2.id) FROM Tareas t2
                    JOIN Dias d2 ON t2.dia_id = d2.id
                    WHERE d2.planner_semanal_id = ps.id
                    AND d2.fecha_exacta < d.fecha_exacta
                    AND t2.estado != 'Finalizado') as pendientes_dias_previos
            FROM Tareas t
            JOIN Dias d ON t.dia_id = d.id
            JOIN Planner_Semanal ps ON d.planner_semanal_id = ps.id
            WHERE t.id = ?
        ";
        $stmtTrazaVal = $db->prepare($qTraza);
        $stmtTrazaVal->execute([$id]);
        $diaVal = $stmtTrazaVal->fetch(\PDO::FETCH_ASSOC);

        if ($diaVal) {
            // Solo restringir si estamos queriendo completarla
            if ($nuevo_estado === 'Finalizado' && $diaVal['pendientes_dias_previos'] > 0) {
                Response::json(403, "Debes completar todas las tareas del día anterior antes de avanzar. La disciplina es secuencial. 🔒");
            }
            if (strtotime($diaVal['fecha_fin']) < strtotime(date('Y-m-d'))) {
                Response::json(403, "Semana inmutable caducada. No puedes alterar el pasado.");
            }
        }
        
        try {
            $db->beginTransaction();

            // 1. Actualizar estado de la tarea (Puro SQL por simplificación atómica)
            $stmt = $db->prepare("UPDATE Tareas SET estado = ? WHERE id = ?");
            $stmt->execute([$nuevo_estado, $id]);

            // 2. Trazabilidad Hacia Arriba (Bottom-Up): Extraer a qué Mes pertenece para recalcular progreso
            // Siempre recalculamos el progreso, sea 'Finalizado' o vuelva a 'Pendiente'
            $sTraza = "
                SELECT om.id AS mes_id, d.id AS dia_id, ps.id as semana_id
                FROM Tareas t
                JOIN Dias d ON t.dia_id = d.id
                JOIN Planner_Semanal ps ON d.planner_semanal_id = ps.id
                JOIN Objetivos_Mensuales om ON ps.objetivo_mensual_id = om.id
                WHERE t.id = ? LIMIT 1
            ";
            $stmtTraza = $db->prepare($sTraza);
            $stmtTraza->execute([$id]);
            $traza = $stmtTraza->fetch(\PDO::FETCH_ASSOC);

            if ($traza) {
                $this->recalcularProgresoMes($traza['mes_id'], $db);

                // 3. Desbloqueo secuencial del siguiente día (solo si se está completando algo nuevo)
                if ($nuevo_estado === 'Finalizado') {
                    $sFaltan = "SELECT COUNT(*) FROM Tareas WHERE dia_id = ? AND estado != 'Finalizado'";
                    $stmtFaltan = $db->prepare($sFaltan);
                    $stmtFaltan->execute([$traza['dia_id']]);

                    if ($stmtFaltan->fetchColumn() == 0) {
                        // PostgreSQL no soporta ORDER BY/LIMIT en UPDATE: usar subquery
                        $db->prepare("
                            UPDATE Dias SET bloqueado = false
                            WHERE id = (
                                SELECT id FROM Dias
                                WHERE planner_semanal_id = ? AND id > ?
                                ORDER BY id ASC LIMIT 1
                            )
                        ")->execute([$traza['semana_id'], $traza['dia_id']]);
                    }
                }

                // 4. Juez de la Semana: Activar/Desactivar trofeo
                $sJuez = "
                    SELECT 
                        COUNT(DISTINCT d.id)                                            AS dias_totales,
                        COUNT(DISTINCT CASE WHEN t.id IS NOT NULL THEN d.id END)        AS dias_con_tareas,
                        SUM(CASE WHEN t.estado != 'Finalizado' THEN 1 ELSE 0 END)       AS tareas_pendientes
                    FROM Dias d
                    LEFT JOIN Tareas t ON t.dia_id = d.id
                    WHERE d.planner_semanal_id = ?
                ";
                $juez = $db->prepare($sJuez);
                $juez->execute([$traza['semana_id']]);
                $j = $juez->fetch(\PDO::FETCH_ASSOC);

                // Si al desmarcarla ya no está completa, marcar semana como no completada (ps.completada=0)
                if ($nuevo_estado !== 'Finalizado') {
                    $db->prepare("UPDATE Planner_Semanal SET completada = false WHERE id = ?")->execute([$traza['semana_id']]);
                } else if ($j['dias_totales'] == 5 && $j['dias_con_tareas'] == 5 && $j['tareas_pendientes'] == 0) {
                    $db->prepare("UPDATE Planner_Semanal SET completada = true WHERE id = ?")->execute([$traza['semana_id']]);
                }
                
                // Recalcular el mes OTRA VEZ por si cambió el estado de la semana (esto afecta al modelo de 25%)
                $this->recalcularProgresoMes($traza['mes_id'], $db);
            }

            $db->commit();
            Response::json(200, "Estado actualizado.", ["estado" => $nuevo_estado]);

        } catch (\Exception $e) {
            $db->rollBack();
            Response::json(500, "Error crítico: " . $e->getMessage());
        }
    }

    /**
     * Recalcula el progreso de un mes usando el modelo de 4 semanas × 25%.
     * - Semana completada (completada=1) aporta 25% sin importar las tareas.
     * - Semana iniciada pero no completada: aporta (tareas_finalizadas / total_tareas) * 25%.
     * - Semana no iniciada: aporta 0%.
     * Total mes = suma de todos los aportes → máximo 100%.
     */
    private function recalcularProgresoMes(int $mes_id, \PDO $db): void {
        $sql = "
            SELECT
                ps.id,
                ps.completada,
                COUNT(t.id)                                             AS total_tareas,
                SUM(CASE WHEN t.estado = 'Finalizado' THEN 1 ELSE 0 END) AS tareas_hechas
            FROM Planner_Semanal ps
            LEFT JOIN Dias d ON d.planner_semanal_id = ps.id
            LEFT JOIN Tareas t ON t.dia_id = d.id
            WHERE ps.objetivo_mensual_id = ?
            GROUP BY ps.id, ps.completada
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute([$mes_id]);
        $semanas = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $progreso_total = 0.0;
        foreach ($semanas as $sem) {
            if ($sem['completada']) {
                $progreso_total += 25.0; // Semana conquistada → 25% fijo
            } elseif ($sem['total_tareas'] > 0) {
                $progreso_total += ($sem['tareas_hechas'] / $sem['total_tareas']) * 25.0;
            }
            // Semana no iniciada o sin tareas → aporta 0%
        }

        $db->prepare("UPDATE Objetivos_Mensuales SET progreso_total = ROUND(?, 2) WHERE id = ?")
           ->execute([min(100.0, $progreso_total), $mes_id]);
    }

    /**
     * Elimina una tarea (con validación de propiedad)
     */
    public function delete($id) {
        $payload = AuthMiddleware::getPayload();
        $usuario_id = $payload['id'];
        $tarea = new Tarea();

        if (!$tarea->isOwnedByUser($id, $usuario_id)) {
            Response::json(403, "No tienes permisos para eliminar esta tarea.");
        }

        $db = \App\Config\Database::getInstance()->getConnection();

        // Obtener semana_id para revocar trofeo si aplica
        $qTraza = "
            SELECT ps.id as semana_id, om.id as mes_id
            FROM Tareas t
            JOIN Dias d ON t.dia_id = d.id
            JOIN Planner_Semanal ps ON d.planner_semanal_id = ps.id
            JOIN Objetivos_Mensuales om ON ps.objetivo_mensual_id = om.id
            WHERE t.id = ? LIMIT 1
        ";
        $stmtTraza = $db->prepare($qTraza);
        $stmtTraza->execute([$id]);
        $traza = $stmtTraza->fetch(\PDO::FETCH_ASSOC);

        $db->prepare("DELETE FROM Tareas WHERE id = ?")->execute([$id]);

        // Revocar trofeo y recalcular progreso del mes
        if ($traza) {
            $db->prepare("UPDATE Planner_Semanal SET completada = false WHERE id = ? AND completada = true")->execute([$traza['semana_id']]);
            $this->recalcularProgresoMes($traza['mes_id'], $db);
        }

        Response::json(200, "Tarea eliminada.");
    }

    /**
     * Edita la descripción o categoría de una tarea
     */
    public function edit($id) {
        $payload = AuthMiddleware::getPayload();
        $usuario_id = $payload['id'];
        $data = json_decode(file_get_contents("php://input"));
        $tarea = new Tarea();

        if (!$tarea->isOwnedByUser($id, $usuario_id)) {
            Response::json(403, "No tienes permisos para editar esta tarea.");
        }

        $db = \App\Config\Database::getInstance()->getConnection();
        $fields = [];
        $params = [];
        if (!empty($data->descripcion)) { $fields[] = 'descripcion = ?'; $params[] = htmlspecialchars(strip_tags($data->descripcion)); }
        if (!empty($data->categoria)) { $fields[] = 'categoria = ?'; $params[] = $data->categoria; }

        if (empty($fields)) Response::json(400, "Sin campos para actualizar.");

        $params[] = $id;
        $db->prepare("UPDATE Tareas SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        Response::json(200, "Tarea actualizada.");
    }
}
