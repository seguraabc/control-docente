// FIX: Add declarations for gapi and google to resolve 'Cannot find name/namespace' errors.
// These are loaded from external scripts and are available in the global scope.
declare const gapi: any;
declare const google: any;

import { User, AppData } from '../types';
import { GOOGLE_CONFIG } from '../config';

const API_KEY = GOOGLE_CONFIG.API_KEY;
const CLIENT_ID = GOOGLE_CONFIG.CLIENT_ID;

const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";
const SPREADSHEET_NAME = 'ControlDocente_Datos';

let tokenClient: any;
let spreadsheetId: string | null = null;

const DATA_SHEETS = ['courses', 'students', 'attendance', 'classSessions', 'evaluationInstances', 'grades', 'semesterDates'];

/**
 * Initializes the Google API and Identity Services clients.
 * This function polls until the necessary scripts (loaded from index.html) are ready.
 */
export function initGoogleClient(onAuthChange: (user: User | null) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (typeof gapi !== 'undefined' && typeof google?.accounts !== 'undefined') {
                clearInterval(interval);

                try {
                    // Initialize GIS client
                    tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: (tokenResponse: any) => {
                            if (tokenResponse.error) {
                                console.error('Error during Google authentication:', tokenResponse);
                                // Show a user-facing error. This is critical for debugging invalid credentials.
                                alert(`Error de autenticación con Google: ${tokenResponse.error_description || tokenResponse.error}.\n\nEsto puede ocurrir si las credenciales (API Key, Client ID) no son válidas o no están configuradas correctamente.`);
                                onAuthChange(null); // Ensure user is logged out
                                return;
                            }
                            updateLoginState(onAuthChange);
                        },
                    });

                    // Initialize GAPI client
                    gapi.load('client', async () => {
                        try {
                            await gapi.client.init({
                                apiKey: API_KEY,
                                discoveryDocs: DISCOVERY_DOCS,
                            });
                            await updateLoginState(onAuthChange);
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                } catch (e) {
                    reject(e);
                }
            }
        }, 100);
    });
}

/**
 * Actualiza el estado de login y obtiene el perfil del usuario.
 */
async function updateLoginState(onAuthChange: (user: User | null) => void) {
    let token = gapi.client.getToken();
    if (token === null) {
        onAuthChange(null);
        return;
    }
    
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${token.access_token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user info');
        const profile = await response.json();
        const user: User = {
            name: profile.name,
            email: profile.email,
            picture: profile.picture
        };
        onAuthChange(user);
    } catch (e) {
        console.error("Error fetching user profile", e);
        onAuthChange(null);
    }
}

export function handleSignIn() {
    if (gapi.client.getToken() === null) {
        // Al no especificar 'prompt', la pantalla de consentimiento solo aparecerá la primera vez
        // o si el usuario revoca los permisos. En visitas posteriores, será automático.
        tokenClient.requestAccessToken({ prompt: '' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

export function handleSignOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
            spreadsheetId = null;
        });
    }
}

/**
 * Busca el archivo de la hoja de cálculo o lo crea si no existe.
 */
async function findOrCreateSpreadsheet(): Promise<string> {
    if (spreadsheetId) return spreadsheetId;

    try {
        // 1. Buscar el archivo
        const response = await gapi.client.drive.files.list({
            q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
            fields: 'files(id, name)'
        });

        if (response.result.files && response.result.files.length > 0) {
            spreadsheetId = response.result.files[0].id!;
            return spreadsheetId;
        }

        // 2. Si no se encuentra, crearlo
        const spreadsheet = await gapi.client.sheets.spreadsheets.create({
            properties: {
                title: SPREADSHEET_NAME
            },
            sheets: DATA_SHEETS.map(title => ({ properties: { title } }))
        });

        spreadsheetId = spreadsheet.result.spreadsheetId!;
        return spreadsheetId;
    } catch (err) {
        console.error("Error al buscar o crear la hoja de cálculo:", err);
        throw err;
    }
}

/**
 * Carga todos los datos desde la hoja de cálculo.
 */
export async function getSpreadsheetData(): Promise<AppData> {
    try {
        const ssId = await findOrCreateSpreadsheet();
        
        const ranges = DATA_SHEETS.map(sheet => `${sheet}!A1`);
        const response = await gapi.client.sheets.spreadsheets.values.batchGet({
            spreadsheetId: ssId,
            ranges: ranges,
        });

        const data: Partial<AppData> = {};
        response.result.valueRanges?.forEach((valueRange, index) => {
            const sheetName = DATA_SHEETS[index] as keyof AppData;
            const cellValue = valueRange.values?.[0]?.[0];
            // FIX: Cast `data` to `any` to allow dynamic property assignment
            // to prevent TypeScript from throwing errors on indexed access on a union type.
            try {
                (data as any)[sheetName] = cellValue ? JSON.parse(cellValue) : (sheetName === 'semesterDates' ? null : []);
            } catch (e) {
                 (data as any)[sheetName] = sheetName === 'semesterDates' ? null : [];
            }
        });
        
        // Estado inicial por defecto si el archivo es nuevo
        return {
            courses: data.courses || [],
            students: data.students || [],
            attendance: data.attendance || [],
            classSessions: data.classSessions || [],
            evaluationInstances: data.evaluationInstances || [],
            grades: data.grades || [],
            semesterDates: data.semesterDates || {
                firstSemester: { startDate: '2024-03-11', endDate: '2024-07-05' },
                secondSemester: { startDate: '2024-08-05', endDate: '2024-11-29' },
            },
        };

    } catch (err) {
        console.error("Error al obtener datos de la hoja de cálculo:", err);
        throw err;
    }
}

/**
 * Guarda todos los datos en la hoja de cálculo.
 */
export async function saveSpreadsheetData(data: AppData) {
    try {
        const ssId = await findOrCreateSpreadsheet();
        
        const dataForUpdate = DATA_SHEETS.map(sheetName => {
            const key = sheetName as keyof AppData;
            return {
                range: `${sheetName}!A1`,
                values: [[JSON.stringify(data[key])]]
            };
        });

        await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: ssId,
            resource: {
                valueInputOption: 'RAW',
                data: dataForUpdate
            }
        });

    } catch (err) {
        console.error("Error al guardar datos en la hoja de cálculo:", err);
        throw err;
    }
}