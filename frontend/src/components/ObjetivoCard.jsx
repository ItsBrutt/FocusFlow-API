import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

// ─── Modal de Edición ──────────────────────────────────────────────────────────
const EditarModal = ({ objetivo, onClose, onSaved }) => {
    const [titulo, setTitulo] = useState(objetivo.titulo);
    const [desc, setDesc] = useState(objetivo.descripcion || '');
    const [color, setColor] = useState(objetivo.color || '#0d6efd');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo.trim()) return;
        setLoading(true);
        try {
            await api.put(`/api/objetivos/${objetivo.id}/editar`, { titulo, descripcion: desc, color });
            onSaved({ ...objetivo, titulo: titulo.trim(), descripcion: desc.trim(), color });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <h4 style={{ fontWeight: '800', marginBottom: '20px', color: '#0f172a' }}>✏️ Editar Objetivo</h4>
                {error && <div className="alert alert-danger py-2 small">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Título</label>
                        <input type="text" className="form-control" value={titulo} onChange={e => setTitulo(e.target.value)} style={{ color: '#1e293b' }} required autoFocus />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Descripción</label>
                        <textarea className="form-control" rows="2" value={desc} onChange={e => setDesc(e.target.value)} style={{ color: '#1e293b', resize: 'none' }} />
                    </div>
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#475569' }}>Color</label>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '44px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Se verá en el Planner Semanal</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-outline-secondary btn-sm" disabled={loading}>Cancelar</button>
                        <button type="submit" className="btn btn-dark btn-sm fw-bold px-4" disabled={loading}>
                            {loading ? '...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── ObjetivoCard ──────────────────────────────────────────────────────────────
const ObjetivoCard = ({ objetivo: initial, onDelete }) => {
    const [objetivo, setObjetivo] = useState(initial);
    const [showEdit, setShowEdit] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const color = objetivo.color || '#0d6efd';
    const progresoPct = objetivo.meses?.length > 0
        ? (objetivo.meses.reduce((a, m) => a + parseFloat(m.progreso_total || 0), 0) / objetivo.meses.length).toFixed(1)
        : 0;

    const handleDelete = async () => {
        if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 4000); return; }
        setDeleting(true);
        try { await api.delete(`/api/objetivos/${objetivo.id}`); onDelete(objetivo.id); }
        catch (err) { alert(err.response?.data?.message || 'Error'); setDeleting(false); }
    };

    return (
        <>
            <style>{`
                .meses-container { flex-wrap: wrap; }
                .card-padding { padding: 18px 20px; }
                .card-title { font-size: 1.1rem; }
                @media (max-width: 767px) {
                    .card-padding { padding: 14px 16px !important; }
                    .card-title { font-size: 1rem !important; }
                    
                    /* Swipeable months on mobile */
                    .meses-container { 
                        flex-wrap: nowrap !important; overflow-x: auto; 
                        padding: 0 16px 14px !important; 
                        scroll-snap-type: x mandatory; 
                    }
                    .meses-container::-webkit-scrollbar { height: 4px; }
                    .meses-container::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
                    .mes-item { 
                        flex: 0 0 calc(50% - 8px) !important; 
                        min-width: 140px !important; 
                        scroll-snap-align: center; 
                    }
                }
            `}</style>
            
            <div style={{
                background: '#fff', borderRadius: '14px', marginBottom: '16px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden',
                border: '1px solid #f1f5f9',
                borderTop: `4px solid ${color}`,
                transition: 'box-shadow 0.2s',
            }}>
                <div className="card-padding" style={{ padding: '18px 20px' }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{
                                    background: color, color: '#fff', borderRadius: '6px',
                                    padding: '2px 8px', fontSize: '0.72rem', fontWeight: '700', flexShrink: 0
                                }}>{objetivo.anio}</span>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    fontSize: '0.72rem', borderRadius: '20px', padding: '2px 8px',
                                    background: objetivo.completado ? '#dcfce7' : '#fef9c3',
                                    color: objetivo.completado ? '#16a34a' : '#b45309', fontWeight: '600'
                                }}>
                                    {objetivo.completado ? '✅ Completado' : '⏳ En Progreso'}
                                </span>
                            </div>
                            <h4 className="card-title" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', lineHeight: 1.15 }}>
                                {objetivo.titulo}
                            </h4>
                            {objetivo.descripcion && (
                                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>{objetivo.descripcion}</p>
                            )}
                        </div>

                        {/* Acciones */}
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button onClick={() => setShowEdit(true)} style={{
                                padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '8px',
                                background: '#fff', cursor: 'pointer', fontSize: '0.8rem', color: '#475569'
                            }} title="Editar">✏️</button>
                            <button onClick={handleDelete} disabled={deleting} style={{
                                padding: '6px 10px', border: `1px solid ${confirmDel ? '#ef4444' : '#e2e8f0'}`,
                                borderRadius: '8px', background: confirmDel ? '#fef2f2' : '#fff',
                                cursor: 'pointer', fontSize: '0.8rem', color: confirmDel ? '#ef4444' : '#475569',
                                fontWeight: confirmDel ? '700' : 'normal',
                                transition: 'all 0.2s'
                            }} title={confirmDel ? 'Clic para confirmar eliminación' : 'Eliminar'}>
                                {deleting ? '...' : confirmDel ? '⚠️ ¿Seguro?' : '🗑️'}
                            </button>
                        </div>
                    </div>

                    {/* Barra de progreso global */}
                    <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                            <span>Progreso global</span>
                            <span style={{ fontWeight: '700', color }}>{progresoPct}%</span>
                        </div>
                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${progresoPct}%`, height: '100%', background: color, borderRadius: '3px', transition: '0.5s' }} />
                        </div>
                    </div>
                </div>

                {/* Meses: progreso timeline */}
                {objetivo.meses?.length > 0 && (
                    <div className="meses-container" style={{ padding: '0 20px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {objetivo.meses.map(mes => {
                            const pct = parseFloat(mes.progreso_total || 0);
                            return (
                                <div className="mes-item" key={mes.id} style={{ flex: '1 1 160px', minWidth: '140px', background: '#f8fafc', borderRadius: '8px', padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.73rem', fontWeight: '700', color: '#475569' }}>Mes {mes.mes}</span>
                                        <span style={{ fontSize: '0.7rem', color: pct > 0 ? color : '#94a3b8', fontWeight: '600' }}>{pct.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {mes.titulo || 'Sin título'}
                                    </div>
                                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: '0.4s' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* CTA: Ver planificación */}
                <Link to={`/planificacion/objetivo/${objetivo.id}`} style={{
                    display: 'block', textAlign: 'center', padding: '12px',
                    background: '#f8fafc', borderTop: '1px solid #f1f5f9',
                    color, textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem',
                    transition: 'background 0.15s',
                }}>
                    Planificar semanas →
                </Link>
            </div>

            {showEdit && <EditarModal objetivo={objetivo} onClose={() => setShowEdit(false)} onSaved={o => setObjetivo(o)} />}
        </>
    );
};

export default ObjetivoCard;
