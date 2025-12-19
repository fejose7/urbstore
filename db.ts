
import { Book, Seller, Order, UserAccount, UserRole } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  BOOKS: 'ml_books',
  SELLERS: 'ml_sellers',
  ORDERS: 'ml_orders',
  USERS: 'ml_users'
};

const DEFAULT_ADMIN: UserAccount = {
  id: 'admin-felipe',
  username: 'Felipe',
  password: '852211',
  role: UserRole.ADMIN,
  name: 'Felipe (Admin)'
};

// Funções Auxiliares de LocalStorage
const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const db = {
  // LIVROS / ESTOQUE
  getBooks: async (): Promise<Book[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('books').select('*');
      if (!error) return data as Book[];
    }
    return getLocal(STORAGE_KEYS.BOOKS);
  },
  saveBooks: async (books: Book[]) => {
    if (isSupabaseConfigured()) {
      await supabase!.from('books').upsert(books);
    }
    setLocal(STORAGE_KEYS.BOOKS, books);
  },

  // VENDEDORES
  getSellers: async (): Promise<Seller[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('sellers').select('*');
      if (!error) return data as Seller[];
    }
    return getLocal(STORAGE_KEYS.SELLERS);
  },
  saveSellers: async (sellers: Seller[]) => {
    if (isSupabaseConfigured()) {
      await supabase!.from('sellers').upsert(sellers);
    }
    setLocal(STORAGE_KEYS.SELLERS, sellers);
  },

  // PEDIDOS
  getOrders: async (): Promise<Order[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('orders').select('*').order('date', { ascending: false });
      if (!error) return data as Order[];
    }
    return getLocal(STORAGE_KEYS.ORDERS);
  },
  saveOrders: async (orders: Order[]) => {
    if (isSupabaseConfigured()) {
      // No Supabase real, você usaria .insert() ou .upsert() para o pedido específico
      // Aqui mantemos a lógica de lote para compatibilidade com o estado atual do App
      await supabase!.from('orders').upsert(orders);
    }
    setLocal(STORAGE_KEYS.ORDERS, orders);
  },

  // USUÁRIOS / ADMINS
  getUsers: async (): Promise<UserAccount[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('users').select('*');
      if (!error && data.length > 0) return data as UserAccount[];
    }
    const users = getLocal(STORAGE_KEYS.USERS);
    return users.length === 0 ? [DEFAULT_ADMIN] : users;
  },
  saveUsers: async (users: UserAccount[]) => {
    if (isSupabaseConfigured()) {
      await supabase!.from('users').upsert(users);
    }
    setLocal(STORAGE_KEYS.USERS, users);
  }
};

/* 
  SQL PARA CRIAÇÃO NO SUPABASE (SQL EDITOR):

  -- Tabela de Livros
  create table books (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    "costPrice" numeric not null,
    "salePrice" numeric not null,
    stock integer not null,
    "isBundle" boolean default false,
    "bundleItems" jsonb default '[]'::jsonb
  );

  -- Tabela de Vendedores
  create table sellers (
    id uuid primary key default uuid_generate_v4(),
    username text unique not null,
    password text not null,
    role text not null,
    name text not null,
    email text,
    phone text,
    avatar text,
    "commissionRate" numeric default 15
  );

  -- Tabela de Pedidos
  create table orders (
    id uuid primary key default uuid_generate_v4(),
    date timestamp with time zone default now(),
    customer jsonb not null,
    items jsonb not null,
    discount numeric default 0,
    "shippingCost" numeric default 0,
    "shippingType" text,
    status text not null,
    "sellerId" uuid references sellers(id),
    "totalValue" numeric not null,
    "totalCost" numeric not null,
    "totalProfit" numeric not null,
    "sellerCommission" numeric not null,
    "receiptData" text,
    "trackingNumber" text
  );
*/
