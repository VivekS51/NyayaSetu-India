import { NextRequest } from 'next/server';
import { POST as handleSubmission } from '../submit/route';

export async function POST(req: NextRequest) {
  return handleSubmission(req);
}
