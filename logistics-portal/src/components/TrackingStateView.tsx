import React from 'react';

interface TrackingStateViewProps {
  state: 'empty' | 'loading' | 'notfound' | 'success';
  children?: React.ReactNode;
  notFoundMessage?: string;
}

export const TrackingStateView: React.FC<TrackingStateViewProps> = ({ state, children, notFoundMessage }) => {
  if (state === 'loading') {
    return (
      <div className="py-12 text-center flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-lime-300 border-t-lime-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (state === 'notfound') {
    return <div className="py-12 text-center text-red-500 font-semibold text-lg">{notFoundMessage || 'Tracking number not found. Please check and try again.'}</div>;
  }
  if (state === 'empty') {
    return <div className="py-12 text-center text-white/70">Enter your tracking number to get real-time updates on your shipment status.</div>;
  }
  return <>{children}</>;
};
