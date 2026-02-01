import { useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const { client, services, amount: presetAmount } = router.query;
  
  const [amount, setAmount] = useState('');
  const [showWire, setShowWire] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const STRIPE_LINK = 'https://buy.stripe.com/6oU00leem9wpeg3cpR5Vu01';
  
  const displayAmount = presetAmount ? String(presetAmount) : amount;
  const hasInvoice = client || services || presetAmount;

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
            <span style="font-size: 28px; color: #333;">$${presetAmount || '0'} USD</span>
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
          <a
            href={STRIPE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-stone-800 hover:bg-stone-900 text-white text-center py-4 rounded transition-colors mb-4"
          >
            Pay with Card
          </a>

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
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm">
                  <span className="text-stone-600">Wise</span>
                  <span className="text-stone-400 text-xs">Coming soon</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm">
                  <span className="text-stone-600">Zelle</span>
                  <span className="text-stone-400 text-xs">Coming soon</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm">
                  <span className="text-stone-600">PayPal</span>
                  <span className="text-stone-400 text-xs">Coming soon</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded text-sm">
                  <span className="text-stone-600">Venmo</span>
                  <span className="text-stone-400 text-xs">Coming soon</span>
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
                  <p className="text-stone-700">Rolando Romero García</p>
                  <p>Brasil 1434, 5 de Diciembre</p>
                  <p>Puerto Vallarta, Jalisco, 48350</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase tracking-wider mb-1">Bank</p>
                  <p className="text-stone-700">Banamex</p>
                  <p>Paseo de los Cocoteros 85, Local C-1</p>
                  <p>Paradise Plaza, Nuevo Vallarta, Nayarit, 63732</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-stone-400 uppercase tracking-wider mb-1">CLABE</p>
                    <p className="text-stone-700">002375701679195789</p>
                  </div>
                  <div>
                    <p className="text-stone-400 uppercase tracking-wider mb-1">Account</p>
                    <p className="text-stone-700">7016000007919578</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-stone-400 uppercase tracking-wider mb-1">SWIFT</p>
                    <p className="text-stone-700">BNMXMXMM</p>
                  </div>
                  <div>
                    <p className="text-stone-400 uppercase tracking-wider mb-1">RFC</p>
                    <p className="text-stone-700">ROGR660427SK8</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-stone-300 text-xs mt-8 tracking-wider">
          PUERTO VALLARTA · MMXXVI
        </p>
      </div>
    </div>
  );
}
