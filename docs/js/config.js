/**
 * Tailwind CSS theme configuration for ITCO Trade Management
 */
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#0f172a',
                secondary: '#1e293b',
                accent: '#3b82f6',
                dark: '#020617',
                'dark-light': '#334155',
                success: '#059669',
                warning: '#d97706',
                danger: '#dc2626',
                'corporate-blue': '#1e40af',
                'corporate-gray': '#64748b'
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif']
            },
            boxShadow: {
                'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'strong': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'corporate': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }
        }
    }
};
