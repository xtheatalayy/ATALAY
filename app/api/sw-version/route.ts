import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Per-build identifier used by the service worker to version its caches. */
export async function GET() {
  let version = '';
  for (const dir of ['.next', '.build']) {
    try {
      const file = path.join(process.cwd(), dir, 'BUILD_ID');
      if (fs.existsSync(file)) {
        version = fs.readFileSync(file, 'utf8').trim();
        if (version) break;
      }
    } catch {
      // ignore and try the next location
    }
  }

  if (!version) {
    version = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? '';
  }

  return NextResponse.json(
    { version: version || 'dev' },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } },
  );
}
