import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Invoice, getInvoiceBySlug, updateInvoiceBySlug } from '@/lib/invoices';
import { paymentConfig } from '@/lib/config';

interface Props {
  invoice: Invoice | null;
  stripeKey: string;
}

const translations = {
  en: {
    invoiceFor: 'Invoice for',
    services: 'Services',
    total: 'Total',
    paid: 'Paid',
    pending: 'Pending',
    payWithCard: 'Pay with Card',
    processing: 'Processing...',
    downloadPdf: 'Download PDF Invoice',
    otherMethods: 'Other Payment Methods',
    wireTransfer: 'Wire Transfer',
    paymentReceived: 'Payment received',
    thankYou: 'Thank you!',
    notFound: 'Invoice not found',
    checkLink: 'Please check the link and try again.',
    bank: 'Bank',
    beneficiary: 'Beneficiary',
  },
  es: {
    invoiceFor: 'Factura para',
    services: 'Servicios',
    total: 'Total',
    paid: 'Pagado',
    pending: 'Pendiente',
    payWithCard: 'Pagar con Tarjeta',
    processing: 'Procesando...',
    downloadPdf: 'Descargar PDF',
    otherMethods: 'Otros Métodos de Pago',
    wireTransfer: 'Transferencia Bancaria',
    paymentReceived: 'Pago recibido',
    thankYou: '¡Gracias!',
    notFound: 'Factura no encontrada',
    checkLink: 'Por favor verifica el enlace e intenta de nuevo.',
    bank: 'Banco',
    beneficiary: 'Beneficiario',
  }
};

