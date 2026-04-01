import React from 'react';

export interface TrackingEvent {
  status: string;
  location: string;
  description: string;
  eventTime: string;
}

interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus?: string;
}

const STANDARD_STAGES = [
  'Shipment Received',
  'Shipment Created',
  'Processing',
  'Dispatched',
  'In Transit',
  'Arrived at Destination Hub',
  'Out for Delivery',
  'Delivered',
] as const;

function stageIndexFromStatus(status: string): number {
  const value = status.toLowerCase();
  if (value.includes('received')) return 0;
  if (value.includes('created')) return 1;
  if (value.includes('processing')) return 2;
  if (value.includes('dispatch')) return 3;
  if (value.includes('transit')) return 4;
  if (value.includes('arrived') || value.includes('destination hub')) return 5;
  if (value.includes('out for delivery')) return 6;
  if (value.includes('delivered')) return 7;
  return -1;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ events, currentStatus }) => {
  const sortedEvents = [...(events || [])].sort((a, b) => {
    const ta = Date.parse(a.eventTime || '')
    const tb = Date.parse(b.eventTime || '')
    const sa = Number.isNaN(ta) ? 0 : ta
    const sb = Number.isNaN(tb) ? 0 : tb
    return sa - sb
  });

  const latestEvent = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1] : null;
  const currentStageIndex = Math.max(
    stageIndexFromStatus(currentStatus || ''),
    stageIndexFromStatus(latestEvent?.status || '')
  );

  const stageEventMap = new Map<number, TrackingEvent>();
  sortedEvents.forEach((event) => {
    const index = stageIndexFromStatus(event.status || '');
    if (index >= 0 && !stageEventMap.has(index)) {
      stageEventMap.set(index, event);
    }
  });

  return (
    <div className="timeline-container rounded-2xl p-6 mb-6 border border-[#3d587f] bg-[#0f2340] shadow-xl shadow-black/30">
      <div className="font-bold text-xl mb-5 text-white">Shipment Progress</div>

      <ol className="relative border-l-2 border-lime-400/60 pl-4">
        {STANDARD_STAGES.map((stage, idx) => {
          const stageEvent = stageEventMap.get(idx);
          const isCompleted = currentStageIndex >= 0 && idx < currentStageIndex;
          const isCurrent = currentStageIndex >= 0 && idx === currentStageIndex;
          const isPending = !isCompleted && !isCurrent;

          return (
            <li key={stage} className="mb-5 ml-4 relative">
              <span
                className={`absolute -left-[1.15rem] top-1 flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold ${
                  isCompleted
                    ? 'bg-lime-500 border-lime-400 text-[#0b1b33]'
                    : isCurrent
                    ? 'bg-[#1f3e67] border-lime-400 text-lime-300'
                    : 'bg-[#112947] border-[#4d6485] text-[#86a0bf]'
                }`}
              >
                {isCompleted ? '✓' : isCurrent ? '●' : idx + 1}
              </span>

              <div
                className={`rounded-xl border p-3 ${
                  isCompleted
                    ? 'bg-[#16324f] border-lime-500/50'
                    : isCurrent
                    ? 'bg-[#1a3a5f] border-lime-400'
                    : 'bg-[#132d4a] border-[#3f5778]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`font-semibold ${isCurrent ? 'text-lime-300' : isCompleted ? 'text-lime-200' : 'text-[#c0d0e4]'}`}>{stage}</span>
                  <span className="text-xs text-[#9db3cf]">{stageEvent?.eventTime || ''}</span>
                </div>
                <div className="text-sm text-[#d5e0ee]">{stageEvent?.location || (isPending ? 'Pending' : 'In progress')}</div>
                <div className="text-xs text-[#9db3cf] mt-1">{stageEvent?.description || (isPending ? 'Awaiting this stage.' : 'Shipment progressing normally.')}</div>
              </div>
            </li>
          );
        })}
      </ol>

      {sortedEvents.length === 0 && (
        <div className="text-sm text-[#9db3cf] mt-2">No tracking events found yet. Showing standard shipment stages.</div>
      )}
    </div>
  );
};
