import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import PlannerGrid from '../components/PlannerGrid';

// --- Componente de Edición Inline ---
const InlineEditable = ({ value, onSave, className = '', style = {}, placeholder = 'Escribe aquí...' }) => {
    const [editing, setEditing] = useState(false);
    const [hover, setHover] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

    const handleSave = () => {
        if (draft.trim() && draft !== value) onSave(draft.trim());
        setEditing(false);
    };

    if (editing) {
        return (
            <input
                ref={inputRef}
                type="text"
                className={`form-control form-control-sm d-inline-block`}
                style={{
                    minWidth: '200px', maxWidth: '380px',
                    color: '#212529',
                    backgroundColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.5)',
                    ...style
                }}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={handleSave}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
            />
        );
    }

    return (
        <span
            className={`${className}`}
            style={{ 
                cursor: 'pointer', 
                borderBottom: hover ? '1.5px dashed rgba(0,0,0,0.2)' : '1.5px solid transparent',
                transition: 'border-color 0.2s',
                ...style 
            }}
            title="Doble clic o lápiz para editar"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onDoubleClick={() => { setDraft(value); setEditing(true); }}
        >
            {value || placeholder}
            {hover && (
                <span 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setDraft(value); 
                        setEditing(true); 
                    }} 
                    style={{ marginLeft: '4px', cursor: 'pointer' }}
                    title="Editar"
                >
                    ✏️
                </span>
            )}
        </span>
    );
};

