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
            ¡Ya casi está! Para que la aplicación pueda guardar tus datos de forma segura, necesita tus propias credenciales de API. Es un paso de seguridad estándar y solo necesitas hacerlo una vez.
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
             <p>Si no tienes un proyecto, crea uno nuevo (ej: "Mi App Docente"). Luego, busca y habilita estas dos APIs:</p>
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
                    <ul className="list-disc list-inside pl-4 mt-2 text-gray-500">
                        <li>Tipo de aplicación: <strong>Aplicación web</strong>.</li>
                        <li><strong>Orígenes de JavaScript autorizados:</strong> Haz clic en <strong>"+ AÑADIR URI"</strong> y pega la URL exacta que ves en la barra de direcciones de tu navegador en este momento.</li>
                    </ul>
                     <p className="mt-2">Haz clic en "Crear" y copia el <strong>ID de cliente</strong>.</p>
                </li>
            </ol>
          </Step>
          
          <Step number={4} title="Actualiza el Archivo de Configuración">
            <p>Abre el archivo <code className="bg-gray-700 px-1 rounded">config.ts</code> en el editor de código de la izquierda y pega las credenciales que acabas de copiar:</p>
            <div className="bg-gray-800 p-3 rounded-md mt-2 text-sm">
                <p><span className="text-gray-500">// 1. Pega tu Clave de API aquí:</span><br/>API_KEY: '<span className="text-yellow-300">TU_API_KEY</span>',</p>
                <p className="mt-2"><span className="text-gray-500">// 2. Pega tu ID de cliente aquí:</span><br/>CLIENT_ID: '<span className="text-yellow-300">TU_CLIENT_ID.apps.googleusercontent.com</span>',</p>
            </div>
          </Step>
        </main>

        <footer className="mt-8 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">
                Una vez que guardes los cambios en <code className="bg-gray-700 px-1 rounded">config.ts</code>, esta página se recargará automáticamente y podrás iniciar sesión.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default ConfigurationNeededScreen;
