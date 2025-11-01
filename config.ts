// config.ts
// INSTRUCCIONES IMPORTANTES:
// Para conectar la aplicación con tu cuenta de Google, necesitas crear credenciales.
// Sigue los pasos que aparecen en la pantalla de configuración de la aplicación
// para obtener tu API Key y Client ID, y luego pégalos aquí.

export const CONFIG = {
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
};