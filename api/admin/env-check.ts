import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).send('Only GET');

  res.status(200).json({
    hasSupabaseUrl:  Boolean(process.env.SUPABASE_URL),
    hasServiceRole:  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasViteUrl:      Boolean(process.env.VITE_SUPABASE_URL),
    hasViteAnon:     Boolean(process.env.VITE_SUPABASE_ANON_KEY),
  });
}
