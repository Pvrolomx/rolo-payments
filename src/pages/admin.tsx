import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { Invoice, Service, getAllInvoices, createInvoice, updateInvoiceStatus, deleteInvoice } from '@/lib/invoices';

interface Props {
  initialInvoices: Invoice[];
  isConfigured: boolean;
}

export default function Admin({ initialInvoices, isConfigured }: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'MXN'>('USD');
  const [copied, setCopied] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (res.ok) {
        setAuthenticated(true);
        sessionStorage.setItem('rolo_admin', 'true');
      } else {
        alert('Wrong password');
      }
    } catch (error) {
      alert('Error authenticating');
    }
    setLoading(false);
  };

  const addService = () => {
    if (!serviceDesc || !serviceAmount) return;
    setServices([...services, { 
      description: serviceDesc, 
      amount: parseFloat(serviceAmount) 
    }]);
    setServiceDesc('');
    setServiceAmount('');
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const getTotal = () => services.reduce((sum, s) => sum + s.amount, 0);

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setServices([]);
    setServiceDesc('');
    setServiceAmount('');
    setNotes('');
    setCurrency('USD');
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || services.length === 0) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { name: clientName, email: clientEmail || undefined },
          services,
          total: getTotal(),
          currency,
          notes: notes || undefined,
        }),
      });
      
      if (res.ok) {
        const newInvoice = await res.json();
        setInvoices([newInvoice, ...invoices]);
        // Reset form
        setClientName('');
        setClientEmail('');
        setServices([]);
        setNotes('');
      }
    } catch (error) {
      alert('Error creating invoice');
    }
    setLoading(false);
  };

  const getPaymentLink = (invoice: Invoice) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pay.expatadvisormx.com';
    return `${baseUrl}/pay/${invoice.slug}`;
  };

  const copyLink = (invoice: Invoice) => {
    navigator.clipboard.writeText(getPaymentLink(invoice));
    setCopied(invoice.id);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'paid' }),
      });
      
      if (res.ok) {
        setInvoices(invoices.map(inv => 
          inv.id === id ? { ...inv, status: 'paid', paid_at: new Date().toISOString(), payment_method: 'manual' } : inv
        ));
      }
    } catch (error) {
      alert('Error updating invoice');
    }
  };

  const handleMarkUnpaid = async (id: string) => {
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'pending' }),
      });
      
      if (res.ok) {
        setInvoices(invoices.map(inv => 
          inv.id === id ? { ...inv, status: 'pending', paid_at: null, payment_method: null } : inv
        ));
      }
    } catch (error) {
      alert('Error updating invoice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (res.ok) {
        setInvoices(invoices.filter(inv => inv.id !== id));
      }
    } catch (error) {
      alert('Error deleting invoice');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('rolo_admin');
    setAuthenticated(false);
  };

  // Check session on mount
  useEffect(() => {
    if (sessionStorage.getItem('rolo_admin') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-sm border border-stone-200 w-full max-w-xs">
          <h1 className="text-center text-xl font-light tracking-wide text-stone-800 mb-6">Admin</h1>
          {!isConfigured && (
            <p className="text-amber-600 text-xs mb-4 text-center">
              ⚠️ Supabase not configured. Data won't persist.
            </p>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-stone-200 rounded mb-4 focus:outline-none focus:border-stone-400"
            disabled={loading}
          />
          <button 
            disabled={loading}
            className="w-full bg-stone-800 text-white py-3 rounded hover:bg-stone-900 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Enter'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-stone-800">ROLO ADMIN</h1>
            {!isConfigured && (
              <p className="text-amber-600 text-xs mt-1">⚠️ Running without database</p>
            )}
          </div>
          <button
            onClick={logout}
            className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Create Invoice Form */}
        <form onSubmit={handleCreateInvoice} className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-8">
          <h2 className="text-sm uppercase tracking-wider text-stone-400 mb-4">New Invoice</h2>
          
          <div className="grid gap-4 mb-4">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name *"
              className="w-full px-4 py-3 border border-stone-200 rounded focus:outline-none focus:border-stone-400"
              required
            />
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Client email (optional)"
              className="w-full px-4 py-3 border border-stone-200 rounded focus:outline-none focus:border-stone-400"
            />
            
            {/* Currency selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex-1 py-3 rounded border transition-colors ${currency === 'USD' ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}
              >
                USD $
              </button>
              <button
                type="button"
                onClick={() => setCurrency('MXN')}
                className={`flex-1 py-3 rounded border transition-colors ${currency === 'MXN' ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}
              >
                MXN $
              </button>
            </div>
          </div>

          {/* Services */}
          <div className="mb-4">
            <label className="text-xs uppercase tracking-wider text-stone-400 mb-2 block">Services</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="Service description"
                className="flex-1 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-400"
              />
              <input
                type="number"
                value={serviceAmount}
                onChange={(e) => setServiceAmount(e.target.value)}
                placeholder="Amount"
                className="w-24 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-400"
              />
              <button
                type="button"
                onClick={addService}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded text-sm"
              >
                Add
              </button>
            </div>
            {services.length > 0 && (
              <div className="space-y-1">
                {services.map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-stone-50 px-3 py-2 rounded">
                    <span>{s.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-600">${s.amount}</span>
                      <button type="button" onClick={() => removeService(i)} className="text-red-500 text-xs">×</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Total</span>
                  <span>{currency === 'MXN' ? '$' : '$'}{getTotal().toLocaleString()} {currency}</span>
                </div>
              </div>
            )}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-4 py-3 border border-stone-200 rounded focus:outline-none focus:border-stone-400 mb-4 text-sm"
            rows={2}
          />
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-stone-300 text-stone-500 rounded hover:bg-stone-100 transition-colors"
            >
              Reset
            </button>
            <button 
              disabled={loading || services.length === 0}
              className="flex-1 bg-stone-800 text-white py-3 rounded hover:bg-stone-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>

        {/* Invoices List */}
        <div className="space-y-4">
          {invoices.length === 0 && (
            <p className="text-center text-stone-400 py-8">No invoices yet</p>
          )}
          
          {invoices.map(invoice => (
            <div key={invoice.id} className={`bg-white rounded-lg shadow-sm border p-4 ${invoice.status === 'paid' ? 'border-green-200' : 'border-stone-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-stone-800">{invoice.client.name}</p>
                  <p className="text-xs text-stone-400">{invoice.slug}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-stone-800">${invoice.total.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {invoice.status === 'paid' ? `✓ Paid (${invoice.payment_method})` : 'Pending'}
                  </span>
                </div>
              </div>
              
              {/* Services summary */}
              <div className="text-xs text-stone-500 mb-3">
                {invoice.services.map((s, i) => s.description).join(', ')}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => copyLink(invoice)}
                  className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded transition-colors"
                >
                  {copied === invoice.id ? '✓ Copied!' : 'Copy Link'}
                </button>
                
                <a
                  href={getPaymentLink(invoice)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                >
                  View
                </a>
                
                {invoice.status === 'pending' ? (
                  <button
                    onClick={() => handleMarkPaid(invoice.id)}
                    className="text-xs px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                  >
                    Mark Paid
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkUnpaid(invoice.id)}
                    className="text-xs px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors"
                  >
                    Mark Unpaid
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(invoice.id)}
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

export const getServerSideProps: GetServerSideProps = async () => {
  const { getAllInvoices } = await import('@/lib/invoices');
  const { isSupabaseConfigured } = await import('@/lib/supabase');
  
  const invoices = await getAllInvoices();
  
  return {
    props: {
      initialInvoices: invoices,
      isConfigured: isSupabaseConfigured(),
    },
  };
};
