import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Invoice, getInvoiceBySlug, updateInvoiceBySlug } from '@/lib/invoices';
import { paymentConfig } from '@/lib/config';
import PaymentMethods from '@/components/PaymentMethods';
import ServiceList from '@/components/ServiceList';

interface Props {
  invoice: Invoice | null;
  stripeKey: string;
}

export default function PaymentPage({ invoice, stripeKey }: Props) {
  const [loading, setLoading] = useState(false);
  const [showWire, setShowWire] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(invoice);

  if (!currentInvoice) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl text-gray-800 mb-2">Invoice not found</h1>
          <p className="text-gray-500">Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: currentInvoice.id, slug: currentInvoice.slug }),
      });
      const { sessionId } = await response.json();
      
      const stripe = await loadStripe(stripeKey);
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error processing payment. Please try again.');
    }
    setLoading(false);
  };

  const isPaid = currentInvoice.status === 'paid';
  const formattedDate = new Date(currentInvoice.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-gray-900 mb-1">Rolando Romero</h1>
          <p className="text-gray-500 italic">Better known as Rolo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="border-b border-gray-100 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Invoice for</p>
                <p className="font-semibold text-gray-900">{currentInvoice.client.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{formattedDate}</p>
                {isPaid ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          <ServiceList services={currentInvoice.services} />

          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-display text-xl text-gray-900">Total</span>
              <span className="font-display text-2xl text-forest font-semibold">
                ${currentInvoice.total.toLocaleString()} {currentInvoice.currency}
              </span>
            </div>
          </div>

          {!isPaid && (
            <div className="mt-6 space-y-4">
              <button
                onClick={handleStripePayment}
                disabled={loading}
                className="w-full bg-forest hover:bg-forest/90 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>💳</span>
                    <span>Pay ${currentInvoice.total} with Card</span>
                  </>
                )}
              </button>

              <PaymentMethods config={paymentConfig} />

              <div className="border border-gray-200 rounded-xl">
                <button
                  onClick={() => setShowWire(!showWire)}
                  className="w-full px-4 py-3 flex justify-between items-center text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  <span>🏦 Wire transfer details</span>
                  <span>{showWire ? '▲' : '▼'}</span>
                </button>
                {showWire && (
                  <div className="px-4 pb-4 text-sm text-gray-600 space-y-1">
                    <p><strong>Bank:</strong> {paymentConfig.wire.bank}</p>
                    <p><strong>CLABE:</strong> {paymentConfig.wire.clabe}</p>
                    <p><strong>SWIFT:</strong> {paymentConfig.wire.swift}</p>
                    <p><strong>Beneficiary:</strong> {paymentConfig.wire.beneficiary}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isPaid && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-800 font-semibold">✓ Payment received</p>
              <p className="text-green-600 text-sm">Thank you for your payment!</p>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <a
            href={`https://wa.me/${paymentConfig.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline text-sm"
          >
            Questions? Text Rolo on WhatsApp →
          </a>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          Rolo Payments | Colmena 2026
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  const slug = params?.slug as string;
  let invoice = getInvoiceBySlug(slug);
  
  // Handle Stripe success redirect
  if (query.paid === 'true' && invoice && invoice.status !== 'paid') {
    invoice = updateInvoiceBySlug(slug, 'paid', 'stripe');
  }

  return {
    props: {
      invoice: invoice || null,
      stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    },
  };
};
