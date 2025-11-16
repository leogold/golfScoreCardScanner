
import type { ScorecardData } from '../types';

// FIX: Add declarations for gapi and google to resolve TypeScript errors.
// These are loaded from external scripts and are available in the global scope at runtime.
declare const gapi: any;
// FIX: Replace `declare const google: any;` with a namespace declaration to provide type information for the Google Identity Services client.
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        requestAccessToken: (overrideConfig: { prompt: string }) => void;
      }
      interface TokenResponse {
          access_token: string;
          error?: any;
      }
      function initTokenClient(config: {
        client_id: string | undefined;
        scope: string;
        callback: (tokenResponse: TokenResponse) => void;
      }): TokenClient;
      function revoke(accessToken: string, callback: () => void): void;
    }
  }
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.API_KEY;
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

const SPREADSHEET_ID = '1sjDla83PB-8fq57Pbk2G2dnRgtcgYa4f8nTsoPoMY5s';
const RANGE = 'rawData!A1';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

// Create a promise that resolves when GAPI is loaded and initialized.
// This prevents race conditions where gapi.client is used before it's ready.
const gapiInitPromise = new Promise<void>((resolve, reject) => {
  gapi.load('client', async () => {
    try {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
      });
      resolve();
    } catch (err) {
      console.error("Error initializing GAPI client:", err);
      reject(err);
    }
  });
});

/**
 *  Initializes the GIS token client. This is called when the GSI script from Google has loaded.
 */
export function initClient(updateSigninStatus: (isSignedIn: boolean) => void) {
  if (!CLIENT_ID) {
    console.error("Google Client ID is not configured.");
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (tokenResponse) => {
      // This callback is fired after the user signs in.
      // We must wait for the gapi client to be ready before using it.
      try {
        await gapiInitPromise;
        if (tokenResponse && tokenResponse.access_token) {
          gapi.client.setToken(tokenResponse);
          updateSigninStatus(true);
        } else if (tokenResponse.error) {
          console.error('GSI Error:', tokenResponse.error);
          updateSigninStatus(false);
        }
      } catch (err) {
        console.error("Error during GAPI initialization:", err);
        updateSigninStatus(false);
      }
    },
  });
}

export function handleAuthClick() {
  if (tokenClient) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({prompt: ''});
  } else {
    console.error("Auth client not initialized.");
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
    // Wait for the GAPI client to be initialized before making an API call.
    await gapiInitPromise;
    
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
