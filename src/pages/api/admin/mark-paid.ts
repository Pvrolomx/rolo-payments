import type { NextApiRequest, NextApiResponse } from 'next';
import { updateInvoiceStatus } from '@/lib/invoices';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authCookie = req.cookies['rolo-admin-auth'];
  if (authCookie !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, method } = req.body;
  
  const invoice = updateInvoiceStatus(id, 'paid', method);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  return res.status(200).json({ invoice });
}
