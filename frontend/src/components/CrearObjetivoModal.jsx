import { useState } from 'react';
import api from '../api/axiosConfig';

const CrearObjetivoModal = ({ show, onClose, onObjetivoCreated, onObjetivoCreado }) => {
    const _onCreated = onObjetivoCreated || onObjetivoCreado || (() => {});
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        anio: new Date().getFullYear(),
        cantidad_meses: 3,
        color: '#0d6efd'   // Color identificativo del objetivo
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!show) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/api/objetivos', formData);
            if (response.data.success) {
                // Notificamos al padre para actualizar su estado y limpiar
                _onCreated();
                setFormData({
                    ...formData,
                    titulo: '',
                    descripcion: ''
                });
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al intentar crear el objetivo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop oscuro para el Modal */}
            <div className="modal-backdrop fade show"></div>
            
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content shadow-lg border-0 rounded-3">
                        <div className="modal-header bg-light">
                            <h5 className="modal-title fw-bold text-primary">Nuevo Objetivo Anual</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4">
                                {error && <div className="alert alert-danger py-2">{error}</div>}
                                
                                <div className="mb-3">
                                    <label className="form-label text-muted fw-bold">Año</label>
                                    <input 
                                        type="number" 
                                        name="anio" 
                                        className="form-control bg-light" 
                                        value={formData.anio} 
                                        readOnly 
                                    />
                                    <small className="text-secondary">El objetivo se asignará automáticamente al año en curso.</small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Título del Objetivo <span className="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        name="titulo" 
                                        className="form-control" 
                                        placeholder="Ej: Conseguir empleo como desarrollador" 
                                        value={formData.titulo} 
                                        onChange={handleChange} 
                                        required 
                                        autoFocus
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Descripción (Opcional)</label>
                                    <textarea 
                                        name="descripcion" 
                                        className="form-control" 
                                        placeholder="Detalla tu meta de forma opcional..." 
                                        rows="3"
                                        value={formData.descripcion} 
                                        onChange={handleChange} 
                                    ></textarea>
                                </div>

                                <div className="mb-3 d-flex align-items-center gap-3">
                                    <div>
                                        <label className="form-label fw-bold mb-1">Color del Objetivo</label>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="color"
                                                name="color"
                                                value={formData.color}
                                                onChange={handleChange}
                                                style={{ width: '48px', height: '38px', border: 'none', borderRadius: '8px', padding: '2px', cursor: 'pointer' }}
                                            />
                                            <span className="text-muted small">Identifica este objetivo en el Planner</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Constructor de Cronograma <span className="text-danger">*</span></label>
                                    <select 
                                        name="cantidad_meses"
                                        className="form-select border-primary"
                                        value={formData.cantidad_meses}
                                        onChange={handleChange}
                                        required
                                    >
                                        {[...Array(12).keys()].map(i => (
                                            <option key={i+1} value={i+1}>
                                                {i+1} {i+1 === 1 ? 'Mes (4 Semanas)' : `Meses (${(i+1)*4} Semanas)`}
                                            </option>
                                        ))}
                                    </select>
                                    <small className="text-secondary">Se generará la jerarquía de meses vacíos para planificar.</small>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary fw-bold" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Crear Objetivo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CrearObjetivoModal;
