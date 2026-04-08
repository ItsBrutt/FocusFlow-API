import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await login(credentials.email, credentials.password);
        
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
        
        setLoading(false);
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="text-center mb-4 text-primary fw-bold">FocusFlow</h2>
                
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Correo Electrónico</label>
                        <input 
                            type="email" 
                            name="email"
                            className="form-control" 
                            placeholder="tucorreo@ejemplo.com"
                            value={credentials.email}
                            onChange={handleChange}
                            required 
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="form-label">Contraseña</label>
                        <input 
                            type="password" 
                            name="password"
                            className="form-control" 
                            placeholder="******"
                            value={credentials.password}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <button disabled={loading} type="submit" className="btn btn-primary w-100 fw-bold">
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <small className="text-muted">
                        ¿No tienes una cuenta? <Link to="/register" className="text-decoration-none">Regístrate</Link>
                    </small>
                </div>
            </div>
        </div>
    );
};

export default Login;
