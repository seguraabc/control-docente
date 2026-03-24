// src/config.ts

export const GOOGLE_CONFIG = {
  // Buscamos las variables en el entorno del sistema o el archivo .env
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
};

// Validación rápida en consola para desarrollo
if (!GOOGLE_CONFIG.API_KEY || !GOOGLE_CONFIG.CLIENT_ID) {
  console.warn(
    "⚠️ Advertencia: No se detectaron las credenciales de Google. " +
    "Asegúrate de tener un archivo .env configurado en la raíz del proyecto."
  );
}