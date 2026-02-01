import { useState } from 'react';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [showWire, setShowWire] = useState(false);
  
  const STRIPE_LINK = 'https://buy.stripe.com/6oU00leem9wpeg3cpR5Vu01';

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-light tracking-wide text-stone-800 mb-1">
            ROLANDO ROMERO
          </h1>
          <p className="text-stone-400 text-sm italic">Advisory Services</p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
          
          {/* Amount */}
          <div className="mb-8">
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Amount
            </label>
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
          </div>

          {/* Pay Button */}
          <a
            href={STRIPE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-stone-800 hover:bg-stone-900 text-white text-center py-4 rounded transition-colors mb-6"
          >
            Pay with Card
          </a>

          {/* Wire Transfer */}
          <div className="border-t border-stone-100 pt-6">
            <button
              onClick={() => setShowWire(!showWire)}
              className="w-full flex justify-between items-center text-stone-500 hover:text-stone-700 text-sm"
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
