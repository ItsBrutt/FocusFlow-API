import { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';

const HORAS_POR_BLOQUE = {
    'Madrugada': ['00:00','01:00','02:00','03:00','04:00','05:00'],
    'Mañana':    ['06:00','07:00','08:00','09:00','10:00','11:00'],
    'Tarde':     ['12:00','13:00','14:00','15:00','16:00','17:00'],
    'Noche':     ['18:00','19:00','20:00','21:00','22:00','23:00']
};

// ─── Subcomponente: Añadir Tarea Colapsable ────────────────────────────────────
const AddTaskInline = ({ diaId, onTareaAgregada }) => {
    const [expanded, setExpanded] = useState(false);
    const [text, setText] = useState('');
    const [categoria, setCategoria] = useState('');
    const [bloque, setBloque] = useState('Mañana');
    const [hora, setHora] = useState('10:00');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!HORAS_POR_BLOQUE[bloque].includes(hora)) {
            setHora(HORAS_POR_BLOQUE[bloque][0]);
        }
    }, [bloque, hora]);

    useEffect(() => {
        if (expanded && inputRef.current) {
            // pequeño delay para que la animación CSS termine primero
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [expanded]);

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter' && text.trim() !== '') {
            e.preventDefault();
            setLoading(true);
            try {
                const tag = categoria.trim() === '' ? 'General' : categoria;
                const response = await api.post('/api/tareas', {
                    dia_id: diaId,
                    descripcion: text,
                    categoria: tag,
                    bloque_horario: bloque,
                    hora_inicio: hora
                });
                if (response.data.success) {
                    onTareaAgregada(diaId, response.data.data);
                    setText('');
                    setCategoria('');
                    setExpanded(false);
                }
            } catch (err) {
                alert(err.response?.data?.message || "Error al crear la tarea");
            } finally {
                setLoading(false);
            }
        }
        if (e.key === 'Escape') {
            setExpanded(false);
            setText('');
        }
    };

    return (
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            {/* Estilos de animación */}
            <style>{`
                .add-task-form {
                    overflow: hidden;
                    max-height: 0;
                    opacity: 0;
                    transition: max-height 0.28s ease, opacity 0.2s ease;
                }
                .add-task-form.open {
                    max-height: 200px;
                    opacity: 1;
                }
                .add-btn-ghost {
                    width: 100%;
                    border: 1.5px dashed #cbd5e1;
                    background: transparent;
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-size: 0.78rem;
                    color: #94a3b8;
                    cursor: pointer;
                    text-align: center;
                    transition: border-color 0.2s, color 0.2s, background 0.2s;
                    font-weight: 500;
                }
                .add-btn-ghost:hover {
                    border-color: #2563eb;
                    color: #2563eb;
                    background: #eff6ff;
                }
            `}</style>

            {/* Formulario expandible */}
            <div className={`add-task-form ${expanded ? 'open' : ''}`}>
                <div style={{ paddingBottom: '6px', display: 'flex', flexDirection: 'column', gap: '5px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                            type="text"
                            list="categorias-list"
                            className="form-control form-control-sm"
                            style={{ fontSize: '0.76rem', color: '#0d6efd', flex: '1' }}
                            placeholder="Categoría"
                            value={categoria}
                            onChange={e => setCategoria(e.target.value)}
                            disabled={loading}
                        />
                        <select
                            className="form-select form-select-sm"
                            style={{ fontSize: '0.72rem', color: '#7c3aed', maxWidth: '85px' }}
                            value={bloque}
                            onChange={e => setBloque(e.target.value)}
                            disabled={loading}
                        >
                            <option value="Madrugada">🌙 Madr</option>
                            <option value="Mañana">☀️ Mañ</option>
                            <option value="Tarde">🌤️ Tarde</option>
                            <option value="Noche">🌆 Noche</option>
                        </select>
                        <select
                            className="form-select form-select-sm"
                            style={{ fontSize: '0.72rem', color: '#0f172a', maxWidth: '72px' }}
                            value={hora}
                            onChange={e => setHora(e.target.value)}
                            disabled={loading}
                        >
                            {HORAS_POR_BLOQUE[bloque].map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={loading ? 'Guardando...' : 'Define la acción → Enter para guardar'}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        style={{ fontSize: '0.85rem', color: '#212529' }}
                    />
                </div>
            </div>
            <datalist id="categorias-list">
                <option value="Backend" />
                <option value="React" />
                <option value="Entrenamiento" />
                <option value="Meditacion" />
                <option value="Lectura" />
                <option value="Inglés" />
            </datalist>

            {/* Botón fantasma o cancelar */}
            {expanded ? (
                <button className="add-btn-ghost" onClick={() => { setExpanded(false); setText(''); }} style={{ borderColor: '#fca5a5', color: '#ef4444' }}>
                    ✕ Cancelar
                </button>
            ) : (
                <button className="add-btn-ghost" onClick={() => setExpanded(true)}>
                    + Añadir nueva acción
                </button>
            )}
        </div>
    );
};

// ─── Subcomponente: Tarjeta de Tarea ──────────────────────────────────────────
const TareaCard = ({ tarea, diaId, executionLocked, inThePast, onComplete, onDelete, onEdit, isUpdating }) => {
    const [editMode, setEditMode] = useState(false);
    const [editText, setEditText] = useState(tarea.descripcion);
    const [deleting, setDeleting] = useState(false);

    const isDone = tarea.estado === 'Finalizado';
    const missedTask = inThePast && !isDone;

    const handleSaveEdit = async () => {
        if (editText.trim() === tarea.descripcion) { setEditMode(false); return; }
        try {
            await api.patch(`/api/tareas/${tarea.id}`, { descripcion: editText.trim() });
            onEdit(diaId, tarea.id, editText.trim());
        } catch { /* silencioso */ }
        setEditMode(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Eliminar esta tarea?')) return;
        setDeleting(true);
        try {
            await api.delete(`/api/tareas/${tarea.id}`);
            onDelete(diaId, tarea.id);
        } catch { setDeleting(false); }
    };

    const cardBg    = isDone ? '#f0fdf4' : missedTask ? '#fff7ed' : '#fff';
    const cardBorder= isDone ? '#86efac' : missedTask ? '#fcd34d' : '#e2e8f0';

    return (
        <div style={{
            padding: '8px 10px', borderRadius: '8px',
            border: `1px solid ${cardBorder}`,
            borderLeft: `3px solid ${isDone ? '#22c55e' : missedTask ? '#f59e0b' : '#2563eb'}`,
            background: cardBg,
            fontSize: '0.88rem', transition: 'all 0.2s',
            opacity: isUpdating ? 0.6 : 1,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <span style={{
                    padding: '1px 7px', borderRadius: '20px',
                    fontSize: '0.68rem', fontWeight: '700',
                    background: isDone ? '#dcfce7' : '#dbeafe',
                    color: isDone ? '#15803d' : '#1d4ed8',
                }}>
                    {tarea.categoria}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {isUpdating && <span className="spinner-border spinner-border-sm text-primary" style={{ width: '12px', height: '12px' }} />}
                    {isDone && <span style={{ fontSize: '0.8rem' }}>✅</span>}
                    {missedTask && <span style={{ fontSize: '0.8rem' }}>⚠️</span>}
                    {!isDone && !inThePast && (
                        <>
                            <button className="btn btn-link btn-sm p-0 text-muted" style={{ fontSize: '0.65rem', lineHeight: 1 }} onClick={() => setEditMode(true)} title="Editar">✏️</button>
                            <button className="btn btn-link btn-sm p-0 text-danger" style={{ fontSize: '0.65rem', lineHeight: 1 }} onClick={handleDelete} disabled={deleting} title="Eliminar">{deleting ? '…' : '🗑️'}</button>
                        </>
                    )}
                </div>
            </div>

            {editMode ? (
                <input
                    autoFocus type="text"
                    className="form-control form-control-sm mt-1"
                    style={{ fontSize: '0.83rem', color: '#212529', background: '#fff' }}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditMode(false); }}
                />
            ) : (
                <div
                    className={isDone ? 'text-decoration-line-through' : ''}
                    style={{
                        fontSize: '0.82rem', color: isDone ? '#6b7280' : missedTask ? '#92400e' : '#1e293b',
                        lineHeight: 1.35,
                        cursor: (!inThePast && !executionLocked) || isDone ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                        if ((!inThePast && !executionLocked && !isUpdating) || (isDone && !isUpdating)) {
                            onComplete(tarea);
                        }
                    }}
                >
                    <span style={{ fontSize: '0.68rem', color: '#9ca3af', marginRight: '4px' }}>[{tarea.hora_inicio?.slice(0, 5)}]</span>
                    {tarea.descripcion}
                </div>
            )}
        </div>
    );
};

// ─── Componente Principal ──────────────────────────────────────────────────────
const PlannerGrid = ({ dias: initialDias, onTaskUpdated }) => {
    const [updating, setUpdating] = useState(null);
    const [diasLocales, setDiasLocales] = useState([]);

    useEffect(() => { setDiasLocales(initialDias || []); }, [initialDias]);

    const handleCompletarTarea = async (tarea) => {
        setUpdating(tarea.id);
        const nuevoEstado = tarea.estado === 'Finalizado' ? 'Pendiente' : 'Finalizado';
        try {
            const res = await api.put(`/api/tareas/${tarea.id}`, { estado: nuevoEstado });
            if (res.data.success) {
                editarTareaOptimista(tarea.dia_id, tarea.id, tarea.descripcion, nuevoEstado);
                onTaskUpdated();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Error al completar");
        } finally {
            setUpdating(null);
        }
    };

    const inyectarTareaOptimista = (diaId, nuevaTarea) => {
        setDiasLocales(prev => prev.map(dia =>
            dia.id === diaId ? { ...dia, tareas: [...(dia.tareas || []), nuevaTarea] } : dia
        ));
    };

    const editarTareaOptimista = (diaId, tareaId, nuevaDesc, nuevoEstado = null) => {
        setDiasLocales(prev => prev.map(dia =>
            dia.id === diaId
                ? { ...dia, tareas: dia.tareas.map(t => t.id === tareaId ? { ...t, descripcion: nuevaDesc, estado: nuevoEstado ?? t.estado } : t) }
                : dia
        ));
    };

    const eliminarTareaOptimista = (diaId, tareaId) => {
        setDiasLocales(prev => prev.map(dia =>
            dia.id === diaId
                ? { ...dia, tareas: dia.tareas.filter(t => t.id !== tareaId) }
                : dia
        ));
        onTaskUpdated();
    };

    const now = new Date();
    const hoyStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    const calcularExecLock = (dias, diaActualIdx) => {
        for (let i = 0; i < diaActualIdx; i++) {
            const prevDia = dias[i];
            const hayPendientes = prevDia.tareas?.some(t => t.estado !== 'Finalizado');
            if (hayPendientes) return true;
        }
        return false;
    };

    return (
        <div>
            {/* Tip fin de semana */}
            {(() => {
                const diaSemana = new Date().getDay();
                if (diaSemana === 0 || diaSemana === 6) {
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.2rem' }}>📅</span>
                            <div style={{ fontSize: '0.82rem', color: '#14532d' }}>
                                <strong>¡Es fin de semana!</strong> El momento ideal para planificar tus batallas de la próxima semana.
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            <style>{`
                .planner-row-container {
                    scroll-snap-type: x mandatory;
                    -webkit-overflow-scrolling: touch;
                    padding-bottom: 12px !important;
                }
                .planner-row-container::-webkit-scrollbar { height: 5px; }
                .planner-row-container::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
                .day-column { scroll-snap-align: center; min-width: 265px !important; margin: 0 4px; }
                @media (min-width: 900px) {
                    .planner-row-container { scroll-snap-type: none; overflow-x: visible; }
                    .day-column { min-width: 180px !important; margin: 0; }
                }
                /* Días bloqueados: apagados como niebla */
                .day-locked-col {
                    filter: grayscale(30%);
                }
            `}</style>

            <div className="row flex-nowrap overflow-auto px-1 shadow-sm rounded-3 planner-row-container">
                {diasLocales.map((dia, idx) => {
                    const inThePast = dia.fecha_exacta < hoyStr;
                    const isToday = dia.fecha_exacta === hoyStr;
                    const executionLocked = calcularExecLock(diasLocales, idx);

                    // Un día está visualmente "bloqueado" si dias futuro con tarjetas pendientes de dias previos
                    const dayIsLocked = executionLocked && !inThePast;

                    return (
                        <div key={dia.id} className={`col flex-grow-1 day-column${dayIsLocked ? ' day-locked-col' : ''}`}>
                            <div className="card h-100 border-0 shadow-sm" style={{
                                opacity: inThePast ? 0.6 : dayIsLocked ? 0.55 : 1,
                                pointerEvents: inThePast ? 'none' : 'auto',
                                transition: 'opacity 0.3s',
                                // Fondo rayado sutil para días bloqueados
                                background: dayIsLocked
                                    ? 'repeating-linear-gradient(135deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px)'
                                    : undefined
                            }}>
                                {/* ── Header de día ── */}
                                <div style={{
                                    padding: '10px 12px',
                                    background: inThePast
                                        ? '#94a3b8'
                                        : dayIsLocked
                                        ? '#cbd5e1'   // gris suave para bloqueados
                                        : '#fff',
                                    borderBottom: '1px solid #f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {/* Punto "Hoy" en lugar de fondo verde */}
                                        {isToday && (
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                background: '#2563eb',
                                                display: 'inline-block',
                                                boxShadow: '0 0 0 3px #bfdbfe',
                                                flexShrink: 0
                                            }} />
                                        )}
                                        <span style={{
                                            fontWeight: '800',
                                            fontSize: '0.85rem',
                                            color: inThePast ? '#fff'
                                                : dayIsLocked ? '#64748b'
                                                : isToday ? '#1d4ed8'
                                                : '#0f172a',
                                        }}>
                                            {dia.nombre_dia}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <small style={{
                                            fontSize: '0.7rem',
                                            color: inThePast ? '#e2e8f0' : '#94a3b8',
                                            fontWeight: '500'
                                        }}>
                                            ({dia.fecha_exacta?.substring(5)})
                                        </small>
                                        {inThePast && dia.tareas?.some(t => t.estado !== 'Finalizado') && (
                                            <span style={{ fontSize: '0.75rem' }}>❌</span>
                                        )}
                                    </div>
                                </div>

                                {/* ── Cuerpo del día ── */}
                                <div className="card-body p-2 d-flex flex-column gap-2" style={{ backgroundColor: '#fdfdfd' }}>
                                    {dayIsLocked ? (
                                        /* Vista especial para días bloqueados */
                                        <div style={{ textAlign: 'center', padding: '20px 8px' }}>
                                            <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>🔒</div>
                                            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, lineHeight: 1.4, fontStyle: 'italic' }}>
                                                Completa el día anterior para descubrir este día
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {dia.tareas?.length > 0 ? (
                                                dia.tareas.map(tarea => (
                                                    <TareaCard
                                                        key={tarea.id}
                                                        tarea={tarea}
                                                        diaId={dia.id}
                                                        executionLocked={executionLocked}
                                                        inThePast={inThePast}
                                                        onComplete={handleCompletarTarea}
                                                        onDelete={eliminarTareaOptimista}
                                                        onEdit={editarTareaOptimista}
                                                        isUpdating={updating === tarea.id}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center text-muted fst-italic p-2 small">
                                                    Lienzo en blanco
                                                </div>
                                            )}

                                            {!inThePast && (
                                                <AddTaskInline diaId={dia.id} onTareaAgregada={inyectarTareaOptimista} />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlannerGrid;
