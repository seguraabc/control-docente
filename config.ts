// FIX: Manually define types for `import.meta.env` because the project
// configuration seems to prevent `/// <reference types="vite/client" />` from working.
// This ensures the app compiles correctly without relying on a project-level fix.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_GOOGLE_API_KEY: string;
      readonly VITE_GOOGLE_CLIENT_ID: string;
    }
  }
}

// config.ts
// Las credenciales de Google ahora se gestionan a través de variables de entorno.
// Para desarrollo local, crea un archivo .env en la raíz del proyecto.
// Para producción (Vercel, etc.), configúralas en el panel de tu proveedor de hosting.

// Asegúrate de que las variables de entorno estén prefijadas con "VITE_"
// para que Vite las exponga al cliente.
// Ejemplo de archivo .env:
// VITE_GOOGLE_API_KEY="tu-api-key"
// VITE_GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"

export const GOOGLE_CONFIG = {
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
};
