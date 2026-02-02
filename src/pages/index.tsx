import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { paymentConfig } from '@/lib/config';

export default function Home() {
  const router = useRouter();
  const { client, services, amount: presetAmount } = router.query;
  
  const [amount, setAmount] = useState('');
  const [showWire, setShowWire] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [loading, setLoading] = useState(false);
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
      // Create a quick invoice and redirect to payment page
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
    alert(`${label} copied!`);
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
          
          {/* Invoice For - only if client param exists */}
          {client && (
            <div className="mb-6 pb-6 border-b border-stone-100">
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1">
                Invoice for
              </label>
              <p className="text-stone-800 font-medium">{client}</p>
            </div>
          )}

          {/* Services - only if services param exists */}
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

          {/* Download PDF - only if has invoice params */}
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
                  onClick={() => copyToClipboard(paymentConfig.zelle.email, 'Zelle email')}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm cursor-pointer hover:bg-stone-100"
                >
                  <span className="text-stone-600">Zelle</span>
                  <span className="text-stone-500 text-xs">{paymentConfig.zelle.email}</span>
                </div>
                <div 
                  onClick={() => copyToClipboard(paymentConfig.venmo.handle, 'Venmo handle')}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm cursor-pointer hover:bg-stone-100"
                >
                  <span className="text-stone-600">Venmo</span>
                  <span className="text-stone-500 text-xs">{paymentConfig.venmo.handle}</span>
                </div>
                <div 
                  onClick={() => copyToClipboard(paymentConfig.paypal.email, 'PayPal email')}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm cursor-pointer hover:bg-stone-100"
                >
                  <span className="text-stone-600">PayPal</span>
                  <span className="text-stone-500 text-xs">{paymentConfig.paypal.email}</span>
                </div>
                <div 
                  onClick={() => copyToClipboard(paymentConfig.wise.email, 'Wise email')}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm cursor-pointer hover:bg-stone-100"
                >
                  <span className="text-stone-600">Wise</span>
                  <span className="text-stone-500 text-xs">{paymentConfig.wise.email}</span>
                </div>
              </div>
            )}
          </div>

          {/* Wire Transfer */}
          <div className="border-t border-stone-100 pt-4 mt-4">
            <button
              onClick={() => setShowWire(!showWire)}
              className="w-full flex justify-between items-center text-stone-500 hover:text-stone-700 text-sm py-2"
            >
              <span>Wire Transfer</span>
              <span className="text-xs">{showWire ? '▲' : '▼'}</span>
            </button>
            
            {showWire && (
              <div className="mt-4 text-xs text-stone-500 space-y-3 font-mono">
                <div>
                  <p className="text-stone-400 uppercase tracking-wider mb-1">Beneficiary</p>
                  <p className="text-stone-700">{paymentConfig.wire.beneficiary}</p>
                  <p>{paymentConfig.wire.beneficiaryAddress}</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase tracking-wider mb-1">Bank</p>
                  <p className="text-stone-700">{paymentConfig.wire.bank}</p>
                  <p>{paymentConfig.wire.bankAddress}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => copyToClipboard(paymentConfig.wire.clabe, 'CLABE')} className="cursor-pointer hover:bg-stone-100 p-1 rounded">
                    <p className="text-stone-400 uppercase tracking-wider mb-1">CLABE</p>
                    <p className="text-stone-700">{paymentConfig.wire.clabe}</p>
                  </div>
                  <div onClick={() => copyToClipboard(paymentConfig.wire.account, 'Account')} className="cursor-pointer hover:bg-stone-100 p-1 rounded">
                    <p className="text-stone-400 uppercase tracking-wider mb-1">Account</p>
                    <p className="text-stone-700">{paymentConfig.wire.account}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => copyToClipboard(paymentConfig.wire.swift, 'SWIFT')} className="cursor-pointer hover:bg-stone-100 p-1 rounded">
                    <p className="text-stone-400 uppercase tracking-wider mb-1">SWIFT</p>
                    <p className="text-stone-700">{paymentConfig.wire.swift}</p>
                  </div>
                  <div onClick={() => copyToClipboard(paymentConfig.wire.rfc, 'RFC')} className="cursor-pointer hover:bg-stone-100 p-1 rounded">
                    <p className="text-stone-400 uppercase tracking-wider mb-1">RFC</p>
                    <p className="text-stone-700">{paymentConfig.wire.rfc}</p>
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
