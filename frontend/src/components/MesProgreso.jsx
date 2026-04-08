const MesProgreso = ({ mes, titulo, progreso_total }) => {
    return (
        <div className="col-md-6 mb-3">
            <div className="border rounded p-3 bg-light shadow-sm">
                <strong>Mes {mes}:</strong> {titulo}
                <div className="progress mt-2" style={{ height: '10px' }}>
                    <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: `${progreso_total}%` }}
                        aria-valuenow={progreso_total} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default MesProgreso;
