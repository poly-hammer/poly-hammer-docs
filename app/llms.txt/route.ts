import { agentIndex, markdownResponse } from '@/lib/agents';
export async function GET() { return markdownResponse(agentIndex(), 'text/plain; charset=utf-8'); }
