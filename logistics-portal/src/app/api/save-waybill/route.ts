import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const waybill = await request.json();

    const newWaybill = {
      ...waybill,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      trackingEvents: [
        {
          status: 'Shipment Created',
          eventTime: new Date().toISOString(),
          location: waybill.origin,
          description: 'The shipment has been created and is ready for pickup.',
        },
      ],
    };

    await addDoc(collection(db, 'waybills'), newWaybill);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save waybill', details: error?.toString() }, { status: 500 });
  }
}
