// src/services/waybillService.ts
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
} from 'firebase/firestore';
import type { StoredWaybill, TrackingEventRecord } from '@/lib/types';

export type TrackingEvent = TrackingEventRecord;
export type Waybill = StoredWaybill;

const WAYBILLS_COLLECTION = 'waybills';

const ALWAYS_DROP_FIELDS = new Set([
  'logoPreview',
  'signaturePreview',
  'pdfUrl',
  'pdfBlob',
  'pdfBase64',
  'fileData',
]);

const CONDITIONAL_HEAVY_FIELDS = new Set([
  'logoUrl',
  'signatureUrl',
  'senderLogoUrl',
]);

function isHeavyString(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith('data:')) return true;
  if (trimmed.startsWith('blob:')) return true;
  if (trimmed.length > 100000) return true;
  return false;
}

function sanitizeForFirestoreWrite<T>(input: T): T {
  function sanitizeValue(value: unknown, key?: string): unknown {
    if (value === undefined) return undefined;

    if (typeof value === 'string') {
      if (key && ALWAYS_DROP_FIELDS.has(key)) return undefined;
      if (key && CONDITIONAL_HEAVY_FIELDS.has(key) && isHeavyString(value)) return undefined;
      if (isHeavyString(value) && value.length > 1000000) return undefined;
      return value;
    }

    if (Array.isArray(value)) {
      const sanitizedArray = value
        .map((item) => sanitizeValue(item))
        .filter((item) => item !== undefined);
      return sanitizedArray;
    }

    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const sanitizedObj: Record<string, unknown> = {};

      Object.entries(obj).forEach(([k, v]) => {
        if (ALWAYS_DROP_FIELDS.has(k)) return;
        const sanitized = sanitizeValue(v, k);
        if (sanitized !== undefined) {
          sanitizedObj[k] = sanitized;
        }
      });

      return sanitizedObj;
    }

    return value;
  }

  return sanitizeValue(input) as T;
}

function dedupeAndSortEvents(events: TrackingEvent[]): TrackingEvent[] {
  const map = new Map<string, TrackingEvent>();
  events.forEach((event) => {
    const key = `${event.status}|${event.location}|${event.description}|${event.eventTime}`;
    if (!map.has(key)) {
      map.set(key, event);
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    const ta = Date.parse(a.eventTime || '');
    const tb = Date.parse(b.eventTime || '');
    const sa = Number.isNaN(ta) ? 0 : ta;
    const sb = Number.isNaN(tb) ? 0 : tb;
    return sa - sb;
  });
}

export function createInitialTrackingEvents(origin: string): TrackingEvent[] {
  const now = new Date();
  const created = new Date(now.getTime() + 1000);
  return [
    {
      status: 'Shipment Received',
      location: origin || 'Origin Facility',
      description: 'Shipment has been received for processing.',
      eventTime: now.toISOString(),
    },
    {
      status: 'Shipment Created',
      location: origin || 'Origin Facility',
      description: 'Waybill has been created successfully.',
      eventTime: created.toISOString(),
    },
  ];
}

export async function createWaybill(waybill: Waybill) {
  const now = new Date().toISOString();
  const events = dedupeAndSortEvents(
    Array.isArray(waybill.trackingEvents) && waybill.trackingEvents.length > 0
      ? waybill.trackingEvents
      : createInitialTrackingEvents(waybill.origin || waybill.portOfDeparture || '')
  );

  const latest = events[events.length - 1];

  const payload: Waybill = {
    ...waybill,
    currentStatus: latest?.status || waybill.currentStatus || 'Shipment Created',
    currentLocation: latest?.location || waybill.currentLocation || waybill.origin || waybill.portOfDeparture || '',
    createdAt: waybill.createdAt || now,
    updatedAt: now,
    trackingEvents: events,
  };

  const sanitizedPayload = sanitizeForFirestoreWrite(payload);
  console.log('[createWaybill] Firestore keys:', Object.keys(sanitizedPayload as Record<string, unknown>));

  const docRef = doc(db, WAYBILLS_COLLECTION, waybill.waybillNumber);
  await setDoc(docRef, sanitizedPayload as Waybill);
}

export async function getWaybillByNumber(waybillNumber: string): Promise<Waybill | null> {
  // First try direct doc lookup (primary path for current writes)
  const byIdRef = doc(db, WAYBILLS_COLLECTION, waybillNumber);
  const byIdSnap = await getDoc(byIdRef);
  if (byIdSnap.exists()) {
    return byIdSnap.data() as Waybill;
  }

  // Backward-compatible query by waybill number field
  const q = query(
    collection(db, WAYBILLS_COLLECTION),
    where('waybillNumber', '==', waybillNumber)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as Waybill;
  }

  // Backward-compatible query by tracking number field
  const byTracking = query(
    collection(db, WAYBILLS_COLLECTION),
    where('trackingNumber', '==', waybillNumber)
  );
  const trackingSnapshot = await getDocs(byTracking);
  if (trackingSnapshot.empty) return null;
  return trackingSnapshot.docs[0].data() as Waybill;
}

export async function appendTrackingEvent(waybillNumber: string, event: TrackingEvent) {
  const docRef = doc(db, WAYBILLS_COLLECTION, waybillNumber);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return;

  const data = snap.data() as Waybill;
  const existing = Array.isArray(data.trackingEvents) ? data.trackingEvents : [];
  const merged = dedupeAndSortEvents([...existing, event]);
  const latest = merged[merged.length - 1];

  const updatePayload = sanitizeForFirestoreWrite({
    trackingEvents: merged,
    currentStatus: latest?.status || event.status,
    currentLocation: latest?.location || event.location,
    updatedAt: new Date().toISOString(),
    ...(latest?.status === 'Delivered' && { deliveredDate: latest.eventTime || new Date().toISOString() }),
  });

  await updateDoc(docRef, updatePayload as Record<string, unknown>);
}

export async function updateWaybillStatus(waybillNumber: string, status: string, location: string, description = '') {
  const docRef = doc(db, WAYBILLS_COLLECTION, waybillNumber);
  const event: TrackingEvent = {
    status,
    location,
    description: description || `Status updated to ${status}`,
    eventTime: new Date().toISOString(),
  };

  const updatePayload = sanitizeForFirestoreWrite({
    currentStatus: status,
    currentLocation: location,
    trackingEvents: arrayUnion(event),
    updatedAt: new Date().toISOString(),
    ...(status === 'Delivered' && { deliveredDate: new Date().toISOString() }),
  });

  await updateDoc(docRef, updatePayload as Record<string, unknown>);
}
