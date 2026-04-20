import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axiosConfig';

const HORAS_POR_BLOQUE = {
    'Madrugada': ['00:00','01:00','02:00','03:00','04:00','05:00'],
    'Mañana':    ['06:00','07:00','08:00','09:00','10:00','11:00'],
    'Tarde':     ['12:00','13:00','14:00','15:00','16:00','17:00'],
    'Noche':     ['18:00','19:00','20:00','21:00','22:00','23:00']
};

// ── Feedback háptico suave (si el dispositivo lo soporta) ──────────────────────
const vibrate = (pattern = 50) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
};

// ─── Subcomponente: Añadir Tarea (Mobile-first) ────────────────────────────────
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
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [expanded]);

    const handleSave = useCallback(async () => {
        if (!text.trim()) return;
        setLoading(true);
        vibrate(30);
        try {
            const tag = categoria.trim() || 'General';
            const response = await api.post('/api/tareas', {
                dia_id: diaId,
                descripcion: text.trim(),
                categoria: tag,
                bloque_horario: bloque,
                hora_inicio: hora
            });
            if (response.data.success) {
                onTareaAgregada(diaId, response.data.data);
                setText('');
                setCategoria('');
                setExpanded(false);
                vibrate([30, 30, 60]); // confirmación
            }
        } catch (err) {
            alert(err.response?.data?.message || "Error al crear la tarea");
        } finally {
            setLoading(false);
        }
    }, [text, categoria, bloque, hora, diaId, onTareaAgregada]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
        if (e.key === 'Escape') { setExpanded(false); setText(''); }
    };

    const handleCancel = () => { setExpanded(false); setText(''); setCategoria(''); };

    return (
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
            <style>{`
                .add-task-form {
                    overflow: hidden;
                    max-height: 0;
                    opacity: 0;
                    transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease;
                }
                .add-task-form.open { max-height: 240px; opacity: 1; }
                .add-btn-ghost {
                    width: 100%;
                    border: 1.5px dashed #cbd5e1;
                    background: transparent;
                    border-radius: 10px;
                    /* Altura mínima de 44px para targets táctiles (Apple HIG) */
                    min-height: 44px;
                    padding: 6px 10px;
                    font-size: 0.82rem;
                    color: #94a3b8;
                    cursor: pointer;
                    text-align: center;
                    transition: border-color 0.2s, color 0.2s, background 0.2s;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                }
                .add-btn-ghost:active {
                    background: #eff6ff;
                    border-color: #2563eb;
                    color: #2563eb;
                    transform: scale(0.97);
                }
                .add-btn-ghost.cancel-btn {
                    border-color: #fca5a5;
                    color: #ef4444;
                }
                .add-btn-ghost.cancel-btn:active {
                    background: #fef2f2;
                }
                .save-btn-mobile {
                    width: 100%;
                    min-height: 42px;
                    border-radius: 10px;
                    border: none;
                    background: #2563eb;
                    color: #fff;
                    font-size: 0.88rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.15s, transform 0.1s;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                .save-btn-mobile:active { background: #1d4ed8; transform: scale(0.97); }
                .save-btn-mobile:disabled { background: #93c5fd; }
            `}</style>

            {/* Formulario expandible */}
            <div className={`add-task-form ${expanded ? 'open' : ''}`}>
                <div style={{
                    paddingBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px',
                    borderTop: '1px solid #f1f5f9', paddingTop: '10px'
                }}>
                    {/* Fila: Categoría */}
                    <input
                        type="text"
                        list="categorias-list"
                        className="form-control"
                        style={{ fontSize: '0.82rem', color: '#0d6efd', minHeight: '40px' }}
                        placeholder="Categoría (ej: Entrenamiento)"
                        value={categoria}
                        onChange={e => setCategoria(e.target.value)}
                        disabled={loading}
                    />
                    {/* Fila: Bloque + Hora */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <select
                            className="form-select"
                            style={{ fontSize: '0.78rem', color: '#7c3aed', minHeight: '40px', flex: 1 }}
                            value={bloque}
                            onChange={e => setBloque(e.target.value)}
                            disabled={loading}
                        >
                            <option value="Madrugada">🌙 Madrugada</option>
                            <option value="Mañana">☀️ Mañana</option>
                            <option value="Tarde">🌤️ Tarde</option>
                            <option value="Noche">🌆 Noche</option>
                        </select>
                        <select
                            className="form-select"
                            style={{ fontSize: '0.78rem', color: '#0f172a', minHeight: '40px', maxWidth: '90px' }}
                            value={hora}
                            onChange={e => setHora(e.target.value)}
                            disabled={loading}
                        >
                            {HORAS_POR_BLOQUE[bloque].map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>
                    {/* Descripción */}
                    <input
                        ref={inputRef}
                        type="text"
                        className="form-control"
                        placeholder={loading ? 'Guardando…' : 'Describe la acción concreta'}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        style={{ fontSize: '0.9rem', color: '#212529', minHeight: '42px' }}
                    />
                    {/* Botón guardar VISIBLE (mobile-friendly) */}
                    <button className="save-btn-mobile" onClick={handleSave} disabled={loading || !text.trim()}>
                        {loading ? (
                            <><span className="spinner-border spinner-border-sm" /> Guardando…</>
                        ) : (
                            <>✓ Guardar tarea</>
                        )}
                    </button>
                </div>
            </div>

            <datalist id="categorias-list">
                <option value="Backend" />
                <option value="React" />
                <option value="Javascript" />
                <option value="Frontend" />
                <option value="Diseño" />
                <option value="Entrenamiento" />
                <option value="Meditacion" />
                <option value="Lectura" />
                <option value="Inglés" />
                <option value="Freelance" />
                <option value="Salud" />
                <option value="Social" />
                <option value="General" />
            </datalist>

            {expanded ? (
                <button className="add-btn-ghost cancel-btn" onClick={handleCancel}>
                    ✕ Cancelar
                </button>
            ) : (
                <button className="add-btn-ghost" onClick={() => { setExpanded(true); vibrate(20); }}>
                    <span style={{ fontSize: '1rem' }}>+</span>
                    Añadir nueva acción
                </button>
            )}
        </div>
    );
};

// ─── Subcomponente: Tarjeta de Tarea con gestos táctiles ──────────────────────
const TareaCard = ({ tarea, diaId, executionLocked, inThePast, onComplete, onDelete, onEdit, isUpdating }) => {
    const [editMode, setEditMode] = useState(false);
    const [editText, setEditText] = useState(tarea.descripcion);
    const [deleting, setDeleting] = useState(false);
    const [swipeX, setSwipeX] = useState(0);       // Desplazamiento de swipe
    const [swipeActive, setSwipeActive] = useState(false);
    const [longPressActive, setLongPressActive] = useState(false);

    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const longPressTimer = useRef(null);
    const cardRef = useRef(null);

    const SWIPE_THRESHOLD = 72; // px para revelar el botón de borrar
    const isDone = tarea.estado === 'Finalizado';
    const missedTask = inThePast && !isDone;
    const canInteract = !isDone && !inThePast;

    // ── Long press para editar ───────────────────────────────────────────────
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        setSwipeActive(false);

        if (canInteract && !editMode) {
            longPressTimer.current = setTimeout(() => {
                vibrate([30, 20, 60]);
                setLongPressActive(true);
                setEditMode(true);
                setEditText(tarea.descripcion);
            }, 600);
        }
    };

    const handleTouchMove = (e) => {
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

        // Si hay movimiento vertical significativo, no es swipe horizontal
        if (dy > 10) {
            clearTimeout(longPressTimer.current);
            return;
        }

        clearTimeout(longPressTimer.current);

        // Swipe izquierda para borrar (solo si no está en edición y puede interactuar)
        if (canInteract && !editMode && dx < -8) {
            setSwipeActive(true);
            const bounded = Math.max(-SWIPE_THRESHOLD - 10, Math.min(0, dx));
            setSwipeX(bounded);
        }
    };

    const handleTouchEnd = () => {
        clearTimeout(longPressTimer.current);
        setLongPressActive(false);

        if (swipeActive) {
            if (swipeX <= -(SWIPE_THRESHOLD * 0.75)) {
                // Swipe suficiente → mantener abierto mostrando botón de borrar
                setSwipeX(-SWIPE_THRESHOLD);
            } else {
                // Swipe insuficiente → revertir
                setSwipeX(0);
                setSwipeActive(false);
            }
        }
    };

    const resetSwipe = () => { setSwipeX(0); setSwipeActive(false); };

    // ── Guardar edición ───────────────────────────────────────────────────────
    const handleSaveEdit = async () => {
        if (editText.trim() === tarea.descripcion) { setEditMode(false); return; }
        vibrate(30);
        try {
            await api.patch(`/api/tareas/${tarea.id}`, { descripcion: editText.trim() });
            onEdit(diaId, tarea.id, editText.trim());
        } catch { /* silencioso */ }
        setEditMode(false);
        setLongPressActive(false);
    };

    // ── Borrar ────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!window.confirm('¿Eliminar esta tarea?')) { resetSwipe(); return; }
        vibrate([40, 30, 80]);
        setDeleting(true);
        try {
            await api.delete(`/api/tareas/${tarea.id}`);
            onDelete(diaId, tarea.id);
        } catch { setDeleting(false); resetSwipe(); }
    };

    const cardBg     = isDone ? 'rgba(34, 197, 94, 0.1)' : missedTask ? 'rgba(245, 158, 11, 0.1)' : 'var(--bs-body-bg)';
    const cardBorder = isDone ? '#86efac' : missedTask ? '#fcd34d' : 'var(--bs-border-color)';
    const accentColor = isDone ? '#22c55e' : missedTask ? '#f59e0b' : '#2563eb';
    const textColor = isDone ? 'var(--bs-secondary-color)' : missedTask ? '#d97706' : 'var(--bs-body-color)';

    return (
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>

            {/* Fondo rojo de swipe-to-delete */}
            <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: SWIPE_THRESHOLD + 'px',
                background: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '10px',
                opacity: Math.min(1, Math.abs(swipeX) / SWIPE_THRESHOLD),
            }}>
                <span style={{ color: '#fff', fontSize: '1.2rem' }}>🗑️</span>
            </div>

            {/* Tarjeta principal (se desliza) */}
            <div
                ref={cardRef}
                style={{
                    padding: '10px 12px', borderRadius: '10px',
                    border: `1px solid ${cardBorder}`,
                    borderLeft: `3px solid ${accentColor}`,
                    background: cardBg,
                    fontSize: '0.88rem',
                    transition: swipeActive ? 'none' : 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s',
                    transform: `translateX(${swipeX}px)`,
                    opacity: isUpdating ? 0.6 : 1,
                    cursor: canInteract ? 'pointer' : 'default',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: 'pan-y', // dejar scroll vertical libre
                    position: 'relative',
                    zIndex: 1,
                    // Pulso visual de long press
                    boxShadow: longPressActive ? `0 0 0 3px ${accentColor}44` : 'none',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={resetSwipe} // tap simple cancela el swipe si estaba abierto
            >
                {/* Fila superior: badge + acciones desktop */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <span style={{
                        padding: '2px 8px', borderRadius: '20px',
                        fontSize: '0.68rem', fontWeight: '700',
                        background: isDone ? '#dcfce7' : '#dbeafe',
                        color: isDone ? '#15803d' : '#1d4ed8',
                    }}>
                        {tarea.categoria}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {isUpdating && <span className="spinner-border spinner-border-sm text-primary" style={{ width: '13px', height: '13px' }} />}
                        {isDone && <span>✅</span>}
                        {missedTask && <span>⚠️</span>}
                        {/* Desktop: botones de editar/borrar */}
                        {canInteract && !editMode && (
                            <div className="d-none d-md-flex" style={{ gap: '4px' }}>
                                <button
                                    className="btn btn-link btn-sm p-0 text-muted"
                                    style={{ fontSize: '0.7rem', minWidth: '28px', minHeight: '28px' }}
                                    onClick={(e) => { e.stopPropagation(); setEditMode(true); setEditText(tarea.descripcion); }}
                                    title="Editar"
                                >✏️</button>
                                <button
                                    className="btn btn-link btn-sm p-0 text-danger"
                                    style={{ fontSize: '0.7rem', minWidth: '28px', minHeight: '28px' }}
                                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                    disabled={deleting}
                                    title="Eliminar"
                                >{deleting ? '…' : '🗑️'}</button>
                            </div>
                        )}
                        {/* Mobile: hint de long press */}
                        {canInteract && !editMode && (
                            <span className="d-md-none" style={{ fontSize: '0.6rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                                ✎
                            </span>
                        )}
                    </div>
                </div>

                {/* Cuerpo: edición o texto */}
                {editMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                        <input
                            autoFocus
                            type="text"
                            className="form-control"
                            style={{ fontSize: '0.88rem', color: '#212529', background: '#fff', minHeight: '40px' }}
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditMode(false); }}
                        />
                        {/* Botones de confirmación visibles en mobile */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                                style={{
                                    flex: 1, minHeight: '40px', borderRadius: '8px', border: 'none',
                                    background: '#22c55e', color: '#fff', fontWeight: '700', fontSize: '0.85rem',
                                    cursor: 'pointer', touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                                onClick={handleSaveEdit}
                            >
                                ✓ Guardar
                            </button>
                            <button
                                style={{
                                    flex: 1, minHeight: '40px', borderRadius: '8px',
                                    border: '1px solid #e2e8f0', background: '#f8fafc',
                                    color: '#64748b', fontWeight: '600', fontSize: '0.85rem',
                                    cursor: 'pointer', touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                                onClick={() => setEditMode(false)}
                            >
                                ✕ Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className={isDone ? 'text-decoration-line-through' : ''}
                        style={{
                            fontSize: '0.84rem',
                            color: textColor,
                            lineHeight: 1.4,
                            // Área de toque amplia
                            paddingTop: '2px', paddingBottom: '2px',
                        }}
                        onClick={(e) => {
                            if (swipeX !== 0) { resetSwipe(); return; }
                            if ((!inThePast && !executionLocked && !isUpdating) || (isDone && !isUpdating)) {
                                vibrate(isDone ? [20, 10] : 30);
                                onComplete(tarea);
                            }
                        }}
                    >
                        <span style={{ fontSize: '0.67rem', color: '#9ca3af', marginRight: '4px' }}>
                            [{tarea.hora_inicio?.slice(0, 5)}]
                        </span>
                        {tarea.descripcion}
                    </div>
                )}

                {/* Hint mobile: instrucción de gestos */}
                {canInteract && !editMode && swipeX === 0 && (
                    <div className="d-md-none" style={{
                        marginTop: '4px',
                        fontSize: '0.6rem',
                        color: '#e2e8f0',
                        textAlign: 'right',
                        fontStyle: 'italic',
                    }}>
                        mantén para editar · desliza para borrar
                    </div>
                )}
            </div>

            {/* Botón de borrar revelado por swipe (tap para confirmar) */}
            {swipeX <= -SWIPE_THRESHOLD * 0.75 && (
                <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0,
                    width: SWIPE_THRESHOLD + 'px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2,
                }}>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                            background: 'transparent', border: 'none',
                            width: '100%', height: '100%',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem',
                            touchAction: 'manipulation',
                        }}
                    >
                        {deleting ? '…' : '🗑️'}
                    </button>
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
            if (prevDia.tareas?.some(t => t.estado !== 'Finalizado')) return true;
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
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 14px', background: '#f0fdf4',
                            border: '1px solid #86efac', borderRadius: '10px', marginBottom: '12px'
                        }}>
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
                .day-column { scroll-snap-align: center; min-width: 280px !important; margin: 0 4px; }
                @media (min-width: 900px) {
                    .planner-row-container { scroll-snap-type: none; overflow-x: visible; }
                    .day-column { min-width: 180px !important; margin: 0; }
                }
                .day-locked-col { filter: grayscale(25%); }
            `}</style>

            <div className="row flex-nowrap overflow-auto px-1 shadow-sm rounded-3 planner-row-container">
                {diasLocales.map((dia, idx) => {
                    const inThePast = dia.fecha_exacta < hoyStr;
                    const isToday   = dia.fecha_exacta === hoyStr;
                    const executionLocked = calcularExecLock(diasLocales, idx);
                    const dayIsLocked     = executionLocked && !inThePast;

                    return (
                        <div key={dia.id} className={`col flex-grow-1 day-column${dayIsLocked ? ' day-locked-col' : ''}`}>
                            <div className="card h-100 border-0 shadow-sm" style={{
                                opacity: inThePast ? 0.6 : dayIsLocked ? 0.6 : 1,
                                pointerEvents: inThePast ? 'none' : 'auto',
                                transition: 'opacity 0.3s',
                                background: dayIsLocked
                                    ? 'repeating-linear-gradient(135deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px)'
                                    : undefined
                            }}>
                                {/* ── Header ── */}
                                <div style={{
                                    padding: '10px 12px',
                                    background: inThePast ? 'var(--bs-secondary-bg)' : dayIsLocked ? 'var(--bs-tertiary-bg)' : 'var(--bs-body-bg)',
                                    borderBottom: '1px solid var(--bs-border-color)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {isToday && (
                                            <span style={{
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                background: '#2563eb', display: 'inline-block',
                                                boxShadow: '0 0 0 3px #bfdbfe', flexShrink: 0
                                            }} />
                                        )}
                                        <span style={{
                                            fontWeight: '800', fontSize: '0.85rem',
                                            color: inThePast ? '#fff' : dayIsLocked ? '#64748b' : isToday ? '#1d4ed8' : '#0f172a',
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
                                            {dia.fecha_exacta?.substring(5)}
                                        </small>
                                        {inThePast && dia.tareas?.some(t => t.estado !== 'Finalizado') && (
                                            <span style={{ fontSize: '0.75rem' }}>❌</span>
                                        )}
                                    </div>
                                </div>

                                {/* ── Cuerpo ── */}
                                <div className="card-body p-2 d-flex flex-column gap-2" style={{ backgroundColor: 'var(--bs-card-bg)' }}>
                                    {/* Aviso de bloqueo (solo ejecución) */}
                                    {dayIsLocked && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 10px', borderRadius: '7px',
                                            background: '#fef9c3', border: '1px solid #fde68a',
                                            fontSize: '0.7rem', color: '#92400e', fontStyle: 'italic'
                                        }}>
                                            🔒 Puedes planificar, pero completa el día anterior para ejecutar
                                        </div>
                                    )}

                                    {/* Tareas */}
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

                                    {/* Añadir tarea: disponible para días presentes y futuros */}
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
