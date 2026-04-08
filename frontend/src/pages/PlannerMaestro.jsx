import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';

const BLOQUES = [
    { key: 'Madrugada', emoji: '🌙', horas: '00–06' },
    { key: 'Mañana',    emoji: '☀️', horas: '06–12' },
    { key: 'Tarde',     emoji: '🌤️', horas: '12–18' },
    { key: 'Noche',     emoji: '🌆', horas: '18–24' },
];

const HORAS_POR_BLOQUE = {
    'Madrugada': ['00:00','01:00','02:00','03:00','04:00','05:00'],
    'Mañana':    ['06:00','07:00','08:00','09:00','10:00','11:00'],
    'Tarde':     ['12:00','13:00','14:00','15:00','16:00','17:00'],
    'Noche':     ['18:00','19:00','20:00','21:00','22:00','23:00']
};

// Tareas inline manejadas dentro del grid principal

// Progreso de objetivos (barra superior)
const BarraProgreso = ({ semana }) => {
    const objs = {};
    semana.forEach(dia => {
        (dia.objetivos || []).forEach(obj => {
            if (!objs[obj.oa_id]) objs[obj.oa_id] = { ...obj, done: 0, total: 0 };
            BLOQUES.forEach(b => {
                (obj.bloques?.[b.key] || []).forEach(t => {
                    objs[obj.oa_id].total++;
                    if (t.estado === 'Finalizado') objs[obj.oa_id].done++;
                });
            });
        });
    });
    const list = Object.values(objs);
    if (!list.length) return null;

    return (
        <div className="progreso-container" style={{
            display: 'flex', gap: '16px',
            background: '#fff', borderRadius: '12px',
            padding: '12px 16px', marginBottom: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            WebkitOverflowScrolling: 'touch'
        }}>
            {list.map(obj => {
                const pctSem = obj.total > 0 ? Math.round((obj.done / obj.total) * 100) : 0;
                const pctMes = parseFloat(obj.om_progreso || 0);
                const pctAno = parseFloat(obj.oa_progreso || 0);
                return (
                    <div key={obj.oa_id} className="progreso-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: obj.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Nombre */}
                            <span style={{
                                fontSize: '0.78rem', fontWeight: '700', color: '#1e293b',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                display: 'block', marginBottom: '5px'
                            }}>{obj.titulo}</span>
                            {/* Barra triple: año (fondo) → mes (medio) → semana (frente) */}
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                                {/* Progreso anual: fondo tenue */}
                                <div style={{ position: 'absolute', left: 0, top: 0, width: `${pctAno}%`, height: '100%', background: obj.color, opacity: 0.2, transition: '0.5s' }} />
                                {/* Progreso mensual: medio */}
                                <div style={{ position: 'absolute', left: 0, top: 0, width: `${pctMes}%`, height: '100%', background: obj.color, opacity: 0.5, transition: '0.5s' }} />
                                {/* Progreso semanal: sólido */}
                                <div style={{ position: 'absolute', left: 0, top: 0, width: `${pctSem * (pctMes / 100 || 1) * 0.25 + pctMes * 0.75}%`, height: '100%', background: obj.color, opacity: 0 }} />
                                {/* Marcador semanal como dot */}
                                {pctSem > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '-1px',
                                        left: `calc(${pctMes}% - 4px)`,
                                        width: '8px', height: '8px',
                                        background: obj.color,
                                        borderRadius: '50%',
                                        boxShadow: `0 0 0 2px ${obj.color}44`
                                    }} />
                                )}
                            </div>
                            {/* Labels */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.67rem', color: '#94a3b8' }}>
                                    Sem: <strong style={{ color: pctSem === 100 ? '#22c55e' : '#475569' }}>{pctSem}%</strong>
                                </span>
                                <span style={{ fontSize: '0.67rem', color: '#94a3b8' }}>
                                    Mes: <strong style={{ color: obj.color }}>{pctMes.toFixed(0)}%</strong>
                                </span>
                                <span style={{ fontSize: '0.67rem', color: '#94a3b8' }}>
                                    Año: <strong style={{ color: obj.color }}>{pctAno.toFixed(0)}%</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Página principal
const PlannerMaestro = () => {
    const [semana, setSemana]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [fechas, setFechas]     = useState({ lunes: '', viernes: '' });
    const [actualizando, setAct]  = useState(null);
    const [diaActivo, setDiaAct]  = useState(0); // para mobile

    useEffect(() => { fetchPlanner(); }, []);

    const fetchPlanner = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/planner/semana');
            if (res.data.success) {
                setSemana(res.data.data.semana || []);
                setFechas({ lunes: res.data.data.lunes, viernes: res.data.data.viernes });
                // Auto-seleccionar el día de hoy
                const now = new Date();
                const hoy = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                const idx = (res.data.data.semana || []).findIndex(d => d.fecha_exacta === hoy);
                if (idx >= 0) setDiaAct(idx);
            }
        } catch {}
        finally { setLoading(false); }
    };

    const handleComplete = async (tarea) => {
        setAct(tarea.id);
        const nuevoEstado = tarea.estado === 'Finalizado' ? 'Pendiente' : 'Finalizado';
        try {
            await api.put(`/api/tareas/${tarea.id}`, { estado: nuevoEstado });
            fetchPlanner();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al completar');
        } finally { setAct(null); }
    };

    if (loading) return (
        <div><Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner-border text-primary mb-3" />
                    <p style={{ color: '#64748b' }}>Preparando tu semana...</p>
                </div>
            </div>
        </div>
    );

    const now = new Date();
    const hoyStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const tieneActividad = semana.some(d => (d.objetivos || []).some(o => BLOQUES.some(b => (o.bloques?.[b.key] || []).length > 0)));

    // Construir todos los objetivos agrupados por bloque para cada día
    const getCell = (diaIdx, bloqueKey) => {
        const dia = semana[diaIdx];
        if (!dia) return [];
        const items = [];
        (dia.objetivos || []).forEach(obj => {
            (obj.bloques?.[bloqueKey] || []).forEach(t => {
                items.push({ ...t, oa_id: obj.oa_id });
            });
        });
        return items;
    };

    const getAllObjetivos = () => {
        const map = {};
        semana.forEach(d => (d.objetivos || []).forEach(o => { map[o.oa_id] = o; }));
        return Object.values(map);
    };

    const agruparPorHora = (tareasArr) => {
        const grupos = {};
        tareasArr.forEach(t => {
            const h = t.hora_inicio ? t.hora_inicio.slice(0, 5) : '00:00';
            if (!grupos[h]) grupos[h] = [];
            grupos[h].push(t);
        });
        return Object.entries(grupos).sort(([h1], [h2]) => h1.localeCompare(h2));
    };

    return (
        <div style={{ background: '#f0f4f8', minHeight: '100vh' }}>
            <Navbar />

            <style>{`
                .planner-grid { display: none; }
                .planner-mobile { display: block; }
                
                /* Swipeable horizontales en mobile */
                .progreso-container { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 8px !important; }
                .progreso-item { flex: 0 0 250px !important; }
                
                /* Esconder scrollbar per-se en mobile para que se vea limpio */
                .progreso-container::-webkit-scrollbar { height: 4px; }
                .progreso-container::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
                
                @media (min-width: 900px) {
                    .planner-grid { display: block; }
                    .planner-mobile { display: none; }
                    
                    .progreso-container { flex-wrap: wrap; overflow-x: visible; padding-bottom: 12px !important; }
                    .progreso-item { flex: 1 1 220px !important; }
                }
                .day-col:hover { background: #f8fafc !important; }
                .task-item:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.08) !important; border-color: #cbd5e1 !important; }
                .task-item:active { transform: translateY(0); }
            `}</style>

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px 24px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            📅 Semana Actual
                        </h1>
                        <p style={{ color: '#64748b', margin: '2px 0 0', fontSize: '0.85rem' }}>
                            {fechas.lunes} → {fechas.viernes}
                        </p>
                    </div>
                    <Link to="/planificacion" className="d-none d-md-flex" style={{
                        background: '#1e293b', color: '#fff', borderRadius: '8px',
                        padding: '8px 16px', fontSize: '0.84rem', textDecoration: 'none',
                        alignItems: 'center', gap: '6px'
                    }}>
                        🗺️ Planificación
                    </Link>
                </div>

                {/* Barra de progreso de proyectos */}
                {tieneActividad && <BarraProgreso semana={semana} />}

                {!tieneActividad ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗺️</div>
                        <h3 style={{ fontWeight: '700', color: '#1e293b' }}>Tu semana está vacía</h3>
                        <p style={{ color: '#64748b', marginBottom: '20px' }}>
                            Ve a <strong>Planificación</strong> para crear objetivos e iniciar semanas.<br />
                            Las tareas planificadas aparecerán aquí.
                        </p>
                        <Link to="/planificacion" style={{
                            background: '#2563eb', color: '#fff', borderRadius: '8px',
                            padding: '10px 24px', textDecoration: 'none', fontWeight: '600'
                        }}>Ir a Planificación →</Link>
                    </div>
                ) : (<>

                    {/* ── DESKTOP: Cuadrícula días × bloques ── */}
                    <div className="planner-grid" style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>

                        {/* Cabecera de días */}
                        <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(5, 1fr)', borderBottom: '2px solid #e2e8f0' }}>
                            <div /> {/* Esquina vacía */}
                            {semana.map((dia, idx) => {
                                const isToday = dia.fecha_exacta === hoyStr;
                                const isPast  = dia.fecha_exacta < hoyStr;
                                const totalT = (dia.objetivos || []).reduce((a, o) => a + BLOQUES.reduce((b, bl) => b + (o.bloques?.[bl.key] || []).length, 0), 0);
                                const doneT  = (dia.objetivos || []).reduce((a, o) => a + BLOQUES.reduce((b, bl) => b + (o.bloques?.[bl.key] || []).filter(t => t.estado === 'Finalizado').length, 0), 0);
                                const pct = totalT > 0 ? Math.round(doneT / totalT * 100) : 0;

                                return (
                                    <div key={dia.fecha_exacta} style={{
                                        padding: '12px 10px',
                                        background: isToday ? '#1d4ed8' : isPast ? '#f1f5f9' : '#fff',
                                        color: isToday ? '#fff' : isPast ? '#94a3b8' : '#1e293b',
                                        borderLeft: '1px solid #f1f5f9',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            {dia.nombre_dia?.slice(0, 3)}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '1px' }}>
                                            {dia.fecha_exacta?.slice(5)}
                                        </div>
                                        {totalT > 0 && (
                                            <div style={{ marginTop: '6px' }}>
                                                <div style={{ height: '3px', background: isToday ? 'rgba(255,255,255,0.3)' : '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: isToday ? '#fff' : pct === 100 ? '#22c55e' : '#2563eb', transition: '0.4s' }} />
                                                </div>
                                                <div style={{ fontSize: '0.65rem', marginTop: '2px', opacity: 0.75 }}>{pct}%</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Filas de bloques */}
                        {BLOQUES.map((bloque, bIdx) => (
                            <div key={bloque.key} style={{ display: 'grid', gridTemplateColumns: '72px repeat(5, 1fr)', borderBottom: bIdx < BLOQUES.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                {/* Etiqueta del bloque */}
                                <div style={{
                                    padding: '10px 4px', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'flex-start',
                                    background: '#f8fafc', borderRight: '1px solid #e2e8f0',
                                    paddingTop: '12px'
                                }}>
                                    <span style={{ fontSize: '1.1rem' }}>{bloque.emoji}</span>
                                    <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                                        {bloque.key}
                                    </span>
                                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.6, alignItems: 'center' }}>
                                        {HORAS_POR_BLOQUE[bloque.key].map(h => (
                                            <span key={h} style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: '600' }}>{h}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Celdas para cada día */}
                                {semana.map((dia, dIdx) => {
                                    const isPast = dia.fecha_exacta < hoyStr;
                                    const isToday = dia.fecha_exacta === hoyStr;
                                    const tareas = getCell(dIdx, bloque.key);
                                    
                                    return (
                                        <div key={dIdx} className="day-col" style={{
                                            borderLeft: '1px solid #f1f5f9',
                                            padding: '8px',
                                            minHeight: '64px',
                                            background: isToday ? '#eff6ff' : isPast ? '#fafafa' : '#fff',
                                            transition: 'background 0.15s'
                                        }}>
                                            {tareas.length > 0 ? (
                                                agruparPorHora(tareas).map(([hora, tareasHora]) => (
                                                    <div key={hora} style={{ marginBottom: '8px' }}>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', letterSpacing: '0.05em' }}>
                                                            🕒 {hora}
                                                        </div>
                                                        {tareasHora.map((t, i) => {
                                                            const done = t.estado === 'Finalizado';
                                                            const obj = getAllObjetivos().find(o => o.oa_id === t.oa_id);
                                                            return (
                                                                <div key={i} className="task-item" onClick={() => handleComplete(t)} style={{
                                                                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                                                                    padding: '8px', marginBottom: '8px',
                                                                    background: done ? '#f8fafc' : '#fff',
                                                                    border: `1px solid ${done ? '#e2e8f0' : '#e2e8f0'}`,
                                                                    borderLeft: `4px solid ${done ? '#94a3b8' : obj?.color || '#2563eb'}`,
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    opacity: actualizando === t.id ? 0.5 : (done ? 0.7 : 1),
                                                                    boxShadow: done ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
                                                                }}>
                                                                    {/* Custom Checkbox */}
                                                                    <div style={{
                                                                        width: '18px', height: '18px', borderRadius: '4px',
                                                                        border: `2px solid ${done ? '#22c55e' : '#cbd5e1'}`,
                                                                        background: done ? '#22c55e' : 'transparent',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        flexShrink: 0, marginTop: '1px', transition: 'all 0.2s'
                                                                    }}>
                                                                        {done && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>}
                                                                    </div>
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <span style={{
                                                                            fontSize: '0.82rem', lineHeight: 1.3, display: 'block',
                                                                            fontWeight: done ? 'normal' : '500',
                                                                            color: done ? '#94a3b8' : '#1e293b',
                                                                            textDecoration: done ? 'line-through' : 'none',
                                                                            transition: 'all 0.2s'
                                                                        }}>{t.descripcion}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))
                                            ) : (
                                                <span style={{ fontSize: '0.68rem', color: '#e2e8f0', display: 'block', textAlign: 'center', paddingTop: '20px' }}>—</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* ── MOBILE: Un día a la vez con tabs ── */}
                    <div className="planner-mobile">
                        {/* Selector de día */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {semana.map((dia, idx) => {
                                const isToday = dia.fecha_exacta === hoyStr;
                                const isActive = idx === diaActivo;
                                return (
                                    <button key={idx} onClick={() => setDiaAct(idx)} style={{
                                        flexShrink: 0,
                                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                                        background: isActive ? '#1d4ed8' : isToday ? '#dbeafe' : '#fff',
                                        color: isActive ? '#fff' : isToday ? '#1d4ed8' : '#475569',
                                        fontWeight: isActive || isToday ? '700' : '500',
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        boxShadow: isActive ? '0 2px 8px rgba(29,78,216,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        {dia.nombre_dia?.slice(0, 2)} {dia.fecha_exacta?.slice(5)}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Bloques del día activo */}
                        {semana[diaActivo] && BLOQUES.map(bloque => {
                            const tareas = getCell(diaActivo, bloque.key);
                            return (
                                <div key={bloque.key} style={{
                                    background: '#fff', borderRadius: '12px', marginBottom: '10px',
                                    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                    border: '1px solid #f1f5f9'
                                }}>
                                    <div style={{
                                        padding: '10px 14px', background: '#f8fafc',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#475569' }}>
                                            {bloque.emoji} {bloque.key}
                                        </span>
                                        <div style={{ display: 'flex', gap: '6px', opacity: 0.6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '70%' }}>
                                            {HORAS_POR_BLOQUE[bloque.key].map(h => (
                                                <span key={h} style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '600' }}>{h.slice(0, 2)}h</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ padding: '10px 12px', minHeight: '48px' }}>
                                        {tareas.length > 0 ? agruparPorHora(tareas).map(([hora, tareasHora]) => (
                                            <div key={hora} style={{ marginBottom: '10px' }}>
                                                <div style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>
                                                    🕒 {hora}
                                                </div>
                                                {tareasHora.map((t, i) => {
                                                    const done = t.estado === 'Finalizado';
                                                    const obj = getAllObjetivos().find(o => o.oa_id === t.oa_id);
                                                    const isPast = semana[diaActivo]?.fecha_exacta < hoyStr;
                                                    return (
                                                        <div key={i} className="task-item" onClick={() => handleComplete(t)} style={{
                                                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                                                            padding: '12px', marginBottom: '8px',
                                                            borderRadius: '10px', border: `1px solid #e2e8f0`,
                                                            borderLeft: `4px solid ${done ? '#94a3b8' : obj?.color || '#2563eb'}`,
                                                            background: done ? '#f8fafc' : '#fff',
                                                            cursor: 'pointer',
                                                            opacity: actualizando === t.id ? 0.5 : (done ? 0.7 : 1),
                                                            boxShadow: done ? 'none' : '0 2px 4px rgba(0,0,0,0.04)',
                                                            transition: 'all 0.2s',
                                                        }}>
                                                            {/* Custom Checkbox Mobile */}
                                                            <div style={{
                                                                width: '20px', height: '20px', borderRadius: '5px',
                                                                border: `2px solid ${done ? '#22c55e' : '#cbd5e1'}`,
                                                                background: done ? '#22c55e' : 'transparent',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                flexShrink: 0, marginTop: '1px'
                                                            }}>
                                                                {done && <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>✓</span>}
                                                            </div>
                                                            <span style={{ fontSize: '0.9rem', fontWeight: done ? 'normal' : '500', color: done ? '#94a3b8' : '#1e293b', textDecoration: done ? 'line-through' : 'none' }}>
                                                                {t.descripcion}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )) : (
                                            <p style={{ color: '#cbd5e1', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>Sin tareas asignadas</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </>)}
            </div>
        </div>
    );
};

export default PlannerMaestro;
