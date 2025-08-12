import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
  const url = process.env.https://iabapdubybicoegeswvq.supabase.co!;
  const key = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYmFwZHVieWJpY29lZ2Vzd3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk4NDQwMCwiZXhwIjoyMDcwNTYwNDAwfQ.aO7WylE1VieZVhSpmf91FGuXlPOaGVeVm6zvVHuWLpI!;
  return createClient(url, key, { global: { fetch } });
}
