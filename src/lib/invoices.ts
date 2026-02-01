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

// In-memory store - persists during function warm state
// For production, use Vercel KV, Supabase, or similar
const invoiceStore: Map<string, Invoice> = new Map();

// Demo invoice always available
const demoInvoice: Invoice = {
  id: 'inv_demo',
  slug: 'demo',
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
  notes: 'Demo invoice - Propiedad en Sayulita'
};

// Initialize with demo
if (!invoiceStore.has('demo')) {
  invoiceStore.set('demo', demoInvoice);
}

export function getAllInvoices(): Invoice[] {
  return Array.from(invoiceStore.values());
}

export function getInvoiceBySlug(slug: string): Invoice | null {
  // Always return demo for demo slug
  if (slug === 'demo') {
    return invoiceStore.get('demo') || demoInvoice;
  }
  return invoiceStore.get(slug) || null;
}

export function getInvoiceById(id: string): Invoice | null {
  for (const invoice of invoiceStore.values()) {
    if (invoice.id === id) return invoice;
  }
  return null;
}

export function createInvoice(data: Omit<Invoice, 'id' | 'created_at' | 'paid_at' | 'payment_method' | 'status'>): Invoice {
  const invoice: Invoice = {
    ...data,
    id: `inv_${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
    paid_at: null,
    payment_method: null,
  };
  
  invoiceStore.set(invoice.slug, invoice);
  return invoice;
}

export function updateInvoiceStatus(id: string, status: Invoice['status'], payment_method?: string): Invoice | null {
  for (const [slug, invoice] of invoiceStore.entries()) {
    if (invoice.id === id) {
      const updated = {
        ...invoice,
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : invoice.paid_at,
        payment_method: status === 'paid' ? (payment_method || 'manual') : invoice.payment_method,
      };
      invoiceStore.set(slug, updated);
      return updated;
    }
  }
  return null;
}

export function updateInvoiceBySlug(slug: string, status: Invoice['status'], payment_method?: string): Invoice | null {
  const invoice = invoiceStore.get(slug);
  if (!invoice) return null;
  
  const updated = {
    ...invoice,
    status,
    paid_at: status === 'paid' ? new Date().toISOString() : invoice.paid_at,
    payment_method: status === 'paid' ? (payment_method || 'manual') : invoice.payment_method,
  };
  invoiceStore.set(slug, updated);
  return updated;
}

export function deleteInvoice(id: string): boolean {
  for (const [slug, invoice] of invoiceStore.entries()) {
    if (invoice.id === id) {
      invoiceStore.delete(slug);
      return true;
    }
  }
  return false;
}
