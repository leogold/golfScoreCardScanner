
import React from 'react';
import type { ScorecardData } from '../types';

interface ScorecardTableProps {
  data: ScorecardData;
}

const ScorecardTable: React.FC<ScorecardTableProps> = ({ data }) => {
  const headers = [
    "Player", "1", "2", "3", "4", "5", "6", "7", "8", "9", "OUT",
    "10", "11", "12", "13", "14", "15", "16", "17", "18", "IN", "TOTAL"
  ];

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6 overflow-hidden">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Extracted Scores</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((player, playerIndex) => (
              <tr key={playerIndex} className="even:bg-gray-50 hover:bg-green-50 transition-colors duration-200">
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left sticky left-0 bg-gray-50">
                  {player.playerName}
                </td>
                {player.scores.slice(0, 9).map((score, holeIndex) => (
                  <td key={`out-${holeIndex}`} className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {score ?? '-'}
                  </td>
                ))}
                <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-800 text-center bg-gray-100">
                  {player.out ?? '-'}
                </td>
                {player.scores.slice(9, 18).map((score, holeIndex) => (
                  <td key={`in-${holeIndex}`} className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                    {score ?? '-'}
                  </td>
                ))}
                <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-800 text-center bg-gray-100">
                  {player.in ?? '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-extrabold text-green-700 text-center bg-gray-200">
                  {player.total ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScorecardTable;
   