// --- Componente Principal ---
const ObjetivoView = () => {
    const { id } = useParams();
    const [objetivo, setObjetivo] = useState(null);
    const [mesSeleccionado, setMesSeleccionado] = useState(null);
    const [semanaSeleccionada, setSemanaSeleccionada] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initiating, setInitiating] = useState(null); // semana num a iniciar
    const [error, setError] = useState(null);

    useEffect(() => { fetchObjetivo(); }, [id]);

    const fetchObjetivo = async () => {
        setLoading(true);
        try {
            const resObj = await api.get(`/api/objetivos/${id}`);
            if (resObj.data.success) {
                const objData = resObj.data.data;
                setObjetivo(objData);

                if (objData.meses?.length > 0) {
                    const firstMes = objData.meses[0];
                    setMesSeleccionado(prev => {
                        const currentMes = prev ? (objData.meses.find(m => m.id === prev.id) || firstMes) : firstMes;
                        setSemanaSeleccionada(prevS => {
                            const semsExist = currentMes.semanas || [];
                            if (prevS) return semsExist.find(s => s.id === prevS.id) || semsExist[0] || null;
                            return semsExist[0] || null;
                        });
                        return currentMes;
                    });
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error al cargar.");
        } finally {
            setLoading(false);
        }
    };

    const handleRenameMonth = async (mesId, titulo) => {
        try {
            await api.put(`/api/objetivos/${id}/meses/${mesId}`, { titulo });
            fetchObjetivo();
        } catch { /* silencioso */ }
    };

    const handleRenameWeek = async (semanaId, titulo) => {
        try {
            await api.put(`/api/objetivos/${id}/semanas/${semanaId}`, { titulo });
            fetchObjetivo();
        } catch { /* silencioso */ }
    };

    const handleInitWeek = async (mesId, numeroSemana) => {
        setInitiating(numeroSemana);
        try {
            const res = await api.post(`/api/objetivos/${id}/meses/${mesId}/semanas/${numeroSemana}`);
            if (res.data.success) fetchObjetivo();
        } catch (err) {
            alert(err.response?.data?.message || "No puedes iniciar esta semana todavía.");
        } finally {
            setInitiating(null);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;
    if (error) return (
        <div><Navbar />
            <div className="container mt-4">
                <div className="alert alert-danger">{error}</div>
                <Link to="/dashboard" className="btn btn-outline-secondary">&larr; Volver</Link>
            </div>
        </div>
    );

    // Determina qué semana puede desbloquearse en este mes
    // Incluye validación cruzada de meses (Skill Tree cross-month bridge)
    const getNextUnlockableWeek = (mes, allMeses) => {
        const semanasActuales = mes.semanas || [];
        const cuenta = semanasActuales.length;
        if (cuenta >= 4) return null; // Todas las semanas ya iniciadas

        const nextNum = cuenta + 1;

        if (nextNum === 1 && mes.mes > 1) {
            // Para Semana 1 de un Mes N>1: La Semana 4 del mes anterior DEBE estar completada
            const mesAnterior = allMeses.find(m => m.mes === mes.mes - 1);
            const semana4anterior = mesAnterior?.semanas?.find(s => s.numero_semana === 4);
            if (!semana4anterior?.completada) return null; // 🔒 Mes anterior no conquistado
        }

        if (nextNum > 1) {
            // Para Semana 2,3,4: la semana anterior en el mismo mes debe estar completada
            const semanaPrevia = semanasActuales.find(s => s.numero_semana === nextNum - 1);
            if (!semanaPrevia?.completada) return null;
        }

        return nextNum;
    };

    return (
        <div style={{ background: '#f0f4f8', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px 40px' }}>
                <div className="mb-3 mt-3">
                    <Link to="/planificacion" className="text-decoration-none" style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    ← Planificación
                </Link>
                </div>
                
                <style>{`
                    .obj-view-header { padding: 20px 24px; margin-bottom: 20px; }
                    .obj-view-title { font-size: 1.4rem; }
                    .obj-view-desc { font-size: 0.9rem; }
                    .meses-list-container { flex-wrap: wrap; }
                    @media (max-width: 767px) {
                        .obj-view-header { padding: 12px 16px !important; margin-bottom: 12px !important; gap: 8px !important; }
                        .obj-view-title { font-size: 1.15rem !important; margin-bottom: 2px !important; line-height: 1.2 !important; }
                        .obj-view-desc { font-size: 0.78rem !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                        
                        /* Scroll horizontally for phases */
                        .meses-list-container { 
                            flex-wrap: nowrap !important; overflow-x: auto; 
                            padding-bottom: 8px !important; 
                            scroll-snap-type: x mandatory; 
                            -webkit-overflow-scrolling: touch;
                        }
                        .meses-list-container::-webkit-scrollbar { height: 4px; }
                        .meses-list-container::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
                        .mes-btn { 
                            flex: 0 0 160px !important; 
                            scroll-snap-align: center; 
                        }
                    }
                `}</style>

                {/* Header del Objetivo */}
                {objetivo && (
                    <div className="obj-view-header" style={{
                        background: '#fff', borderRadius: '14px',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                        border: '1px solid #f1f5f9',
                        borderTop: `4px solid ${objetivo.color || '#2563eb'}`,
                        padding: '20px 24px',
                        marginBottom: '20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
                    }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                {objetivo.color && <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: objetivo.color, flexShrink: 0 }} />}
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{objetivo.anio}</span>
                            </div>
                            <h2 className="obj-view-title" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>{objetivo.titulo}</h2>
                            <p className="obj-view-desc" style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>{objetivo.descripcion || 'Sin descripción.'}</p>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '160px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                                <span>Progreso total</span>
                                <span style={{ fontWeight: '700', color: objetivo.color || '#2563eb' }}>{objetivo.progreso_total}%</span>
                            </div>
                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', width: '160px' }}>
                                <div style={{ width: `${objetivo.progreso_total}%`, height: '100%', background: objetivo.color || '#2563eb', transition: '0.5s' }} />
                            </div>
                        </div>
                    </div>
                )}

                {objetivo?.meses?.length > 0 ? (
                    <div>
                        {/* ====== SELECTOR DE MESES ====== */}
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>FASES DEL PROYECTO</p>
                            <div className="meses-list-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {objetivo.meses.map(mes => {
                                    const isActive = mesSeleccionado?.id === mes.id;
                                    const pct = parseFloat(mes.progreso_total || 0);
                                    const color = objetivo.color || '#2563eb';
                                    return (
                                        <button key={mes.id} className="mes-btn" onClick={() => { setMesSeleccionado(mes); setSemanaSeleccionada(mes.semanas?.[0] || null); }}
                                            style={{
                                                flex: '1 1 140px', minWidth: '130px', maxWidth: '220px',
                                                padding: '10px 14px', border: isActive ? `2px solid ${color}` : '1px solid #e2e8f0',
                                                borderRadius: '10px', background: isActive ? '#fff' : '#f8fafc',
                                                cursor: 'pointer', textAlign: 'left',
                                                boxShadow: isActive ? `0 0 0 3px ${color}22` : 'none',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8' }}>MES {mes.mes}</span>
                                                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: isActive ? color : '#94a3b8' }}>{pct.toFixed(0)}%</span>
                                            </div>
                                            {isActive ? (
                                                <InlineEditable 
                                                    value={mes.titulo} 
                                                    onSave={t => handleRenameMonth(mes.id, t)} 
                                                    placeholder="Define el foco de este mes..."
                                                    style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1e293b' }} 
                                                />
                                            ) : (
                                                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', opacity: mes.titulo ? 1 : 0.6 }}>
                                                    {mes.titulo || 'Sin foco definido'}
                                                </span>
                                            )}
                                            <div style={{ height: '3px', background: '#e2e8f0', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: color, transition: '0.4s' }} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ====== SEMANAS DEL MES ACTIVO ====== */}
                        {mesSeleccionado && (() => {
                            const semanasIniciadas = mesSeleccionado.semanas || [];
                            const nextUnlock = getNextUnlockableWeek(mesSeleccionado, objetivo.meses);
                            const slots = [1, 2, 3, 4].map(n => ({
                                num: n,
                                semana: semanasIniciadas.find(s => s.numero_semana === n) || null
                            }));
                            const color = objetivo.color || '#2563eb';

                            return (
                                <div>
                                    <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>SEMANAS</p>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                        {slots.map(({ num, semana }) => {
                                            const isSelected = semanaSeleccionada?.id === semana?.id;
                                            const isWin = semana?.completada;
                                            const canUnlock = !semana && num === nextUnlock;
                                            const isLocked = !semana && !canUnlock;

                                            return (
                                                <div key={num} onClick={() => {
                                                    if (semana) setSemanaSeleccionada(semana);
                                                    if (canUnlock) handleInitWeek(mesSeleccionado.id, num);
                                                }} style={{
                                                    flex: '1 1 120px', minWidth: '110px', maxWidth: '160px',
                                                    padding: '12px 14px', borderRadius: '12px', textAlign: 'center',
                                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                                    border: isSelected ? `2px solid ${color}` : isWin ? '2px solid #22c55e' : canUnlock ? '2px dashed #22c55e' : '1px solid #e2e8f0',
                                                    background: isSelected ? '#fff' : isWin ? '#f0fdf4' : canUnlock ? '#f0fdf4' : isLocked ? '#f8fafc' : '#fff',
                                                    boxShadow: isSelected ? `0 0 0 3px ${color}22` : 'none',
                                                    opacity: isLocked ? 0.5 : 1,
                                                    transition: 'all 0.2s',
                                                }}>
                                                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '4px' }}>
                                                        {isWin ? '🏆' : canUnlock ? '🔓' : isLocked ? '🔒' : '📅'}
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isLocked ? '#94a3b8' : '#1e293b', display: 'block' }}>Semana {num}</span>
                                                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                                                        {canUnlock ? '¡Iniciar!' : isLocked ? 'Bloqueada' : `${semana.fecha_inicio?.slice(5)} - ${semana.fecha_fin?.slice(5)}`}
                                                    </span>
                                                    {initiating === num && <span style={{ fontSize: '0.68rem', color: '#22c55e' }}>Iniciando...</span>}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ====== PLANNER DE LA SEMANA SELECCIONADA ====== */}
                                    {semanaSeleccionada && (() => {
                                        const isWin = semanaSeleccionada.completada;
                                        return (
                                            <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                                                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isWin ? '🏆 SEMANA CONQUISTADA' : '🚀 PLANNER ACTIVO'}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                                            <InlineEditable
                                                                value={semanaSeleccionada.titulo || `Semana ${semanaSeleccionada.numero_semana}`}
                                                                onSave={t => handleRenameWeek(semanaSeleccionada.id, t)}
                                                                placeholder="Define el foco de esta semana..."
                                                                className="fw-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                        {semanaSeleccionada.fecha_inicio} → {semanaSeleccionada.fecha_fin}
                                                    </span>
                                                </div>
                                                <div style={{ padding: '16px' }}>
                                                    <PlannerGrid dias={semanaSeleccionada.dias} onTaskUpdated={fetchObjetivo} />
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        Este objetivo no tiene estructura de tiempo. Reinicia el proceso.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ObjetivoView;
