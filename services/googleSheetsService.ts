// FIX: Add declarations for gapi and google to resolve 'Cannot find name/namespace' errors.
declare const gapi: any;
declare const google: any;

import { User, AppData, Course, Student, AttendanceRecord, ClassSession, EvaluationInstance, Grade, SemesterDates } from '../types';
import { GOOGLE_CONFIG } from '../config';

const API_KEY = GOOGLE_CONFIG.API_KEY;
const CLIENT_ID = GOOGLE_CONFIG.CLIENT_ID;

const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";
const SPREADSHEET_NAME = 'ControlDocente_Datos';

let tokenClient: any;
let spreadsheetId: string | null = null;
let globalAuthChangeCallback: ((user: User | null) => void) | null = null;

let tokenResolvePromise: ((value: void) => void) | null = null;
let tokenRejectPromise: ((reason?: any) => void) | null = null;

const DATA_SHEETS = ['courses', 'students', 'attendance', 'classSessions', 'evaluationInstances', 'grades', 'semesterDates'];

const HEADERS = {
    courses: ['id', 'name', 'schedule', 'scheduleDays', 'term', 'status'],
    students: ['id', 'courseId', 'firstName', 'lastName'],
    attendance: ['studentId', 'date', 'status'],
    classSessions: ['courseId', 'date', 'taught'],
    evaluationInstances: ['id', 'courseId', 'name', 'order'],
    grades: ['studentId', 'evaluationInstanceId', 'value'],
    semesterDates: ['semester', 'startDate', 'endDate']
};

export function initGoogleClient(onAuthChange: (user: User | null) => void): Promise<void> {
    globalAuthChangeCallback = onAuthChange;

    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (typeof gapi !== 'undefined' && typeof google?.accounts !== 'undefined') {
                clearInterval(interval);

                try {
                    tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: (tokenResponse: any) => {
                            if (tokenResponse && tokenResponse.access_token) {
                                const expiresInStr = tokenResponse.expires_in?.toString() || "3599";
                                const expiryTime = new Date().getTime() + (parseInt(expiresInStr, 10) * 1000);

                                localStorage.setItem('gapi_access_token', JSON.stringify(tokenResponse));
                                localStorage.setItem('gapi_token_expiry', expiryTime.toString());

                                gapi.client.setToken(tokenResponse);

                                if (tokenResolvePromise) {
                                    tokenResolvePromise();
                                    tokenResolvePromise = null;
                                    tokenRejectPromise = null;
                                } else {
                                    updateLoginState(onAuthChange);
                                }
                            } else {
                                if (tokenRejectPromise) {
                                    tokenRejectPromise(new Error('Renovación de token cancelada por el usuario.'));
                                    tokenResolvePromise = null;
                                    tokenRejectPromise = null;
                                } else {
                                    gapi.client.setToken(null);
                                    onAuthChange(null);
                                }
                            }
                        },
                    });

                    gapi.load('client', async () => {
                        try {
                            await gapi.client.init({
                                apiKey: API_KEY,
                                discoveryDocs: DISCOVERY_DOCS,
                            });

                            const savedTokenStr = localStorage.getItem('gapi_access_token');
                            const expiryStr = localStorage.getItem('gapi_token_expiry');

                            if (savedTokenStr && expiryStr) {
                                const expiryTime = parseInt(expiryStr, 10);
                                if (new Date().getTime() < expiryTime) {
                                    const savedToken = JSON.parse(savedTokenStr);
                                    gapi.client.setToken(savedToken);
                                    updateLoginState(onAuthChange);
                                    resolve();
                                    return;
                                } else {
                                    localStorage.removeItem('gapi_access_token');
                                    localStorage.removeItem('gapi_token_expiry');
                                }
                            }

                            // Intento de login silencioso
                            tokenClient.requestAccessToken({ prompt: 'none' });

                            onAuthChange(null);
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
        
        // Al iniciar sesión exitosamente, intentamos sincronizar datos pendientes
        syncOfflineData();
    } catch (e) {
        console.error("Error fetching user profile", e);
        onAuthChange(null);
    }
}

export function handleSignIn() {
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

export function handleSignOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
            spreadsheetId = null;
            localStorage.removeItem('gapi_access_token');
            localStorage.removeItem('gapi_token_expiry');
            if (globalAuthChangeCallback) globalAuthChangeCallback(null);
        });
    } else {
        localStorage.removeItem('gapi_access_token');
        localStorage.removeItem('gapi_token_expiry');
        if (globalAuthChangeCallback) globalAuthChangeCallback(null);
    }
}

async function ensureValidToken(): Promise<void> {
    const expiryStr = localStorage.getItem('gapi_token_expiry');
    const currentTime = new Date().getTime();

    if (!expiryStr || currentTime > (parseInt(expiryStr, 10) - 300000)) {
        console.log("Token expirado o a punto de expirar. Solicitando renovación silenciosa...");
        return new Promise((resolve, reject) => {
            tokenResolvePromise = resolve;
            tokenRejectPromise = reject;
            tokenClient.requestAccessToken({ prompt: 'none' });
        });
    }
}

async function findOrCreateSpreadsheet(): Promise<string> {
    if (spreadsheetId) return spreadsheetId;

    await ensureValidToken();

    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
            fields: 'files(id, name)'
        });

        if (response.result.files && response.result.files.length > 0) {
            spreadsheetId = response.result.files[0].id!;
            return spreadsheetId;
        }

        const spreadsheet = await gapi.client.sheets.spreadsheets.create({
            properties: { title: SPREADSHEET_NAME },
            sheets: DATA_SHEETS.map(title => ({ properties: { title } }))
        });

        spreadsheetId = spreadsheet.result.spreadsheetId!;
        return spreadsheetId;
    } catch (err) {
        console.error("Error al buscar o crear la hoja de cálculo:", err);
        throw err;
    }
}

