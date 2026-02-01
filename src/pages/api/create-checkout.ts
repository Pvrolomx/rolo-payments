import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { getInvoiceBySlug } from '@/lib/invoices';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.body;
    const invoice = getInvoiceBySlug(slug);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: invoice.services.map((service) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: service.description,
          },
          unit_amount: service.amount * 100,
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${req.headers.origin}/pay/${slug}?paid=true`,
      cancel_url: `${req.headers.origin}/pay/${slug}`,
      metadata: {
        invoice_id: invoice.id,
        slug: invoice.slug,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
}
