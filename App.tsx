
import React, { useState, useCallback } from 'react';
import { extractScorecardData } from './services/geminiService';
import { UploadIcon, GolfBallIcon, Spinner, CopyIcon, DownloadIcon } from './components/Icons';
import type { ScorecardData } from './types';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scorecardData, setScorecardData] = useState<ScorecardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

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

  const resetState = () => {
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setScorecardData(null);
    setError(null);
    setIsLoading(false);
    setCopySuccess('');
  };

  const handleCopyJson = () => {
    if (!scorecardData) return;
    navigator.clipboard.writeText(JSON.stringify(scorecardData, null, 2))
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  const handleDownloadJson = () => {
    if (!scorecardData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scorecardData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "scorecard.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl mx-auto text-center mb-8">
        <div className="flex items-center justify-center gap-4">
          <GolfBallIcon className="w-12 h-12 text-green-600" />
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 tracking-tight">
            Golf Scorecard to JSON
          </h1>
        </div>
        <p className="mt-4 text-lg text-gray-600">
          Upload a photo of your scorecard to extract the data into JSON format.
        </p>
      </header>

      <main className="w-full max-w-5xl mx-auto flex-grow flex flex-col items-center justify-center">
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
                disabled={isLoading}
                className="w-48 h-12 flex items-center justify-center px-6 py-3 text-white font-semibold bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? <Spinner className="w-6 h-6" /> : 'Extract JSON'}
              </button>
              <button
                onClick={resetState}
                disabled={isLoading}
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
          <div className="mt-8 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-800">JSON Output</h2>
                <div className="flex gap-2">
                    <button onClick={handleCopyJson} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        <CopyIcon className="w-5 h-5 mr-2" />
                        {copySuccess || 'Copy'}
                    </button>
                    <button onClick={handleDownloadJson} className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Download
                    </button>
                </div>
            </div>
            <pre className="bg-gray-800 text-green-300 p-4 rounded-lg overflow-x-auto text-sm shadow-inner">
                <code>
                    {JSON.stringify(scorecardData, null, 2)}
                </code>
            </pre>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
