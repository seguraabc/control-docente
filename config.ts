// FIX: Se cambió el acceso a las variables de entorno de `import.meta.env` a `process.env`
// para que funcione en este entorno de ejecución. También se declararon los tipos para `process.env`.
declare const process: {
  env: {
    readonly VITE_GOOGLE_API_KEY: string;
    readonly VITE_GOOGLE_CLIENT_ID: string;
  }
};

// config.ts
// Las credenciales de Google ahora se gestionan a través de variables de entorno.
// Para desarrollo local, crea un archivo .env en la raíz del proyecto.
// Para producción (Vercel, etc.), configúralas en el panel de tu proveedor de hosting.

// Asegúrate de que las variables de entorno estén prefijadas con "VITE_"
// para que Vite las exponga al cliente.
// Ejemplo de archivo .env:
// VITE_GOOGLE_API_KEY="AIzaSyAjTKl_pqZ5HuZMPAnh90e2txuUW3sN0oc"
// VITE_GOOGLE_CLIENT_ID=" 191525381309-c8vaer2ngqv6u01pfqtfgisf8oogpo90.apps.googleusercontent.com "

export const GOOGLE_CONFIG = {
  API_KEY: process.env.VITE_GOOGLE_API_KEY,
  CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
};
