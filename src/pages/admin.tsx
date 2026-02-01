import { useState, useEffect } from 'react';

interface Order {
  id: string;
  client: string;
  services: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
  paidAt?: string;
  createdAt: string;
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [client, setClient] = useState('');
  const [services, setServices] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [copied, setCopied] = useState('');
  const [showReceipt, setShowReceipt] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('rolo_orders');
    if (saved) setOrders(JSON.parse(saved));
    
    const auth = sessionStorage.getItem('rolo_admin');
    if (auth === 'true') setAuthenticated(true);
  }, []);

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem('rolo_orders', JSON.stringify(newOrders));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '143414') {
      setAuthenticated(true);
      sessionStorage.setItem('rolo_admin', 'true');
    } else {
      alert('Wrong password');
    }
  };

  const createOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !services || !amount) return;
    
    const newOrder: Order = {
      id: Date.now().toString(36),
      client,
      services,
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    saveOrders([newOrder, ...orders]);
    setClient('');
    setServices('');
    setAmount('');
    setDate('');
  };

  const getPaymentLink = (order: Order) => {
    const params = new URLSearchParams({
      client: order.client,
      services: order.services,
      amount: order.amount.toString()
    });
    return `https://pay.expatadvisormx.com?${params.toString()}`;
  };

  const copyLink = (order: Order) => {
    navigator.clipboard.writeText(getPaymentLink(order));
    setCopied(order.id);
    setTimeout(() => setCopied(''), 2000);
  };

  const markPaid = (id: string) => {
    const updated = orders.map(o => 
      o.id === id ? { ...o, status: 'paid' as const, paidAt: new Date().toISOString() } : o
    );
    saveOrders(updated);
  };

  const markUnpaid = (id: string) => {
    const updated = orders.map(o => 
      o.id === id ? { ...o, status: 'pending' as const, paidAt: undefined } : o
    );
    saveOrders(updated);
  };

  const deleteOrder = (id: string) => {
    if (confirm('Delete this order?')) {
      saveOrders(orders.filter(o => o.id !== id));
    }
  };

  const generateReceipt = async (order: Order) => {
    const html2pdf = (await import('html2pdf.js')).default;
    
    const receiptHTML = `
      <div style="font-family: Georgia, serif; padding: 40px; max-width: 600px;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 1px solid #e5e5e5; padding-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: normal; letter-spacing: 2px; margin: 0; color: #333;">ROLANDO ROMERO</h1>
          <p style="color: #888; font-style: italic; margin: 5px 0 0 0;">Rolo for short</p>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="background: #22c55e; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Payment Receipt</span>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Client</p>
          <p style="font-size: 18px; color: #333; margin: 0;">${order.client}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Services</p>
          <p style="font-size: 16px; color: #555; margin: 0;">${order.services}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Date</p>
          <p style="font-size: 14px; color: #555; margin: 0;">${new Date(order.paidAt || order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div style="border-top: 2px solid #333; padding-top: 20px; margin-top: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #333;">Amount Paid</span>
            <span style="font-size: 28px; color: #22c55e;">$${order.amount.toLocaleString()} USD</span>
          </div>
        </div>
        
        <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #e5e5e5; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">Thank you for your payment</p>
          <p style="color: #aaa; font-size: 11px; margin: 5px 0 0 0;">Receipt #${order.id.toUpperCase()}</p>
        </div>
        
        <div style="margin-top: 40px; text-align: center;">
          <p style="color: #ccc; font-size: 10px; letter-spacing: 2px;">PUERTO VALLARTA · ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = receiptHTML;
    
    const opt = {
      margin: 0.5,
      filename: `receipt-${order.client.toLowerCase().replace(/\s+/g, '-')}-${order.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(container).save();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-sm border border-stone-200 w-full max-w-xs">
          <h1 className="text-center text-xl font-light tracking-wide text-stone-800 mb-6">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-stone-200 rounded mb-4 focus:outline-none focus:border-stone-400"
          />
          <button className="w-full bg-stone-800 text-white py-3 rounded hover:bg-stone-900 transition-colors">
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        <h1 className="text-2xl font-light tracking-wide text-stone-800 mb-8 text-center">
          ROLO ADMIN
        </h1>

        {/* Create Order Form */}
        <form onSubmit={createOrder} className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-8">
          <h2 className="text-sm uppercase tracking-wider text-stone-400 mb-4">New Order</h2>
          
          <div className="grid gap-4 mb-4">
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Client name"
              className="w-full px-4 py-3 border border-stone-200 rounded focus:outline-none focus:border-stone-400"
              required
            />
            <input
              type="text"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="Services / concept"
              className="w-full px-4 py-3 border border-stone-200 rounded focus:outline-none focus:border-stone-400"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (USD)"
                className="w-full px-4 py-3 border border-stone-200 rounded focus:outline-none focus:border-stone-400"
                required
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded focus:outline-none focus:border-stone-400 text-stone-600"
              />
            </div>
          </div>
          
          <button className="w-full bg-stone-800 text-white py-3 rounded hover:bg-stone-900 transition-colors">
            Create Order
          </button>
        </form>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 && (
            <p className="text-center text-stone-400 py-8">No orders yet</p>
          )}
          
          {orders.map(order => (
            <div key={order.id} className={`bg-white rounded-lg shadow-sm border p-4 ${order.status === 'paid' ? 'border-green-200' : 'border-stone-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-stone-800">{order.client}</p>
                  <p className="text-sm text-stone-500">{order.services}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-stone-800">${order.amount.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.status === 'paid' ? '✓ Paid' : 'Pending'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => copyLink(order)}
                  className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded transition-colors"
                >
                  {copied === order.id ? '✓ Copied!' : 'Copy Link'}
                </button>
                
                {order.status === 'pending' ? (
                  <button
                    onClick={() => markPaid(order.id)}
                    className="text-xs px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                  >
                    Mark Paid
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => markUnpaid(order.id)}
                      className="text-xs px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors"
                    >
                      Mark Unpaid
                    </button>
                    <button
                      onClick={() => generateReceipt(order)}
                      className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                    >
                      ↓ Receipt PDF
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => deleteOrder(order.id)}
                  className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-stone-300 text-xs mt-8 tracking-wider">
          PUERTO VALLARTA · MMXXVI
        </p>
      </div>
    </div>
  );
}
