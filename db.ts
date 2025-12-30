
import { Book, Seller, Order, UserAccount, UserRole } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  BOOKS: 'ep_books',
  SELLERS: 'ep_sellers',
  ORDERS: 'ep_orders',
  USERS: 'ep_users'
};

const DEFAULT_ADMIN: UserAccount = {
  id: 'admin-ep',
  username: 'Felipe',
  password: '852211',
  role: UserRole.ADMIN,
  name: 'Felipe (Admin)'
};

const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const db = {
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
  getOrders: async (): Promise<Order[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('orders').select('*').order('date', { ascending: false });
      if (!error) return data as Order[];
    }
    return getLocal(STORAGE_KEYS.ORDERS);
  },
  saveOrders: async (orders: Order[]) => {
    if (isSupabaseConfigured()) {
      await supabase!.from('orders').upsert(orders);
    }
    setLocal(STORAGE_KEYS.ORDERS, orders);
  },
  getUsers: async (): Promise<UserAccount[]> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('users').select('*');
      if (!error && data.length > 0) return data as UserAccount[];
    }
    const users = getLocal(STORAGE_KEYS.USERS);
    // Se não houver usuários ou se o admin padrão antigo estiver lá, garantimos o novo
    if (users.length === 0) return [DEFAULT_ADMIN];
    
    // Pequeno ajuste para garantir que a mudança de credenciais reflita mesmo com dados locais antigos
    const hasDefaultAdmin = users.some((u: UserAccount) => u.id === 'admin-ep');
    if (hasDefaultAdmin) {
      return users.map((u: UserAccount) => u.id === 'admin-ep' ? DEFAULT_ADMIN : u);
    }
    
    return users;
  },
  saveUsers: async (users: UserAccount[]) => {
    if (isSupabaseConfigured()) {
      await supabase!.from('users').upsert(users);
    }
    setLocal(STORAGE_KEYS.USERS, users);
  }
};
