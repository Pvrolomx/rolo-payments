import { useState } from 'react';
import { useRouter } from 'next/router';

const content = {
  en: {
    title: 'Rolo Payments',
    subtitle: 'Simple payments for advisory services',
    invoiceOption: 'I have an invoice code',
    invoicePlaceholder: 'Enter code (e.g. abc123)',
    invoiceButton: 'View Invoice',
    quickOption: 'Quick Payment',
    quickDesc: 'Pay any amount directly',
    quickButton: 'Pay Now',
    or: 'or',
    whatsapp: 'Questions? Text Rolo on WhatsApp',
    footer: 'Rolo Payments | Colmena 2026'
  },
  es: {
    title: 'Rolo Payments',
    subtitle: 'Pagos simples por servicios de asesoría',
    invoiceOption: 'Tengo código de invoice',
    invoicePlaceholder: 'Ingresa código (ej. abc123)',
    invoiceButton: 'Ver Invoice',
    quickOption: 'Pago Rápido',
    quickDesc: 'Paga cualquier monto directamente',
    quickButton: 'Pagar Ahora',
    or: 'o',
    whatsapp: '¿Dudas? Escríbele a Rolo por WhatsApp',
    footer: 'Rolo Payments | Colmena 2026'
  }
};

export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  
  const t = content[lang];
  const STRIPE_LINK = 'https://buy.stripe.com/6oU00leem9wpeg3cpR5Vu01';
  const WHATSAPP = '523221234567'; // Update with real number

  const handleInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/pay/${code.trim().toLowerCase()}`);
    } else {
      setError(lang === 'en' ? 'Please enter a code' : 'Ingresa un código');
    }
  };

  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded-full"
          >
            {lang === 'en' ? '🇲🇽 Español' : '🇺🇸 English'}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-gray-900 mb-1">{t.title}</h1>
          <p className="text-gray-500 italic">{t.subtitle}</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
          
          {/* Option 1: Invoice Code */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📄</span> {t.invoiceOption}
            </h2>
            <form onSubmit={handleInvoice} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder={t.invoicePlaceholder}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/50"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                {t.invoiceButton} →
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-gray-400 text-sm">{t.or}</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Option 2: Quick Payment */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>💳</span> {t.quickOption}
            </h2>
            <p className="text-gray-500 text-sm mb-3">{t.quickDesc}</p>
            <a
              href={STRIPE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-forest hover:bg-forest/90 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-center"
            >
              {t.quickButton} →
            </a>
          </div>
        </div>

        {/* WhatsApp Link */}
        <div className="text-center mt-6">
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline text-sm"
          >
            {t.whatsapp} →
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          {t.footer}
        </p>
      </div>
    </div>
  );
}
