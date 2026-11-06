import { env } from 'cloudflare:workers';
import { OnlineGameService } from '../../../server/online-service.mjs';

export const dynamic = 'force-dynamic';
export function GET(request: Request) { return new OnlineGameService(env.DB).handle(request); }
export function POST(request: Request) { return new OnlineGameService(env.DB).handle(request); }
export function OPTIONS() { return new Response(null, {status:405}); }
