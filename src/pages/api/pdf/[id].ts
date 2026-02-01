import type { NextApiRequest, NextApiResponse } from 'next';
import { getInvoiceById } from '@/lib/invoices';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const invoice = await getInvoiceById(id as string);

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const formattedDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const paidDate = invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${invoice.client.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #78716c; }
    .header h1 { font-size: 28px; font-weight: 300; margin-bottom: 4px; letter-spacing: 2px; }
    .header p { color: #a8a29e; font-style: italic; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .info { margin-bottom: 30px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .info-label { color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .services { margin: 30px 0; }
    .services h3 { font-size: 12px; color: #78716c; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .service { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e7e5e4; }
    .service:last-child { border-bottom: none; }
    .total { display: flex; justify-content: space-between; padding: 20px 0; border-top: 2px solid #1c1917; margin-top: 20px; }
    .total span:first-child { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .total span:last-child { font-size: 24px; font-weight: 300; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e7e5e4; text-align: center; color: #a8a29e; font-size: 11px; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ROLANDO ROMERO</h1>
    <p>Rolo for short</p>
    ${invoice.status === 'paid' ? '<div class="badge">✓ PAID</div>' : ''}
  </div>

  <div class="info">
    <div class="info-row">
      <span class="info-label">Client</span>
      <span>${invoice.client.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Date</span>
      <span>${formattedDate}</span>
    </div>
    ${paidDate ? `<div class="info-row"><span class="info-label">Paid</span><span>${paidDate}</span></div>` : ''}
  </div>

  <div class="services">
    <h3>Services</h3>
    ${invoice.services.map(s => `
      <div class="service">
        <span>${s.description}</span>
        <span>$${s.amount.toLocaleString()}</span>
      </div>
    `).join('')}
  </div>

  <div class="total">
    <span>Total</span>
    <span>$${invoice.total.toLocaleString()} ${invoice.currency}</span>
  </div>

  <div class="footer">
    <p>PUERTO VALLARTA · MMXXVI</p>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
