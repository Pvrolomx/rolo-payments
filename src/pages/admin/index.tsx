import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { Invoice, getAllInvoices } from '@/lib/invoices';
import Link from 'next/link';

interface Props {
  invoices: Invoice[];
  isAuthenticated: boolean;
}

export default function AdminPage({ invoices: initialInvoices, isAuthenticated }: Props) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      window.location.reload();
    } else {
      setError('Incorrect password');
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`https://pay.expatadvisormx.com/${slug}`);
    alert('Link copied!');
  };

  const markAsPaid = async (id: string, method: string) => {
    const res = await fetch('/api/admin/mark-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, method }),
    });
    if (res.ok) {
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, status: 'paid', paid_at: new Date().toISOString(), payment_method: method } : inv
      ));
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="font-display text-2xl text-center mb-6">Rolo Admin</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-forest"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-forest text-white py-3 rounded-xl font-semibold hover:bg-forest/90"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-3xl text-gray-900">Rolo Payments</h1>
          <Link
            href="/admin/new"
            className="bg-forest text-white px-6 py-3 rounded-xl font-semibold hover:bg-forest/90"
          >
            + New Invoice
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500">No invoices yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-xl shadow p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`w-3 h-3 rounded-full ${invoice.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      <span className="font-semibold text-gray-900">{invoice.client.name}</span>
                    </div>
                    <p className="text-gray-500 text-sm">{invoice.slug}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-display text-xl text-forest font-semibold">${invoice.total} {invoice.currency}</p>
                    <p className="text-gray-500 text-sm">{invoice.status === 'paid' ? `Paid via ${invoice.payment_method}` : 'Pending'}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyLink(invoice.slug)}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Copy Link
                    </button>
                    <Link
                      href={`/pay/${invoice.slug}`}
                      target="_blank"
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      View
                    </Link>
                    {invoice.status === 'pending' && (
                      <select
                        onChange={(e) => e.target.value && markAsPaid(invoice.id, e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Mark Paid</option>
                        <option value="zelle">Zelle</option>
                        <option value="venmo">Venmo</option>
                        <option value="wise">Wise</option>
                        <option value="paypal">PayPal</option>
                        <option value="wire">Wire</option>
                        <option value="cash">Cash</option>
                      </select>
                    )}
                    {invoice.status === 'paid' && (
                      <Link
                        href={`/api/pdf/${invoice.id}`}
                        target="_blank"
                        className="px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest/90 text-sm"
                      >
                        PDF
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-8">Rolo Payments Admin | Colmena 2026</p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const authCookie = req.cookies['rolo-admin-auth'];
  const isAuthenticated = authCookie === process.env.ADMIN_PASSWORD;
  
  let invoices: Invoice[] = [];
  if (isAuthenticated) {
    invoices = getAllInvoices();
  }

  return {
    props: {
      invoices,
      isAuthenticated,
    },
  };
};
