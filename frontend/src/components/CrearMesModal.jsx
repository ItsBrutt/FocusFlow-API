import { useState } from 'react';
import api from '../api/axiosConfig';

const mesesNombres = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' }
];

const CrearMesModal = ({ show, onClose, onMesCreated, objetivoId }) => {
    const [formData, setFormData] = useState({
        mes: '1',
        titulo: ''
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
            const response = await api.post(`/api/objetivos/${objetivoId}/meses`, formData);
            if (response.data.success) {
                onMesCreated(response.data.data);
                setFormData({ ...formData, titulo: '' }); // Reset title, keep month
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al asignar el mes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="modal-backdrop fade show"></div>
            
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content shadow-lg border-0 rounded-3">
                        <div className="modal-header bg-success text-white">
                            <h5 className="modal-title fw-bold">Planificar Nuevo Mes</h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4">
                                {error && <div className="alert alert-danger py-2">{error}</div>}
                                
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Selecciona el Mes <span className="text-danger">*</span></label>
                                    <select 
                                        name="mes" 
                                        className="form-select form-select-lg" 
                                        value={formData.mes} 
                                        onChange={handleChange}
                                        required
                                    >
                                        {mesesNombres.map(m => (
                                            <option key={m.num} value={m.num}>{m.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Título del Mes <span className="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        name="titulo" 
                                        className="form-control" 
                                        placeholder="Ej: Dominar Base de Datos SQL" 
                                        value={formData.titulo} 
                                        onChange={handleChange} 
                                        required 
                                        autoFocus
                                    />
                                    <small className="text-muted mt-1 d-block">¿Cuál es tu enfoque único y principal para este treinteno?</small>
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-success fw-bold" disabled={loading}>
                                    {loading ? 'Asignando...' : 'Asignar Mes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CrearMesModal;
