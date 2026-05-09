'use client';

import { useState } from 'react';

interface DateRangePickerProps {
  onRangeChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    if (startDate && endDate) {
      onRangeChange(startDate, endDate);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onRangeChange('', '');
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
      <h3 className="text-zinc-400 uppercase tracking-widest text-xs font-bold mb-3">Date Range</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-zinc-500 text-xs uppercase tracking-wider block mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-300 text-sm"
          />
        </div>
        <div>
          <label className="text-zinc-500 text-xs uppercase tracking-wider block mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-300 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={!startDate || !endDate}
          className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded border border-zinc-700 text-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Apply Range
        </button>
        <button
          onClick={handleClear}
          className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded border border-zinc-700 text-sm hover:bg-zinc-700 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
