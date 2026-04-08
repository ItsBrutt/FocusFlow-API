<?php

namespace App\Models;

use PDO;
use App\Config\Database;

class Dashboard {
    private PDO $conn;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function getObjectiveTree(int $objetivo_id, int $usuario_id): ?array {
        $query = "
            SELECT 
                oa.id as oa_id, oa.anio, oa.titulo as oa_titulo, oa.descripcion as oa_desc, oa.completado as oa_completado,
                om.id as om_id, om.mes, om.titulo as om_titulo, om.progreso_total,
                ps.id as ps_id, ps.numero_semana, ps.titulo as ps_titulo, ps.peso_mensual, ps.fecha_inicio, ps.fecha_fin, ps.completada as ps_completada,
                d.id as d_id, d.nombre_dia, d.fecha_exacta, d.peso_semanal, d.bloqueado, d.estado_mental, d.reflexion_diaria,
                t.id as t_id, t.categoria, t.descripcion as t_desc, t.estado, t.bloque_horario, t.hora_inicio, t.duracion_minutos, t.prioridad_orden
            FROM Objetivos_Anuales oa
            LEFT JOIN Objetivos_Mensuales om ON oa.id = om.objetivo_anual_id
            LEFT JOIN Planner_Semanal ps ON om.id = ps.objetivo_mensual_id
            LEFT JOIN Dias d ON ps.id = d.planner_semanal_id
            LEFT JOIN Tareas t ON d.id = t.dia_id
            WHERE oa.id = :objetivo_id AND oa.usuario_id = :usuario_id
            ORDER BY oa.anio DESC, om.mes ASC, ps.numero_semana ASC, d.fecha_exacta ASC, t.prioridad_orden ASC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':objetivo_id', $objetivo_id, PDO::PARAM_INT);
        $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows)) return null;

        $tree = [];
        // Extract processing logic to avoid repeating code.
        foreach ($rows as $row) {
            $oa_id = $row['oa_id'];
            if (!isset($tree[$oa_id])) {
                $tree[$oa_id] = [
                    'id' => $oa_id,
                    'anio' => $row['anio'],
                    'titulo' => $row['oa_titulo'],
                    'descripcion' => $row['oa_desc'],
                    'completado' => (bool)$row['oa_completado'],
                    'progreso_total' => 0, // Will compute later
                    'meses' => []
                ];
            }

            if ($row['om_id'] !== null) {
                $om_id = $row['om_id'];
                if (!isset($tree[$oa_id]['meses'][$om_id])) {
                    $tree[$oa_id]['meses'][$om_id] = [
                        'id' => $om_id,
                        'mes' => $row['mes'],
                        'titulo' => $row['om_titulo'],
                        'progreso_total' => (float)$row['progreso_total'],
                        'semanas' => []
                    ];
                }

                if ($row['ps_id'] !== null) {
                    $ps_id = $row['ps_id'];
                    if (!isset($tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id])) {
                        $tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id] = [
                            'id' => $ps_id,
                            'numero_semana' => $row['numero_semana'],
                            'titulo' => $row['ps_titulo'],
                            'peso_mensual' => (float)$row['peso_mensual'],
                            'fecha_inicio' => $row['fecha_inicio'],
                            'fecha_fin' => $row['fecha_fin'],
                            'completada' => (bool)$row['ps_completada'],
                            'dias' => []
                        ];
                    }

                    if ($row['d_id'] !== null) {
                        $d_id = $row['d_id'];
                        if (!isset($tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id]['dias'][$d_id])) {
                            $tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id]['dias'][$d_id] = [
                                'id' => $d_id,
                                'nombre_dia' => $row['nombre_dia'],
                                'fecha_exacta' => $row['fecha_exacta'],
                                'peso_semanal' => (float)$row['peso_semanal'],
                                'bloqueado' => (bool)$row['bloqueado'],
                                'estado_mental' => $row['estado_mental'],
                                'reflexion_diaria' => $row['reflexion_diaria'],
                                'tareas' => []
                            ];
                        }

                        if ($row['t_id'] !== null) {
                            $tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id]['dias'][$d_id]['tareas'][] = [
                                'id' => $row['t_id'],
                                'categoria' => $row['categoria'],
                                'descripcion' => $row['t_desc'],
                                'estado' => $row['estado'],
                                'bloque_horario' => $row['bloque_horario'],
                                'hora_inicio' => $row['hora_inicio'],
                                'duracion_minutos' => $row['duracion_minutos'],
                                'prioridad_orden' => $row['prioridad_orden']
                            ];
                        }
                    }
                }
            }
        }

        $arr = array_values(array_map(function($oa) {
            $totalProgresoMeses = 0;
            $countMeses = count($oa['meses']);
            
            $oa['meses'] = array_values(array_map(function($om) use (&$totalProgresoMeses) {
                $totalProgresoMeses += $om['progreso_total'];
                $om['semanas'] = array_values(array_map(function($ps) {
                    $ps['dias'] = array_values($ps['dias']);
                    return $ps;
                }, $om['semanas']));
                return $om;
            }, $oa['meses']));
            
            $oa['progreso_total'] = $countMeses > 0 ? round($totalProgresoMeses / $countMeses, 2) : 0;
            return $oa;
        }, $tree));

        return $arr[0] ?? null;
    }

    /**
     * Obtiene el arbol completo anidado (Objetivos -> Meses -> Semanas -> Dias -> Tareas)
     * Optimizando las consultas SQL a una sola mediante JOINs y procesando la estructura en PHP.
     */
    public function getUserDashboardTree(int $usuario_id): array {
        $query = "
            SELECT 
                oa.id as oa_id, oa.anio, oa.titulo as oa_titulo, oa.descripcion as oa_desc, oa.completado as oa_completado,
                om.id as om_id, om.mes, om.titulo as om_titulo, om.progreso_total,
                ps.id as ps_id, ps.numero_semana, ps.peso_mensual, ps.fecha_inicio, ps.fecha_fin, ps.completada as ps_completada,
                d.id as d_id, d.nombre_dia, d.fecha_exacta, d.peso_semanal, d.bloqueado, d.estado_mental, d.reflexion_diaria,
                t.id as t_id, t.categoria, t.descripcion as t_desc, t.estado, t.bloque_horario, t.hora_inicio, t.duracion_minutos, t.prioridad_orden
            FROM Objetivos_Anuales oa
            LEFT JOIN Objetivos_Mensuales om ON oa.id = om.objetivo_anual_id
            LEFT JOIN Planner_Semanal ps ON om.id = ps.objetivo_mensual_id
            LEFT JOIN Dias d ON ps.id = d.planner_semanal_id
            LEFT JOIN Tareas t ON d.id = t.dia_id
            WHERE oa.usuario_id = :usuario_id
            ORDER BY oa.anio DESC, om.mes ASC, ps.numero_semana ASC, d.fecha_exacta ASC, t.prioridad_orden ASC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Agrupación en PHP para convertir resultado lineal en una estructura de árbol
        $tree = [];

        foreach ($rows as $row) {
            $oa_id = $row['oa_id'];
            if (!isset($tree[$oa_id])) {
                $tree[$oa_id] = [
                    'id' => $oa_id,
                    'anio' => $row['anio'],
                    'titulo' => $row['oa_titulo'],
                    'descripcion' => $row['oa_desc'],
                    'completado' => (bool)$row['oa_completado'],
                    'meses' => []
                ];
            }

            if ($row['om_id'] !== null) {
                $om_id = $row['om_id'];
                if (!isset($tree[$oa_id]['meses'][$om_id])) {
                    $tree[$oa_id]['meses'][$om_id] = [
                        'id' => $om_id,
                        'mes' => $row['mes'],
                        'titulo' => $row['om_titulo'],
                        'progreso_total' => (float)$row['progreso_total'],
                        'semanas' => []
                    ];
                }

                if ($row['ps_id'] !== null) {
                    $ps_id = $row['ps_id'];
                    if (!isset($tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id])) {
                        $tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id] = [
                            'id' => $ps_id,
                            'numero_semana' => $row['numero_semana'],
                            'peso_mensual' => (float)$row['peso_mensual'],
                            'fecha_inicio' => $row['fecha_inicio'],
                            'fecha_fin' => $row['fecha_fin'],
                            'completada' => (bool)$row['ps_completada'],
                            'dias' => []
                        ];
                    }

                    if ($row['d_id'] !== null) {
                        $d_id = $row['d_id'];
                        if (!isset($tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id]['dias'][$d_id])) {
                            $tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id]['dias'][$d_id] = [
                                'id' => $d_id,
                                'nombre_dia' => $row['nombre_dia'],
                                'fecha_exacta' => $row['fecha_exacta'],
                                'peso_semanal' => (float)$row['peso_semanal'],
                                'bloqueado' => (bool)$row['bloqueado'],
                                'estado_mental' => $row['estado_mental'],
                                'reflexion_diaria' => $row['reflexion_diaria'],
                                'tareas' => []
                            ];
                        }

                        if ($row['t_id'] !== null) {
                            $tree[$oa_id]['meses'][$om_id]['semanas'][$ps_id]['dias'][$d_id]['tareas'][] = [
                                'id' => $row['t_id'],
                                'categoria' => $row['categoria'],
                                'descripcion' => $row['t_desc'],
                                'estado' => $row['estado'],
                                'bloque_horario' => $row['bloque_horario'],
                                'hora_inicio' => $row['hora_inicio'],
                                'duracion_minutos' => $row['duracion_minutos'],
                                'prioridad_orden' => $row['prioridad_orden']
                            ];
                        }
                    }
                }
            }
        }

        // Remover las keys asociativas creadas para rápida indexación y devolver arreglos puros (0, 1, 2...)
        return array_values(array_map(function($oa) {
            $totalProgresoMeses = 0;
            $countMeses = count($oa['meses']);
            
            $oa['meses'] = array_values(array_map(function($om) use (&$totalProgresoMeses) {
                $totalProgresoMeses += $om['progreso_total'];
                $om['semanas'] = array_values(array_map(function($ps) {
                    $ps['dias'] = array_values($ps['dias']);
                    return $ps;
                }, $om['semanas']));
                return $om;
            }, $oa['meses']));
            
            $oa['progreso_total'] = $countMeses > 0 ? round($totalProgresoMeses / $countMeses, 2) : 0;
            return $oa;
        }, $tree));
    }
}
