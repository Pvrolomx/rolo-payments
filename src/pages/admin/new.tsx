import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface ServiceInput {
  description: string;
  amount: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [services, setServices] = useState<ServiceInput[]>([{ description: '', amount: '' }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const addService = () => {
    setServices([...services, { description: '', amount: '' }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: keyof ServiceInput, value: string) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const total = services.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

  const generateSlug = (name: string) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const date = new Date().toISOString().slice(0, 7);
    return `${base}-${date}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const invoiceData = {
      slug: generateSlug(clientName),
      client: {
        name: clientName,
        email: clientEmail,
        phone: clientPhone || undefined,
      },
      services: services.map(s => ({
        description: s.description,
        amount: parseFloat(s.amount) || 0,
      })),
      total,
      currency: 'USD',
      notes: notes || undefined,
    };

    const res = await fetch('/api/admin/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });

    if (res.ok) {
      const { invoice } = await res.json();
      const link = `https://pay.expatadvisormx.com/${invoice.slug}`;
      navigator.clipboard.writeText(link);
      alert(`Invoice created! Link copied:\n${link}`);
      router.push('/admin');
    } else {
      alert('Error creating invoice');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">← Back</Link>
          <h1 className="font-display text-2xl text-gray-900">New Invoice</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="John & Mary Smith"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={service.description}
                    onChange={(e) => updateService(index, 'description', e.target.value)}
                    placeholder="Service description"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={service.amount}
                    onChange={(e) => updateService(index, 'amount', e.target.value)}
                    placeholder="$"
                    className="w-28 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="px-3 text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addService}
              className="mt-3 text-forest hover:underline text-sm"
            >
              + Add service
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (internal)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Property in Sayulita, closing date March 15..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-6">
              <span className="font-display text-xl">Total</span>
              <span className="font-display text-2xl text-forest font-semibold">${total.toFixed(2)} USD</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest text-white py-4 rounded-xl font-semibold hover:bg-forest/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Invoice & Copy Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
