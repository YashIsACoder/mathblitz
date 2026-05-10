'use client';

import { useState } from 'react';

export function CacheManager() {
  const [days, setDays] = useState(7);
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const calculateSpace = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/database/cache?days=${days}`);
      const data = await res.json();
      setCacheInfo(data);
    } catch (error) {
      console.error('Failed to calculate space:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (!confirm(`Delete all data older than ${days} days? This will free up ${cacheInfo?.spaceToFree}.`)) {
      return;
    }
    
    setClearing(true);
    try {
      const res = await fetch(`/api/database/cache?days=${days}`, { method: 'DELETE' });
      const data = await res.json();
      alert(`Deleted ${data.deletedSessions} sessions and ${data.deletedAttempts} attempts.`);
      setCacheInfo(null);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm(`Are you sure you want to delete ALL data? This will remove ${cacheInfo?.totalSessions} sessions and ${cacheInfo?.totalAttempts} attempts (${cacheInfo?.totalSize}). This action cannot be undone.`)) {
      return;
    }
    
    setClearing(true);
    try {
      const res = await fetch(`/api/database/cache?clearAll=true`, { method: 'DELETE' });
      const data = await res.json();
      alert(`Deleted ${data.deletedSessions} sessions and ${data.deletedAttempts} attempts.`);
      setCacheInfo(null);
    } catch (error) {
      console.error('Failed to clear all data:', error);
      alert('Failed to clear all data. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-zinc-100">Database Cache Management</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Clear data older than:</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 7)}
              min="1"
              max="365"
              className="w-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100"
            />
            <span className="text-zinc-400 py-2">days</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={calculateSpace}
            disabled={loading}
            className="px-4 py-2 bg-zinc-700 text-zinc-100 rounded hover:bg-zinc-600 disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate Space'}
          </button>
          
          {cacheInfo && cacheInfo.sessionsToDelete > 0 && (
            <button
              onClick={clearCache}
              disabled={clearing}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : `Clear Older Than ${days} Days`}
            </button>
          )}
          
          {cacheInfo && cacheInfo.totalSessions > 0 && (
            <button
              onClick={clearAllData}
              disabled={clearing}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : 'Clear All Data'}
            </button>
          )}
        </div>

        {cacheInfo && (
          <div className="space-y-3">
            <div className="bg-zinc-800 rounded p-4 space-y-2">
              <h4 className="text-sm font-semibold text-zinc-300 mb-2">Total Database</h4>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total sessions:</span>
                <span className="text-zinc-100">{cacheInfo.totalSessions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total attempts:</span>
                <span className="text-zinc-100">{cacheInfo.totalAttempts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total size:</span>
                <span className="text-zinc-100">{cacheInfo.totalSize}</span>
              </div>
              {cacheInfo.currentOldestSession && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Oldest session:</span>
                  <span className="text-zinc-100">{new Date(cacheInfo.currentOldestSession).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {cacheInfo.sessionsToDelete > 0 && (
              <div className="bg-zinc-800 rounded p-4 space-y-2">
                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Will Delete (older than {days} days)</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Sessions to delete:</span>
                  <span className="text-zinc-100">{cacheInfo.sessionsToDelete}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Attempts to delete:</span>
                  <span className="text-zinc-100">{cacheInfo.attemptsToDelete}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-zinc-400">Space to free:</span>
                  <span className="text-green-400">{cacheInfo.spaceToFree}</span>
                </div>
              </div>
            )}

            {cacheInfo.sessionsToDelete === 0 && (
              <div className="bg-zinc-800 rounded p-4">
                <p className="text-sm text-zinc-400">
                  No sessions older than {days} days. Try increasing the days value.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
