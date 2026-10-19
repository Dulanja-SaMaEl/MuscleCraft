import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ exists: false }, { status: 200 });
  }

  const mediaDir = path.join(process.cwd(), 'public', 'media');
  const targetMp4 = path.join(mediaDir, `${name}.mp4`);
  const targetWebm = path.join(mediaDir, `${name}.webm`);

  const exists = fs.existsSync(targetMp4) || fs.existsSync(targetWebm);

  return NextResponse.json({ exists }, { status: 200 });
}
