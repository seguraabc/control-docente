import React from 'react';

const ConfigurationNeededScreen: React.FC = () => {

  const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex">
      <div className="flex-shrink-0 mr-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold">
          {number}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        <div className="mt-2 text-gray-400 space-y-2">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl text-left bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-800">
        <header className="mb-6 border-b border-gray-700 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
            Configuración Requerida para Conectar con Google
          </h1>
          <p className="text-md text-gray-400 mt-2">
            ¡Ya casi está! Para que la aplicación pueda guardar tus datos de forma segura, necesita tus propias credenciales de API. Este proceso solo se hace una vez.
          </p>
        </header>
        
        <main className="space-y-6">
          <Step number={1} title="Ve a la Google Cloud Console">
            <p>Abre una nueva pestaña y navega a la consola de desarrolladores de Google.</p>
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="inline-block text-indigo-400 hover:text-indigo-300 font-semibold underline">
              Abrir Google Cloud Console &rarr;
            </a>
          </Step>

          <Step number={2} title="Crea un Proyecto y Habilita las APIs">
             <p>Si no tienes un proyecto, crea uno nuevo. Luego, busca y habilita estas dos APIs:</p>
             <ul className="list-disc list-inside pl-2">
                <li><code className="bg-gray-700 px-1 rounded">Google Sheets API</code></li>
                <li><code className="bg-gray-700 px-1 rounded">Google Drive API</code> (necesaria para crear el archivo inicial)</li>
             </ul>
          </Step>
          
           <Step number={3} title="Crea tus Credenciales">
            <p>En el menú de la izquierda, ve a <strong>APIs y servicios &rarr; Credenciales</strong>.</p>
            <ol className="list-decimal list-inside pl-2 space-y-3 mt-2">
                <li>
                    <strong>Crear Clave de API:</strong><br/>
                    Haz clic en <strong>"+ Crear Credenciales"</strong> y selecciona <strong>"Clave de API"</strong>. Cópiala para el siguiente paso.
                </li>
                 <li>
                    <strong>Crear ID de cliente de OAuth:</strong><br/>
                    Vuelve a hacer clic en <strong>"+ Crear Credenciales"</strong> y selecciona <strong>"ID de cliente de OAuth"</strong>.
                    <ul className="list-disc list-inside pl-4 mt-2 text-gray-500 space-y-2">
                        <li>Tipo de aplicación: <strong>Aplicación web</strong>.</li>
                        <li>
                            <strong>Orígenes de JavaScript autorizados:</strong> Aquí debes añadir todas las URLs desde donde se ejecutará tu aplicación. Haz clic en <strong>"+ AÑADIR URI"</strong> para cada una:
                            <ul className="list-[circle] list-inside pl-5 mt-1 text-gray-400">
                                <li>Tu URL de desarrollo local (ej: <code className="bg-gray-700 px-1 rounded text-xs">http://localhost:5173</code>).</li>
                                <li>Tu URL de producción final (ej: <code className="bg-gray-700 px-1 rounded text-xs">https://control-docente.vercel.app</code>).</li>
                            </ul>
                            <p className="mt-1 italic">Este paso es crucial. Si la URL de Vercel no está en la lista, el inicio de sesión fallará en producción.</p>
                        </li>
                    </ul>
                     <p className="mt-2">Haz clic en "Crear" y copia el <strong>ID de cliente</strong>.</p>
                </li>
            </ol>
          </Step>
          
          <Step number={4} title="Configura tus Variables de Entorno">
            <p>En lugar de editar el código, usarás variables de entorno. Esto es más seguro.</p>
             <div className="mt-3">
                <h4 className="font-semibold text-gray-200">Para Desarrollo Local:</h4>
                <p>Crea un archivo llamado <code className="bg-gray-700 px-1 rounded">.env</code> en la raíz de tu proyecto (junto a `index.html`) y añade tus credenciales:</p>
                <div className="bg-gray-800 p-3 rounded-md mt-2 text-sm font-mono">
                    <p>VITE_GOOGLE_API_KEY="<span className="text-yellow-300">PEGA_TU_API_KEY_AQUI</span>"</p>
                    <p>VITE_GOOGLE_CLIENT_ID="<span className="text-yellow-300">PEGA_TU_CLIENT_ID_AQUI</span>"</p>
                </div>
                 <p className="text-xs text-gray-500 mt-1">El prefijo `VITE_` es importante. No lo olvides.</p>
            </div>
             <div className="mt-4">
                <h4 className="font-semibold text-gray-200">Para Producción (en Vercel):</h4>
                <p>Ve a tu proyecto en Vercel, luego a <strong>Settings &rarr; Environment Variables</strong>. Añade las mismas dos variables:</p>
                 <ul className="list-disc list-inside pl-2 mt-2">
                    <li><code className="bg-gray-700 px-1 rounded">VITE_GOOGLE_API_KEY</code> con tu Clave de API como valor.</li>
                    <li><code className="bg-gray-700 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> con tu ID de cliente como valor.</li>
                 </ul>
            </div>
          </Step>
        </main>

        <footer className="mt-8 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">
                Después de configurar tus variables de entorno, reinicia el servidor de desarrollo o vuelve a desplegar en Vercel. La aplicación funcionará automáticamente.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default ConfigurationNeededScreen;