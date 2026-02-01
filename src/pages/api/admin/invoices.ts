import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getAllInvoices, 
  createInvoice, 
  updateInvoiceStatus, 
  deleteInvoice 
} from '@/lib/invoices';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const invoices = await getAllInvoices();
        return res.status(200).json(invoices);
      }

      case 'POST': {
        const { client, services, total, currency, notes } = req.body;
        
        if (!client?.name || !services?.length || !total) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const invoice = await createInvoice({
          client,
          services,
          total,
          currency,
          notes,
        });

        return res.status(201).json(invoice);
      }

      case 'PATCH': {
        const { id, status } = req.body;
        
        if (!id || !status) {
          return res.status(400).json({ error: 'Missing id or status' });
        }

        const updated = await updateInvoiceStatus(id, status, 'manual');
        
        if (!updated) {
          return res.status(404).json({ error: 'Invoice not found' });
        }

        return res.status(200).json(updated);
      }

      case 'DELETE': {
        const { id } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Missing id' });
        }

        const deleted = await deleteInvoice(id);
        
        if (!deleted) {
          return res.status(404).json({ error: 'Invoice not found' });
        }

        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
