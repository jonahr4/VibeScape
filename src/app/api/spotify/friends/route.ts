import { NextResponse } from 'next/server';
import { getFriendCandidates } from '@/services/spotify';

export async function GET() {
  try {
    const friends = await getFriendCandidates();
    return NextResponse.json({ friends });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch friends' }, { status: 500 });
  }
}

