import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setGeneralError(null);

        try {
            const response = await api.post('/register', formData);
            if (response.data.success) {
                // Redirigir al login si se crea la cuenta con éxito
                navigate('/login');
            }
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.data) {
                // Atrapamos los errores del "Validator" de PHP
                setErrors(error.response.data.data);
            } else {
                setGeneralError(error.response?.data?.message || "Ocurrió un error al registrar el usuario");
            }
        }
        
        setLoading(false);
    };

    // Helper para mostrar invalid-feedback de bootstrap
    const getClass = (field) => `form-control ${errors[field] ? 'is-invalid' : ''}`;

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="text-center mb-4 text-primary fw-bold">Crear Cuenta</h2>
                
                {generalError && <div className="alert alert-danger">{generalError}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Nombre Completo</label>
                        <input 
                            type="text" 
                            name="nombre"
                            className={getClass('nombre')} 
                            placeholder="Ej. Juan Pérez"
                            value={formData.nombre}
                            onChange={handleChange}
                            required 
                        />
                        {errors.nombre && <div className="invalid-feedback">{errors.nombre[0]}</div>}
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Correo Electrónico</label>
                        <input 
                            type="email" 
                            name="email"
                            className={getClass('email')} 
                            placeholder="tucorreo@ejemplo.com"
                            value={formData.email}
                            onChange={handleChange}
                            required 
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email[0]}</div>}
                    </div>
                    
                    <div className="mb-4">
                        <label className="form-label">Contraseña</label>
                        <input 
                            type="password" 
                            name="password"
                            className={getClass('password')} 
                            placeholder="Mínimo 6 caracteres"
                            value={formData.password}
                            onChange={handleChange}
                            required 
                        />
                        {errors.password && <div className="invalid-feedback">{errors.password[0]}</div>}
                    </div>

                    <button disabled={loading} type="submit" className="btn btn-primary w-100 fw-bold">
                        {loading ? 'Procesando...' : 'Registrarse'}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <small className="text-muted">
                        ¿Ya tienes una cuenta? <Link to="/login" className="text-decoration-none">Ingresa aquí</Link>
                    </small>
                </div>
            </div>
        </div>
    );
};

export default Register;
