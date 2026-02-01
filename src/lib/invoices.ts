import fs from 'fs';
import path from 'path';

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

const DATA_FILE = path.join(process.cwd(), 'data', 'invoices.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

export function getAllInvoices(): Invoice[] {
  ensureDataDir();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getInvoiceBySlug(slug: string): Invoice | null {
  const invoices = getAllInvoices();
  return invoices.find(inv => inv.slug === slug) || null;
}

export function getInvoiceById(id: string): Invoice | null {
  const invoices = getAllInvoices();
  return invoices.find(inv => inv.id === id) || null;
}

export function createInvoice(data: Omit<Invoice, 'id' | 'created_at' | 'paid_at' | 'payment_method' | 'status'>): Invoice {
  ensureDataDir();
  const invoices = getAllInvoices();
  
  const invoice: Invoice = {
    ...data,
    id: `inv_${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
    paid_at: null,
    payment_method: null,
  };
  
  invoices.push(invoice);
  fs.writeFileSync(DATA_FILE, JSON.stringify(invoices, null, 2));
  return invoice;
}

export function updateInvoiceStatus(id: string, status: Invoice['status'], payment_method?: string): Invoice | null {
  ensureDataDir();
  const invoices = getAllInvoices();
  const index = invoices.findIndex(inv => inv.id === id);
  
  if (index === -1) return null;
  
  invoices[index].status = status;
  if (status === 'paid') {
    invoices[index].paid_at = new Date().toISOString();
    invoices[index].payment_method = payment_method || 'manual';
  }
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(invoices, null, 2));
  return invoices[index];
}

export function deleteInvoice(id: string): boolean {
  ensureDataDir();
  const invoices = getAllInvoices();
  const filtered = invoices.filter(inv => inv.id !== id);
  
  if (filtered.length === invoices.length) return false;
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
  return true;
}
