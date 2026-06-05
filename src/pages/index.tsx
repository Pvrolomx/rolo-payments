import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { paymentConfig } from '@/lib/config';

type WireType = 'domestic' | 'international' | null;

export default function Home() {
  const router = useRouter();
  const { client, services, amount: presetAmount } = router.query;
  
  const [amount, setAmount] = useState('');
  const [wireType, setWireType] = useState<WireType>(null);
  const [showOther, setShowOther] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const displayAmount = presetAmount ? String(presetAmount) : amount;
  const hasInvoice = client || services || presetAmount;
  const canPay = displayAmount && parseFloat(displayAmount) > 0;

  const handlePayWithCard = async () => {
    if (!canPay) {
      alert('Please enter an amount');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { name: client?.toString() || 'Quick Payment' },
          services: [{ 
            description: services?.toString() || 'Payment', 
            amount: parseFloat(displayAmount) 
          }],
          total: parseFloat(displayAmount),
          currency: 'USD',
        }),
      });
      
      if (res.ok) {
        const invoice = await res.json();
        router.push(`/pay/${invoice.slug}`);
      } else {
        alert('Error creating payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error creating payment. Please try again.');
    }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    
    const invoiceHTML = `
      <div style="font-family: Georgia, serif; padding: 40px; max-width: 600px;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 1px solid #e5e5e5; padding-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: normal; letter-spacing: 2px; margin: 0; color: #333;">ROLANDO ROMERO</h1>
          <p style="color: #888; font-style: italic; margin: 5px 0 0 0;">Rolo for short</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Invoice for</p>
          <p style="font-size: 18px; color: #333; margin: 0;">${client || 'Client'}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Services</p>
          <p style="font-size: 16px; color: #555; margin: 0;">${services || 'Advisory Services'}</p>
        </div>
        
        <div style="border-top: 2px solid #333; padding-top: 20px; margin-top: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #333;">Total</span>
            <span style="font-size: 28px; color: #333;">$${displayAmount || '0'} USD</span>
          </div>
        </div>
        
        <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Payment</p>
          <p style="font-size: 14px; color: #555; margin: 0;">pay.expatadvisormx.com</p>
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
      filename: `invoice-${client?.toString().toLowerCase().replace(/\s+/g, '-') || 'rolo'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(container).save();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  // Domestic wire info (MX transfers)
  const getDomesticWireText = () => {
    return `Beneficiario: ${paymentConfig.wire.beneficiary}
Banco: ${paymentConfig.wire.bank}
CLABE: ${paymentConfig.wire.clabe}
Cuenta: ${paymentConfig.wire.account}
RFC: ${paymentConfig.wire.rfc}`;
  };

  // International wire info
  const getInternationalWireText = () => {
    return `Beneficiary: ${paymentConfig.wire.beneficiary}
Address: ${paymentConfig.wire.beneficiaryAddress}

Bank: ${paymentConfig.wire.bank}
Bank Address: ${paymentConfig.wire.bankAddress}
SWIFT: ${paymentConfig.wire.swift}
CLABE: ${paymentConfig.wire.clabe}
Account: ${paymentConfig.wire.account}
RFC: ${paymentConfig.wire.rfc}`;
  };

  const toggleWireType = (type: WireType) => {
    setWireType(wireType === type ? null : type);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-light tracking-wide text-stone-800 mb-1">
            ROLANDO ROMERO
          </h1>
          <p className="text-stone-400 text-sm italic">Rolo for short</p>
        </div>

        {/* Payment Card */}
        <div ref={invoiceRef} className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
          
          {/* Invoice For */}
          {client && (
            <div className="mb-6 pb-6 border-b border-stone-100">
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1">
                Invoice for
              </label>
              <p className="text-stone-800 font-medium">{client}</p>
            </div>
          )}

          {/* Services */}
          {services && (
            <div className="mb-6 pb-6 border-b border-stone-100">
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1">
                Services
              </label>
              <p className="text-stone-700">{services}</p>
            </div>
          )}

          {/* Amount */}
          <div className="mb-8">
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              {hasInvoice ? 'Total' : 'Amount'}
            </label>
            {presetAmount ? (
              <div className="flex items-center">
                <span className="text-3xl text-stone-800 font-light">${presetAmount}</span>
                <span className="text-stone-400 text-sm ml-2">USD</span>
              </div>
            ) : (
              <div className="flex items-center border-b-2 border-stone-200 focus-within:border-stone-400 transition-colors">
                <span className="text-2xl text-stone-300 mr-2">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 text-2xl text-stone-800 py-2 focus:outline-none bg-transparent"
                />
                <span className="text-stone-400 text-sm">USD</span>
              </div>
            )}
          </div>

          {/* Download PDF */}
          {hasInvoice && (
            <button
              onClick={handleDownloadPDF}
              className="w-full border border-stone-200 hover:bg-stone-50 text-stone-600 text-center py-3 rounded transition-colors mb-4 text-sm"
            >
              ↓ Download PDF
            </button>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePayWithCard}
            disabled={loading || !canPay}
            className={`block w-full text-white text-center py-4 rounded transition-colors mb-4 ${
              canPay ? 'bg-stone-800 hover:bg-stone-900' : 'bg-stone-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : 'Pay with Card'}
          </button>

          {/* Other Payment Methods */}
          <div className="border-t border-stone-100 pt-4">
            <button
              onClick={() => setShowOther(!showOther)}
              className="w-full flex justify-between items-center text-stone-500 hover:text-stone-700 text-sm py-2"
            >
              <span>Other Payment Methods</span>
              <span className="text-xs">{showOther ? '▲' : '▼'}</span>
            </button>
            
            {showOther && (
              <div className="mt-3 space-y-2">
                <div 
                  onClick={() => copyToClipboard(paymentConfig.zelle.email, 'Zelle')}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm cursor-pointer hover:bg-stone-100"
                >
                  <span className="text-stone-600">Zelle</span>
                  <span className="text-stone-500 text-xs">
                    {copied === 'Zelle' ? '✓ Copied!' : paymentConfig.zelle.email}
                  </span>
                </div>
                <div 
                  onClick={() => copyToClipboard(paymentConfig.venmo.handle, 'Venmo')}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm cursor-pointer hover:bg-stone-100"
                >
                  <span className="text-stone-600">Venmo</span>
                  <span className="text-stone-500 text-xs">
                    {copied === 'Venmo' ? '✓ Copied!' : paymentConfig.venmo.handle}
                  </span>
                </div>
                <div 
                  onClick={() => copyToClipboard(paymentConfig.paypal.email, 'PayPal')}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm cursor-pointer hover:bg-stone-100"
                >
                  <span className="text-stone-600">PayPal</span>
                  <span className="text-stone-500 text-xs">
                    {copied === 'PayPal' ? '✓ Copied!' : paymentConfig.paypal.email}
                  </span>
                </div>
                <div 
                  onClick={() => copyToClipboard(paymentConfig.wise.email, 'Wise')}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm cursor-pointer hover:bg-stone-100"
                >
                  <span className="text-stone-600">Wise</span>
                  <span className="text-stone-500 text-xs">
                    {copied === 'Wise' ? '✓ Copied!' : paymentConfig.wise.email}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Wire Transfer - Two Options */}
          <div className="border-t border-stone-100 pt-4 mt-4">
            <p className="text-stone-500 text-sm py-2">Wire Transfer</p>
            
            {/* Two buttons for wire type */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => toggleWireType('domestic')}
                className={`py-3 px-4 text-sm rounded border transition-colors ${
                  wireType === 'domestic' 
                    ? 'border-stone-800 bg-stone-800 text-white' 
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                🇲🇽 Doméstica
              </button>
              <button
                onClick={() => toggleWireType('international')}
                className={`py-3 px-4 text-sm rounded border transition-colors ${
                  wireType === 'international' 
                    ? 'border-stone-800 bg-stone-800 text-white' 
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                🌎 International
              </button>
            </div>

            {/* Domestic Wire Info */}
            {wireType === 'domestic' && (
              <div className="mt-4 p-4 bg-stone-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase tracking-wider text-stone-400">Transferencia Nacional</span>
                  <button
                    onClick={() => copyToClipboard(getDomesticWireText(), 'DomesticWire')}
                    className="text-xs bg-stone-800 text-white px-3 py-1 rounded hover:bg-stone-900 transition-colors"
                  >
                    {copied === 'DomesticWire' ? '✓ Copiado!' : 'Copiar todo'}
                  </button>
                </div>
                <div className="text-xs text-stone-500 space-y-2 font-mono">
                  <div>
                    <p className="text-stone-400 uppercase tracking-wider mb-1">Beneficiario</p>
                    <p className="text-stone-700">{paymentConfig.wire.beneficiary}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 uppercase tracking-wider mb-1">Banco</p>
                    <p className="text-stone-700">{paymentConfig.wire.bank}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">CLABE</p>
                      <p className="text-stone-700">{paymentConfig.wire.clabe}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">Cuenta</p>
                      <p className="text-stone-700">{paymentConfig.wire.account}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-stone-400 uppercase tracking-wider mb-1">RFC</p>
                    <p className="text-stone-700">{paymentConfig.wire.rfc}</p>
                  </div>
                </div>
              </div>
            )}

            {/* International Wire Info */}
            {wireType === 'international' && (
              <div className="mt-4 p-4 bg-stone-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase tracking-wider text-stone-400">International Wire</span>
                  <button
                    onClick={() => copyToClipboard(getInternationalWireText(), 'IntlWire')}
                    className="text-xs bg-stone-800 text-white px-3 py-1 rounded hover:bg-stone-900 transition-colors"
                  >
                    {copied === 'IntlWire' ? '✓ Copied!' : 'Copy all'}
                  </button>
                </div>
                <div className="text-xs text-stone-500 space-y-3 font-mono">
                  <div>
                    <p className="text-stone-400 uppercase tracking-wider mb-1">Beneficiary</p>
                    <p className="text-stone-700">{paymentConfig.wire.beneficiary}</p>
                    <p className="text-stone-500 mt-1">{paymentConfig.wire.beneficiaryAddress}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 uppercase tracking-wider mb-1">Bank</p>
                    <p className="text-stone-700">{paymentConfig.wire.bank}</p>
                    <p className="text-stone-500 mt-1">{paymentConfig.wire.bankAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">SWIFT</p>
                      <p className="text-stone-700">{paymentConfig.wire.swift}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">CLABE</p>
                      <p className="text-stone-700">{paymentConfig.wire.clabe}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">Account</p>
                      <p className="text-stone-700">{paymentConfig.wire.account}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 uppercase tracking-wider mb-1">RFC</p>
                      <p className="text-stone-700">{paymentConfig.wire.rfc}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-stone-300 text-xs mt-8 tracking-wider">
          PUERTO VALLARTA · <a href="/admin" className="hover:text-stone-400">MMXXVI</a>
        </p>
      </div>
    </div>
  );
}
