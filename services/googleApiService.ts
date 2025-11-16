import type { ScorecardData } from '../types';

// FIX: Add declarations for gapi and google to resolve TypeScript errors.
// These are loaded from external scripts and are available in the global scope at runtime.
declare const gapi: any;
declare const google: any;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.API_KEY;
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

const SPREADSHEET_ID = '1sjDla83PB-8fq57Pbk2G2dnRgtcgYa4f8nTsoPoMY5s';
const RANGE = 'rawData!A1';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let gapiInited = false;
let gisInited = false;


/**
 * Callback after the API client is loaded. Loads the discovery doc to initialize the API.
 */
async function intializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });
  gapiInited = true;
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
export function initClient(updateSigninStatus: (isSignedIn: boolean) => void) {
  gapi.load('client', intializeGapiClient);

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID!,
    scope: SCOPES,
    callback: async (resp) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      updateSigninStatus(true);
    },
  });

   if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
       updateSigninStatus(true);
    }
}

export function handleAuthClick() {
  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient?.requestAccessToken({prompt: ''});
  } else {
    // User is already signed in.
    console.log("Already signed in.");
  }
}

export function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
        });
    }
}

export async function appendToSheet(data: ScorecardData): Promise<any> {
    if (!gapiInited) {
        throw new Error("GAPI client not initialized.");
    }
    
    const rowData = [
        new Date().toISOString(),
        JSON.stringify(data)
    ];

    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [rowData],
            },
        });
        return response;
    } catch (err: any) {
        console.error('Error appending to sheet:', err);
        const errorDetails = err.result?.error?.message || 'An unknown error occurred while saving to the sheet.';
        throw new Error(`Failed to save data to Google Sheet. Reason: ${errorDetails}`);
    }
}
