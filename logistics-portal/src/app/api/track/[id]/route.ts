import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const q = query(collection(db, 'waybills'), where('waybillNumber', '==', id.trim()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const waybill = querySnapshot.docs[0].data();
      return NextResponse.json(waybill);
    } else {
      return NextResponse.json({ error: 'Waybill not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read waybills' }, { status: 500 });
  }
}
