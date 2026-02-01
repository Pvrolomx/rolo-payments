export interface Service {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  slug: string;
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  services: Service[];
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at: string | null;
  payment_method: string | null;
  notes?: string;
}

// Demo invoice for testing
export const demoInvoice: Invoice = {
  id: 'inv_001',
  slug: 'john-smith-feb2026',
  client: {
    name: 'John & Mary Smith',
    email: 'john@email.com',
    phone: '+1 555 123 4567'
  },
  services: [
    { description: 'Property title search & verification', amount: 400 },
    { description: 'Notary public coordination', amount: 300 },
    { description: 'Municipality permit research', amount: 150 }
  ],
  total: 850,
  currency: 'USD',
  status: 'pending',
  created_at: '2026-02-01T10:00:00Z',
  paid_at: null,
  payment_method: null,
  notes: 'Propiedad en Sayulita'
};

// In production, this would fetch from a database
export function getInvoiceBySlug(slug: string): Invoice | null {
  if (slug === 'john-smith-feb2026' || slug === 'demo') {
    return demoInvoice;
  }
  return null;
}
