import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Inicializar del localStorage o por defecto 'light'
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        // Guardar en localStorage
        localStorage.setItem('theme', theme);
        
        // Aplicar a Bootstrap 5 (data-bs-theme)
        document.documentElement.setAttribute('data-bs-theme', theme);
        
        // Agregar clase para selectores CSS personalizados en index.css
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark-theme');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark-theme');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
