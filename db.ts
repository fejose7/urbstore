
import { Book, Seller, Order, UserAccount, UserRole } from './types';

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

// Camada de Serviço preparada para Supabase
export const db = {
  getBooks: async (): Promise<Book[]> => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || '[]');
  },
  saveBooks: async (books: Book[]) => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  },
  
  getSellers: async (): Promise<Seller[]> => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SELLERS) || '[]');
  },
  saveSellers: async (sellers: Seller[]) => {
    localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(sellers));
  },
  
  getOrders: async (): Promise<Order[]> => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
  },
  saveOrders: async (orders: Order[]) => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  getUsers: async (): Promise<UserAccount[]> => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (users.length === 0) return [DEFAULT_ADMIN];
    return users;
  },
  saveUsers: async (users: UserAccount[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
};
