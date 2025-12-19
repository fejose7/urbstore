
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED', // Pago, aguardando envio
  SHIPPED = 'SHIPPED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER'
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  avatar?: string; // Base64 avatar
}

export interface Book {
  id: string;
  title: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  isBundle?: boolean;
  bundleItems?: string[]; // IDs dos livros que compõem o Box
}

export interface Seller extends UserAccount {
  email: string;
  phone: string;
  bankAccount: string;
  commissionRate: number;
}

export interface Customer {
  name: string;
  address: string;
  zip: string;
  phone: string;
  email: string;
}

export interface OrderItem {
  bookId: string;
  bookTitle: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  isBundle?: boolean;
}

export interface Order {
  id: string;
  date: string;
  customer: Customer;
  items: OrderItem[];
  discount: number;
  shippingCost: number;
  shippingType: 'Simples' | 'SEDEX';
  status: OrderStatus;
  sellerId: string | null; 
  totalValue: number; 
  totalCost: number;
  totalProfit: number;
  sellerCommission: number;
  receiptData?: string;
  trackingNumber?: string;
  shippingDocument?: string;
}

export type ViewType = 'DASHBOARD' | 'INVENTORY' | 'SELLERS' | 'ORDERS' | 'NEW_ORDER' | 'REPORTS' | 'SHIPPING';
