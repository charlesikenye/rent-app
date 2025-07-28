import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { tenant_id, due_date, amount, paid_date, method, status } = req.body;
    const { data, error } = await supabase
      .from('payments')
      .insert([{ tenant_id, due_date, amount, paid_date, method, status }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
