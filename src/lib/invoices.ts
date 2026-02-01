import { supabase, isSupabaseConfigured } from './supabase';

export interface Service {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  slug: string;
  client: {
    name: string;
    email?: string;
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

// Fallback in-memory store (solo para desarrollo sin Supabase)
const memoryStore: Map<string, Invoice> = new Map();

// Helper: DB row -> Invoice object
function rowToInvoice(row: any): Invoice {
  return {
    id: row.id,
    slug: row.slug,
    client: {
      name: row.client_name,
      email: row.client_email || undefined,
      phone: row.client_phone || undefined,
    },
    services: row.services || [],
    total: parseFloat(row.total),
    currency: row.currency || 'USD',
    status: row.status,
    created_at: row.created_at,
    paid_at: row.paid_at,
    payment_method: row.payment_method,
    notes: row.notes,
  };
}

// Helper: Invoice -> DB row
function invoiceToRow(invoice: Invoice) {
  return {
    id: invoice.id,
    slug: invoice.slug,
    client_name: invoice.client.name,
    client_email: invoice.client.email || null,
    client_phone: invoice.client.phone || null,
    services: invoice.services,
    total: invoice.total,
    currency: invoice.currency,
    status: invoice.status,
    payment_method: invoice.payment_method,
    notes: invoice.notes,
    paid_at: invoice.paid_at,
  };
}

// Generate unique slug
function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function getAllInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return Array.from(memoryStore.values());
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return (data || []).map(rowToInvoice);
}

export async function getInvoiceBySlug(slug: string): Promise<Invoice | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return memoryStore.get(slug) || null;
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToInvoice(data);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!isSupabaseConfigured() || !supabase) {
    for (const invoice of memoryStore.values()) {
      if (invoice.id === id) return invoice;
    }
    return null;
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToInvoice(data);
}

export async function createInvoice(data: {
  client: { name: string; email?: string; phone?: string };
  services: Service[];
  total: number;
  currency?: string;
  notes?: string;
}): Promise<Invoice> {
  const invoice: Invoice = {
    id: `inv_${Date.now()}`,
    slug: generateSlug(),
    client: data.client,
    services: data.services,
    total: data.total,
    currency: data.currency || 'USD',
    status: 'pending',
    created_at: new Date().toISOString(),
    paid_at: null,
    payment_method: null,
    notes: data.notes,
  };

  if (!isSupabaseConfigured() || !supabase) {
    memoryStore.set(invoice.slug, invoice);
    return invoice;
  }

  const { error } = await supabase
    .from('invoices')
    .insert(invoiceToRow(invoice));

  if (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }

  return invoice;
}

export async function updateInvoiceStatus(
  id: string, 
  status: Invoice['status'], 
  payment_method?: string
): Promise<Invoice | null> {
  const updates: any = {
    status,
    payment_method: status === 'paid' ? (payment_method || 'manual') : null,
    paid_at: status === 'paid' ? new Date().toISOString() : null,
  };

  if (!isSupabaseConfigured() || !supabase) {
    for (const [slug, invoice] of memoryStore.entries()) {
      if (invoice.id === id) {
        const updated = { ...invoice, ...updates };
        memoryStore.set(slug, updated);
        return updated;
      }
    }
    return null;
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating invoice:', error);
    return null;
  }

  return rowToInvoice(data);
}

export async function updateInvoiceBySlug(
  slug: string, 
  status: Invoice['status'], 
  payment_method?: string
): Promise<Invoice | null> {
  const updates: any = {
    status,
    payment_method: status === 'paid' ? (payment_method || 'manual') : null,
    paid_at: status === 'paid' ? new Date().toISOString() : null,
  };

  if (!isSupabaseConfigured() || !supabase) {
    const invoice = memoryStore.get(slug);
    if (!invoice) return null;
    const updated = { ...invoice, ...updates };
    memoryStore.set(slug, updated);
    return updated;
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('slug', slug)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return rowToInvoice(data);
}

export async function deleteInvoice(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    for (const [slug, invoice] of memoryStore.entries()) {
      if (invoice.id === id) {
        memoryStore.delete(slug);
        return true;
      }
    }
    return false;
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  return !error;
}