export default function PaymentPage({ invoice, stripeKey }: Props) {
  const [loading, setLoading] = useState(false);
  const [showWire, setShowWire] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [lang, setLang] = useState<'en' | 'es'>('en');

  const t = translations[lang];

  if (!invoice) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light text-stone-800 mb-2">{t.notFound}</h1>
          <p className="text-stone-500">{t.checkLink}</p>
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
        body: JSON.stringify({ slug: invoice.slug }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }
      
      const stripe = await loadStripe(stripeKey);
      await stripe?.redirectToCheckout({ sessionId: data.sessionId });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error processing payment. Please try again.');
    }
    setLoading(false);
  };

  const isPaid = invoice.status === 'paid';
  const formattedDate = new Date(invoice.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleDownloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    
    const invoiceHTML = `
      <div style="font-family: Georgia, serif; padding: 40px; max-width: 600px;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 1px solid #e5e5e5; padding-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: normal; letter-spacing: 2px; margin: 0; color: #333;">ROLANDO ROMERO</h1>
          <p style="color: #888; font-style: italic; margin: 5px 0 0 0;">Rolo for short</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">${t.invoiceFor}</p>
          <p style="font-size: 18px; color: #333; margin: 0;">${invoice.client.name}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">${t.services}</p>
          ${invoice.services.map(s => `<p style="font-size: 14px; color: #555; margin: 2px 0;">${s.description} - $${s.amount}</p>`).join('')}
        </div>
        
        <div style="border-top: 2px solid #333; padding-top: 20px; margin-top: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #333;">${t.total}</span>
            <span style="font-size: 28px; color: #333;">$${invoice.total.toLocaleString()} ${invoice.currency}</span>
          </div>
        </div>
        
        <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Payment</p>
          <p style="font-size: 14px; color: #555; margin: 0;">pay.expatadvisormx.com/pay/${invoice.slug}</p>
        </div>
        
        <div style="margin-top: 60px; text-align: center;">
          <p style="color: #ccc; font-size: 10px; letter-spacing: 2px;">PUERTO VALLARTA · ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = invoiceHTML;
    
    const opt = {
      margin: 0.5,
      filename: `invoice-${invoice.slug}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(container).save();
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-lg border border-stone-200 bg-white p-1 text-sm">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-md transition-colors ${lang === 'en' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-700'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('es')}
              className={`px-3 py-1 rounded-md transition-colors ${lang === 'es' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-700'}`}
            >
              ES
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-light tracking-wide text-stone-800 mb-1">
            ROLANDO ROMERO
          </h1>
          <p className="text-stone-400 text-sm italic">Rolo for short</p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
          
          {/* Client & Date */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-stone-100">
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1">
                {t.invoiceFor}
              </label>
              <p className="text-stone-800 font-medium">{invoice.client.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">{formattedDate}</p>
              <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {isPaid ? `✓ ${t.paid}` : t.pending}
              </span>
            </div>
          </div>

          {/* Services */}
          <div className="mb-6 pb-6 border-b border-stone-100">
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              {t.services}
            </label>
            <div className="space-y-2">
              {invoice.services.map((service, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-stone-700">{service.description}</span>
                  <span className="text-stone-600">${service.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <label className="text-xs uppercase tracking-wider text-stone-400">{t.total}</label>
              <div className="flex items-center">
                <span className="text-3xl text-stone-800 font-light">${invoice.total.toLocaleString()}</span>
                <span className="text-stone-400 text-sm ml-2">{invoice.currency}</span>
              </div>
            </div>
          </div>

          {isPaid ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">✓ {t.paymentReceived}</p>
              <p className="text-green-600 text-sm">{t.thankYou}</p>
            </div>
          ) : (
            <>
              {/* Download PDF */}
              <button
                onClick={handleDownloadPDF}
                className="w-full border border-stone-200 hover:bg-stone-50 text-stone-600 text-center py-3 rounded transition-colors mb-4 text-sm"
              >
                ↓ {t.downloadPdf}
              </button>

              {/* Pay Button */}
              <button
                onClick={handleStripePayment}
                disabled={loading}
                className="w-full bg-stone-800 hover:bg-stone-900 text-white text-center py-4 rounded transition-colors mb-4 disabled:opacity-50"
              >
                {loading ? t.processing : `${t.payWithCard} $${invoice.total.toLocaleString()}`}
              </button>

              {/* Other Payment Methods */}
              <div className="border-t border-stone-100 pt-4">
                <button
                  onClick={() => setShowOther(!showOther)}
                  className="w-full flex justify-between items-center text-stone-500 hover:text-stone-700 text-sm py-2"
                >
                  <span>{t.otherMethods}</span>
                  <span className="text-xs">{showOther ? '▲' : '▼'}</span>
                </button>
                
                {showOther && (
                  <div className="mt-3 space-y-2">
                    {paymentConfig.zelle?.email && (
                      <div className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm">
                        <span className="text-stone-600">Zelle</span>
                        <span className="text-stone-500 text-xs">{paymentConfig.zelle.email}</span>
                      </div>
                    )}
                    {paymentConfig.venmo?.handle && (
                      <div className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm">
                        <span className="text-stone-600">Venmo</span>
                        <span className="text-stone-500 text-xs">{paymentConfig.venmo.handle}</span>
                      </div>
                    )}
                    {paymentConfig.paypal?.email && (
                      <div className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm">
                        <span className="text-stone-600">PayPal</span>
                        <span className="text-stone-500 text-xs">{paymentConfig.paypal.email}</span>
                      </div>
                    )}
                    {paymentConfig.wise?.email && (
                      <div className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm">
                        <span className="text-stone-600">Wise</span>
                        <span className="text-stone-500 text-xs">{paymentConfig.wise.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wire Transfer */}
              <div className="border-t border-stone-100 pt-4 mt-4">
                <button
                  onClick={() => setShowWire(!showWire)}
                  className="w-full flex justify-between items-center text-stone-500 hover:text-stone-700 text-sm py-2"
                >
                  <span>{t.wireTransfer}</span>
                  <span className="text-xs">{showWire ? '▲' : '▼'}</span>
                </button>
                
                {showWire && (
                  <div className="mt-4 text-xs text-stone-500 space-y-3 font-mono">
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">{t.beneficiary}</p>
                      <p className="text-stone-700">{paymentConfig.wire.beneficiary}</p>
                      <p className="text-stone-500 text-[10px] mt-1">{paymentConfig.wire.beneficiaryAddress}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">{t.bank}</p>
                      <p className="text-stone-700">{paymentConfig.wire.bank}</p>
                      <p className="text-stone-500 text-[10px] mt-1">{paymentConfig.wire.bankAddress}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">SWIFT</p>
                      <p className="text-stone-700">{paymentConfig.wire.swift}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">CLABE</p>
                      <p className="text-stone-700">{paymentConfig.wire.clabe}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">Account</p>
                      <p className="text-stone-700">{paymentConfig.wire.account}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">RFC (Tax ID)</p>
                      <p className="text-stone-700">{paymentConfig.wire.rfc}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-stone-300 text-xs mt-8 tracking-wider">
          PUERTO VALLARTA · MMXXVI
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  const slug = params?.slug as string;
  let invoice = await getInvoiceBySlug(slug);
  
  if (query.paid === 'true' && invoice && invoice.status !== 'paid') {
    invoice = await updateInvoiceBySlug(slug, 'paid', 'stripe');
  }

  return {
    props: {
      invoice: invoice || null,
      stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    },
  };
};
