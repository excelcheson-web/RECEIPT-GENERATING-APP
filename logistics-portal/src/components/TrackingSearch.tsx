import React, { useState } from 'react';

interface TrackingSearchProps {
  onSearch: (waybillNumber: string) => void;
  loading: boolean;
}

export const TrackingSearch: React.FC<TrackingSearchProps> = ({ onSearch, loading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Enter your tracking number"
        className="glass-input flex-1 text-base glass-input-lime text-center sm:text-left"
        disabled={loading}
      />
      <button
        type="submit"
        className="skyship-button px-8 py-3 whitespace-nowrap font-bold"
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Track'}
      </button>
    </form>
  );
};
