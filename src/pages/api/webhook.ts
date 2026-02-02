import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { updateInvoiceBySlug, getInvoiceBySlug } from '@/lib/invoices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

// Función para enviar notificación de pago
async function sendPaymentNotification(slug: string, amount: number, currency: string, clientName: string) {
  try {
    const response = await fetch('https://email.duendes.app/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'pvrolomx@yahoo.com.mx',
        subject: `💰 Pago recibido - $${amount} ${currency}`,
        message: `Se ha recibido un pago exitoso:

` +
          `Cliente: ${clientName}
` +
          `Monto: $${amount} ${currency}
` +
          `Invoice: ${slug}
` +
          `Método: Stripe
` +
          `Fecha: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}

` +
          `Ver detalles: https://pay.expatadvisormx.com/admin`,
        name: 'Rolo Payments'
      }),
    });
    const result = await response.json();
    console.log('Email notification sent:', result);
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const slug = session.metadata?.slug;
      
      if (slug) {
        console.log(`Payment completed for invoice: ${slug}`);
        
        // Obtener datos del invoice para el email
        const invoice = await getInvoiceBySlug(slug);
        
        // Actualizar status
        await updateInvoiceBySlug(slug, 'paid', 'stripe');
        
        // Enviar notificación por email
        if (invoice) {
          await sendPaymentNotification(
            slug,
            invoice.total,
            invoice.currency,
            invoice.client.name
          );
        }
      }
      break;
    }
    
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
      break;
    }
    
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent failed: ${paymentIntent.id}`);
      break;
    }
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}
