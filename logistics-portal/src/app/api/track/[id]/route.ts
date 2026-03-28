import { NextRequest, NextResponse } from 'next/server';

export interface TrackingData {
  id: string;
  status: 'received' | 'in-transit' | 'sort-facility' | 'out-delivery' | 'delivered';
  origin: string;
  destination: string;
  estimatedDelivery: string;
  lastUpdated: string;
  timeline: {
    step: string;
    label: string;
    date: string;
    completed: boolean;
    active: boolean;
  }[];
}

const mockTrackings: Record<string, TrackingData> = {
  'SK-1234-5678': {
    id: 'SK-1234-5678',
    status: 'in-transit',
    origin: 'Nairobi',
    destination: 'Mombasa',
    estimatedDelivery: '2026-01-06',
    lastUpdated: '2026-01-02T14:30:00Z',
    timeline: [
      { step: 'received', label: 'Package Received', date: '2026-01-01', completed: true, active: false },
      { step: 'in-transit', label: 'In Transit', date: '2026-01-02', completed: true, active: true },
      { step: 'sort-facility', label: 'Arrived at Sort Facility', date: '2026-01-04', completed: false, active: false },
      { step: 'out-delivery', label: 'Out for Delivery', date: '2026-01-05', completed: false, active: false },
    ]
  },
  'SK-8765-4321': {
    id: 'SK-8765-4321',
    status: 'sort-facility',
    origin: 'Kisumu',
    destination: 'Eldoret',
    estimatedDelivery: '2026-01-05',
    lastUpdated: '2026-01-03T09:15:00Z',
    timeline: [
      { step: 'received', label: 'Package Received', date: '2026-01-01', completed: true, active: false },
      { step: 'in-transit', label: 'In Transit', date: '2026-01-02', completed: true, active: false },
      { step: 'sort-facility', label: 'Arrived at Sort Facility', date: '2026-01-03', completed: true, active: true },
      { step: 'out-delivery', label: 'Out for Delivery', date: '2026-01-05', completed: false, active: false },
    ]
  },
  'SKY-ABCD-2026': {
    id: 'SKY-ABCD-2026',
    status: 'out-delivery',
    origin: 'Mombasa',
    destination: 'Nairobi',
    estimatedDelivery: '2026-01-04',
    lastUpdated: '2026-01-04T08:00:00Z',
    timeline: [
      { step: 'received', label: 'Package Received', date: '2026-01-01', completed: true, active: false },
      { step: 'in-transit', label: 'In Transit', date: '2026-01-02', completed: true, active: false },
      { step: 'sort-facility', label: 'Arrived at Sort Facility', date: '2026-01-03', completed: true, active: false },
      { step: 'out-delivery', label: 'Out for Delivery', date: '2026-01-04', completed: true, active: true },
    ]
  },
  'SKY-TEST-9999': {
    id: 'SKY-TEST-9999',
    status: 'delivered',
    origin: 'Nairobi',
    destination: 'Kisumu',
    estimatedDelivery: '2026-01-03',
    lastUpdated: '2026-01-03T16:45:00Z',
    timeline: [
      { step: 'received', label: 'Package Received', date: '2026-01-01', completed: true, active: false },
      { step: 'in-transit', label: 'In Transit', date: '2026-01-02', completed: true, active: false },
      { step: 'sort-facility', label: 'Arrived at Sort Facility', date: '2026-01-03', completed: true, active: false },
      { step: 'out-delivery', label: 'Out for Delivery', date: '2026-01-03', completed: true, active: false },
    ]
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !mockTrackings[id]) {
    return NextResponse.json(
      { error: 'Tracking number not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(mockTrackings[id]);
}