function rowToObject(headers: string[], row: any[]) {
    const obj: any = {};
    headers.forEach((h, i) => {
        obj[h] = row[i];
    });
    return obj;
}

function objectToRow(headers: string[], obj: any) {
    return headers.map(h => {
        const val = obj[h];
        if (Array.isArray(val)) return val.join(',');
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        return val !== undefined && val !== null ? String(val) : '';
    });
}

export async function getSpreadsheetData(): Promise<AppData> {
    try {
        await ensureValidToken();
        const ssId = await findOrCreateSpreadsheet();

        const ranges = DATA_SHEETS.map(sheet => `${sheet}!A:Z`);
        const response = await gapi.client.sheets.spreadsheets.values.batchGet({
            spreadsheetId: ssId,
            ranges: ranges,
        });

        const data: Partial<AppData> = {};
        
        response.result.valueRanges?.forEach((valueRange: any, index: number) => {
            const sheetName = DATA_SHEETS[index] as keyof AppData;
            const rows = valueRange.values || [];
            
            if (rows.length <= 1) {
                (data as any)[sheetName] = sheetName === 'semesterDates' ? null : [];
                return;
            }

            const headers = rows[0];
            const dataRows = rows.slice(1);

            if (sheetName === 'semesterDates') {
                const dates: any = {};
                dataRows.forEach((row: any) => {
                    const obj = rowToObject(headers, row);
                    if (obj.semester === 'firstSemester') {
                        dates.firstSemester = { startDate: obj.startDate, endDate: obj.endDate };
                    } else if (obj.semester === 'secondSemester') {
                        dates.secondSemester = { startDate: obj.startDate, endDate: obj.endDate };
                    }
                });
                data.semesterDates = dates.firstSemester && dates.secondSemester ? dates as SemesterDates : null;
            } else {
                (data as any)[sheetName] = dataRows.map((row: any) => {
                    const obj = rowToObject(headers, row);
                    if (sheetName === 'courses') {
                        return { ...obj, scheduleDays: obj.scheduleDays ? String(obj.scheduleDays).split(',').map(Number) : [] };
                    }
                    if (sheetName === 'classSessions') {
                        return { ...obj, taught: obj.taught === 'TRUE' };
                    }
                    if (sheetName === 'evaluationInstances') {
                        return { ...obj, order: Number(obj.order) };
                    }
                    return obj;
                });
            }
        });

        const currentYear = new Date().getFullYear();

        return {
            courses: data.courses || [],
            students: data.students || [],
            attendance: data.attendance || [],
            classSessions: data.classSessions || [],
            evaluationInstances: data.evaluationInstances || [],
            grades: data.grades || [],
            semesterDates: data.semesterDates || {
                firstSemester: { startDate: `${currentYear}-03-11`, endDate: `${currentYear}-07-05` },
                secondSemester: { startDate: `${currentYear}-08-05`, endDate: `${currentYear}-11-29` },
            },
        };

    } catch (err) {
        console.error("Error al obtener datos de la hoja de cálculo:", err);
        // Fallback a datos locales si existen
        const offlineData = localStorage.getItem('unsynced_app_data');
        if (offlineData) {
            return JSON.parse(offlineData) as AppData;
        }
        throw err;
    }
}

export async function saveSpreadsheetData(data: AppData) {
    try {
        await ensureValidToken();
        const ssId = await findOrCreateSpreadsheet();

        const dataForUpdate = DATA_SHEETS.map(sheetName => {
            const key = sheetName as keyof AppData;
            const headers = HEADERS[key];
            const items = data[key];
            
            let values = [headers];
            
            if (sheetName === 'semesterDates') {
                const dates = data.semesterDates;
                if (dates) {
                    values.push(['firstSemester', dates.firstSemester.startDate, dates.firstSemester.endDate]);
                    values.push(['secondSemester', dates.secondSemester.startDate, dates.secondSemester.endDate]);
                }
            } else if (Array.isArray(items)) {
                const rows = items.map(item => objectToRow(headers, item));
                values = values.concat(rows);
            }

            return {
                range: `${sheetName}!A1`,
                values: values
            };
        });

        // Limpiamos los datos anteriores para evitar filas huérfanas si la nueva lista es más corta
        await gapi.client.sheets.spreadsheets.values.batchClear({
            spreadsheetId: ssId,
            ranges: DATA_SHEETS.map(sheet => `${sheet}!A:Z`)
        });

        await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: ssId,
            resource: {
                valueInputOption: 'USER_ENTERED',
                data: dataForUpdate
            }
        });

        // Si guardó con éxito, borramos el respaldo offline
        localStorage.removeItem('unsynced_app_data');
    } catch (err) {
        console.error("Error al guardar datos en la hoja de cálculo. Guardando localmente...", err);
        localStorage.setItem('unsynced_app_data', JSON.stringify(data));
        throw err;
    }
}

export async function syncOfflineData() {
    const unsynced = localStorage.getItem('unsynced_app_data');
    if (unsynced) {
        try {
            const data = JSON.parse(unsynced);
            await saveSpreadsheetData(data);
            console.log("Datos offline sincronizados correctamente.");
        } catch (e) {
            console.error("Error intentando sincronizar datos offline.", e);
        }
    }
}