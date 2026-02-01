import type { NextApiRequest, NextApiResponse } from 'next';
import { createInvoice } from '@/lib/invoices';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authCookie = req.cookies['rolo-admin-auth'];
  if (authCookie !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const invoice = createInvoice(req.body);
    return res.status(200).json({ invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ error: 'Failed to create invoice' });
  }
}
