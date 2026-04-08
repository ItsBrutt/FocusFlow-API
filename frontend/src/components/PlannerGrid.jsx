import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const HORAS_POR_BLOQUE = {
    'Madrugada': ['00:00','01:00','02:00','03:00','04:00','05:00'],
    'Mañana':    ['06:00','07:00','08:00','09:00','10:00','11:00'],
    'Tarde':     ['12:00','13:00','14:00','15:00','16:00','17:00'],
    'Noche':     ['18:00','19:00','20:00','21:00','22:00','23:00']
};

// ─── Subcomponente: Añadir Tarea Inline ───────────────────────────────────────
const AddTaskInline = ({ diaId, onTareaAgregada }) => {
    const [text, setText] = useState('');
    const [categoria, setCategoria] = useState('');
    const [bloque, setBloque] = useState('Mañana');
    const [hora, setHora] = useState('10:00');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!HORAS_POR_BLOQUE[bloque].includes(hora)) {
            setHora(HORAS_POR_BLOQUE[bloque][0]);
        }
    }, [bloque, hora]);

    const handleKeyDown = async (e) => {
        if (e.key === 'Enter' && text.trim() !== '') {
            e.preventDefault();
            setLoading(true);
            try {
                const tag = categoria.trim() === '' ? 'Backend' : categoria;
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
                }
            } catch (err) {
                alert(err.response?.data?.message || "Error al crear la tarea");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="mt-auto pt-2 d-flex flex-column gap-2 border-top mt-1">
            <div className="d-flex flex-column gap-1">
                <input
                    type="text"
                    list="categorias-list"
                    className="form-control form-control-sm border-0 border-bottom bg-transparent shadow-none px-1 fw-bold"
                    style={{ fontSize: '0.78rem', color: '#0d6efd' }}
                    placeholder="Categoría (ej: Aprender)"
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    disabled={loading}
                />
                <datalist id="categorias-list">
                    <option value="Backend" />
                    <option value="React" />
                    <option value="Entrenamiento" />
                    <option value="Meditacion" />
                    <option value="Lectura" />
                    <option value="Inglés" />
                </datalist>

                <div className="d-flex gap-1 w-100">
                    <select
                        className="form-select form-select-sm border-0 border-bottom bg-transparent shadow-none px-1 fw-bold flex-fill"
                        style={{ fontSize: '0.73rem', cursor: 'pointer', color: '#7c3aed', paddingRight: '1rem' }}
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
                        className="form-select form-select-sm border-0 border-bottom bg-transparent shadow-none px-1 fw-bold flex-fill text-center"
                        style={{ fontSize: '0.73rem', cursor: 'pointer', color: '#0f172a', paddingRight: '1rem', appearance: 'auto' }}
                        value={hora}
                        onChange={e => setHora(e.target.value)}
                        disabled={loading}
                    >
                        {HORAS_POR_BLOQUE[bloque].map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                </div>
            </div>
            <input
                type="text"
                className="form-control form-control-sm border-0 border-bottom bg-transparent shadow-none px-1"
                placeholder={loading ? 'Guardando...' : '+ Define acción y Enter'}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{ fontSize: '0.85rem', color: '#212529' }}
            />
        </div>
    );
};

