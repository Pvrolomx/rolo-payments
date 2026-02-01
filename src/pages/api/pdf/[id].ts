import type { NextApiRequest, NextApiResponse } from 'next';
import { getInvoiceById } from '@/lib/invoices';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const invoice = getInvoiceById(id as string);

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
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #2D5A3D; }
    .header h1 { font-size: 28px; font-weight: 600; margin-bottom: 4px; }
    .header p { color: #6b6b6b; font-style: italic; }
    .badge { display: inline-block; background: #E8F0EA; color: #2D5A3D; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .info { margin-bottom: 30px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .info-label { color: #6b6b6b; }
    .services { margin: 30px 0; }
    .services h3 { font-size: 14px; color: #6b6b6b; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .service { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e5e5; }
    .service:last-child { border-bottom: none; }
    .total { display: flex; justify-content: space-between; padding: 20px 0; border-top: 2px solid #1a1a1a; margin-top: 20px; }
    .total span:first-child { font-size: 18px; font-weight: 600; }
    .total span:last-child { font-size: 24px; font-weight: 700; color: #2D5A3D; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #6b6b6b; font-size: 12px; }
    .footer p { margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rolando Romero</h1>
    <p>Better known as Rolo</p>
    <div class="badge">✓ PAID</div>
  </div>

  <div class="info">
    <div class="info-row">
      <span class="info-label">Client</span>
      <span>${invoice.client.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Invoice Date</span>
      <span>${formattedDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Payment Date</span>
      <span>${paidDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Payment Method</span>
      <span style="text-transform: capitalize;">${invoice.payment_method || 'Card'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Reference</span>
      <span>${invoice.id}</span>
    </div>
  </div>

  <div class="services">
    <h3>Services</h3>
    ${invoice.services.map(s => `
      <div class="service">
        <span>${s.description}</span>
        <span>$${s.amount.toFixed(2)}</span>
      </div>
    `).join('')}
  </div>

  <div class="total">
    <span>Total Paid</span>
    <span>$${invoice.total.toFixed(2)} ${invoice.currency}</span>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Questions? Contact rolo@expatadvisormx.com</p>
    <p style="margin-top: 12px;">expatadvisormx.com</p>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `inline; filename="receipt-${invoice.slug}.html"`);
  res.status(200).send(html);
}
