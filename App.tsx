import React, { useState, useCallback, useEffect } from 'react';
import { extractScorecardData } from './services/geminiService';
import { initClient, handleAuthClick, handleSignoutClick, appendToSheet } from './services/googleApiService';
import { UploadIcon, GolfBallIcon, Spinner, GoogleIcon, SheetIcon, CheckIcon } from './components/Icons';
import ScorecardTable from './components/ScorecardTable';
import type { ScorecardData } from './types';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scorecardData, setScorecardData] = useState<ScorecardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
        initClient(setIsSignedIn);
    };
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      resetState();
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const processScorecard = useCallback(async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    setScorecardData(null);

    try {
      const data = await extractScorecardData(imageFile);
      if (data && data.length > 0) {
        setScorecardData(data);
      } else {
        setError("Could not extract any player data from the scorecard. Please try a clearer image.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  const handleSaveToSheet = async () => {
    if (!scorecardData) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
        await appendToSheet(scorecardData);
        setSaveSuccess(true);
    } catch (err) {
        setSaveError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsSaving(false);
    }
  };

  const resetState = () => {
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setScorecardData(null);
    setError(null);
    setIsLoading(false);
    setSaveError(null);
    setSaveSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center justify-center gap-4">
          <GolfBallIcon className="w-12 h-12 text-green-600" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
            Golf Scorecard Scanner
          </h1>
        </div>
        {isSignedIn ? (
             <button onClick={() => { handleSignoutClick(); setIsSignedIn(false);}} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Sign Out
             </button>
        ) : (
            <button onClick={handleAuthClick} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <GoogleIcon className="w-5 h-5 mr-2" />
                Sign in with Google
            </button>
        )}
      </header>
      <p className="mt-[-2rem] mb-8 text-lg text-gray-600 max-w-7xl w-full">
          Upload a photo of your scorecard to extract the data and save it to Google Sheets.
      </p>

      <main className="w-full max-w-7xl mx-auto flex-grow flex flex-col items-center">
        {!previewUrl ? (
          <div className="w-full max-w-lg">
            <label htmlFor="file-upload" className="relative cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, or WEBP</p>
              </div>
              <input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-md">
                <img src={previewUrl} alt="Scorecard Preview" className="w-full h-auto rounded-md object-contain" style={{ maxHeight: '50vh' }} />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={processScorecard}
                disabled={isLoading || !!scorecardData}
                className="w-48 h-12 flex items-center justify-center px-6 py-3 text-white font-semibold bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? <Spinner className="w-6 h-6" /> : 'Extract Data'}
              </button>
              <button
                onClick={resetState}
                className="w-48 h-12 px-6 py-3 font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-200"
              >
                Upload New Image
              </button>
            </div>
          </div>
        )}

        {error && (
            <div className="mt-6 w-full max-w-2xl p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                <p className="font-bold">An error occurred:</p>
                <p>{error}</p>
            </div>
        )}
        
        {scorecardData && (
          <div className="mt-8 w-full">
            <ScorecardTable data={scorecardData} />
            <div className="mt-6 flex flex-col items-center gap-4">
                <button
                    onClick={handleSaveToSheet}
                    disabled={!isSignedIn || isSaving || saveSuccess}
                    className="w-64 h-12 flex items-center justify-center px-6 py-3 text-white font-semibold bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {isSaving ? <Spinner className="w-6 h-6" /> : (saveSuccess ? <CheckIcon className="w-6 h-6 mr-2" /> : <SheetIcon className="w-6 h-6 mr-2" />)}
                    {saveSuccess ? 'Saved Successfully!' : 'Save to Google Sheet'}
                </button>
                {!isSignedIn && <p className="text-sm text-yellow-700">Please sign in with Google to save the data.</p>}
                 {saveError && (
                    <div className="w-full max-w-xl p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                        <p>{saveError}</p>
                    </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;