// ─── Subcomponente: Tarjeta de Tarea con edición y borrado ────────────────────
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

    const cardClass = isDone
        ? 'border-success bg-light-success text-success'
        : missedTask
        ? 'border-danger bg-light text-danger opacity-75'
        : 'border-light bg-white shadow-sm';

    return (
        <div className={`p-2 rounded border ${cardClass}`} style={{ fontSize: '0.9rem', transition: '0.2s' }}>
            <div className="fw-bold mb-1 d-flex justify-content-between align-items-center gap-1">
                <span className="badge rounded-pill" style={{
                    fontSize: '0.7rem', background: isDone ? '#198754' : '#0d6efd', color: '#fff'
                }}>{tarea.categoria}</span>
                <div className="d-flex align-items-center gap-1 ms-auto">
                    {isUpdating && <span className="spinner-border spinner-border-sm text-primary" />}
                    {isDone  && <span>✅</span>}
                    {missedTask && <span>⚠️</span>}
                    {/* Botones CRUD - solo si no es pasado y no está hecho */}
                    {!isDone && !inThePast && (
                        <>
                            <button
                                className="btn btn-link btn-sm p-0 text-muted"
                                style={{ fontSize: '0.7rem' }}
                                onClick={() => setEditMode(true)}
                                title="Editar"
                            >✏️</button>
                            <button
                                className="btn btn-link btn-sm p-0 text-danger"
                                style={{ fontSize: '0.7rem' }}
                                onClick={handleDelete}
                                disabled={deleting}
                                title="Eliminar"
                            >{deleting ? '...' : '🗑️'}</button>
                        </>
                    )}
                </div>
            </div>

            {editMode ? (
                <input
                    autoFocus
                    type="text"
                    className="form-control form-control-sm mt-1"
                    style={{ fontSize: '0.85rem', color: '#212529', background: '#fff' }}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditMode(false); }}
                />
            ) : (
                <div
                    className={`lh-sm ${isDone ? 'text-decoration-line-through' : ''}`}
                    style={{ cursor: (!inThePast && !executionLocked) || isDone ? 'pointer' : 'default' }}
                    onClick={() => {
                        if ((!inThePast && !executionLocked && !isUpdating) || (isDone && !isUpdating)) {
                            onComplete(tarea);
                        }
                    }}
                >
                    <span style={{ fontSize: '0.7rem', color: '#6c757d', marginRight: '4px' }}>[{tarea.hora_inicio?.slice(0,5)}]</span>
                    {tarea.descripcion}
                </div>
            )}
        </div>
    );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
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
        onTaskUpdated(); // Que el progress recalcule
    };

    // ─── Fecha Local (no UTC) para evitar bug de zona horaria ───────────────────
    const now = new Date();
    const hoyStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    // Calcular si un día tiene ejecución bloqueada (días anteriores tienen tareas pendientes)
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
            {/* Tip de planificación del fin de semana */}
            {(() => {
                const diaSemana = new Date().getDay(); // 0=Dom, 6=Sab
                if (diaSemana === 0 || diaSemana === 6) {
                    return (
                        <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3" style={{ borderLeft: '4px solid #198754' }}>
                            <span style={{ fontSize: '1.4rem' }}>📅</span>
                            <div>
                                <strong>¡Es fin de semana!</strong> El momento ideal para planificar tus batallas de la próxima semana sin interrupciones. Añade tus tareas a cada día y llega el Lunes con el mapa claro.
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            <style>{`
                /* Scroll behavior app-like para columnas */
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
            `}</style>
            
            <div className="row flex-nowrap overflow-auto px-1 shadow-sm rounded-3 planner-row-container">
                {diasLocales.map((dia, idx) => {
                    const inThePast = dia.fecha_exacta < hoyStr;
                    const isToday = dia.fecha_exacta === hoyStr;
                    const executionLocked = calcularExecLock(diasLocales, idx);

                    const containerStyle = inThePast ? { opacity: 0.65, pointerEvents: 'none' } : {};

                    let headerIcon = '';
                    if (inThePast && dia.tareas?.some(t => t.estado !== 'Finalizado')) headerIcon = '❌';
                    else if (executionLocked && !inThePast) headerIcon = '🔒';
                    else if (isToday) headerIcon = '📍';

                    const headerColor = headerIcon === '❌'
                        ? 'bg-danger bg-opacity-75'
                        : executionLocked && !inThePast
                        ? 'bg-secondary'
                        : isToday
                        ? 'bg-success'
                        : 'bg-primary';

                    return (
                        <div key={dia.id} className="col flex-grow-1 day-column">
                            <div className="card h-100 border-0 shadow-sm" style={containerStyle}>
                                <div className={`card-header text-center fw-bold text-white ${headerColor}`}>
                                    {dia.nombre_dia}{' '}
                                    <small className="fw-normal" style={{ fontSize: '0.74rem' }}>({dia.fecha_exacta?.substring(5)})</small>
                                    {headerIcon && <span className="ms-2">{headerIcon}</span>}
                                </div>

                                <div className="card-body p-2 d-flex flex-column gap-2" style={{ backgroundColor: '#fdfdfd' }}>
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
                                            {executionLocked && !inThePast
                                                ? '🔒 Completa el día anterior primero'
                                                : 'Lienzo en blanco'}
                                        </div>
                                    )}

                                    {/* Añadir tarea: libre en cualquier día (no en el pasado) */}
                                    {!inThePast && (
                                        <AddTaskInline diaId={dia.id} onTareaAgregada={inyectarTareaOptimista} />
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
