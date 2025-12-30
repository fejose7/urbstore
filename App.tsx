
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  PlusCircle, 
  Menu, 
  X, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  Truck,
  Settings,
  RefreshCw,
  Database,
  Globe,
  Star
} from 'lucide-react';
import { ViewType, Book, Seller, Order, UserAccount, UserRole, OrderStatus } from './types';
import { db } from './db';
import { isSupabaseConfigured } from './supabaseClient';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sellers from './components/Sellers';
import Orders from './components/Orders';
import NewOrder from './components/NewOrder';
import Reports from './components/Reports';
import Login from './components/Login';
import ShippingManager from './components/ShippingManager';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'LOCAL' | 'CLOUD'>('LOCAL');
  
  const [books, setBooks] = useState<Book[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setDbStatus(isSupabaseConfigured() ? 'CLOUD' : 'LOCAL');
      
      try {
        const [b, s, o] = await Promise.all([
          db.getBooks(),
          db.getSellers(),
          db.getOrders()
        ]);
        setBooks(b);
        setSellers(s);
        setOrders(o);
      } catch (err) {
        console.error("Falha na sincronização inicial:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => { 
    if (!isLoading) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        db.saveBooks(books);
        setIsSyncing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [books, isLoading]);

  useEffect(() => { 
    if (!isLoading) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        db.saveSellers(sellers);
        setIsSyncing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sellers, isLoading]);

  useEffect(() => { 
    if (!isLoading) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        db.saveOrders(orders);
        setIsSyncing(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [orders, isLoading]);

  const pendingPaymentsCount = useMemo(() => 
    orders.filter(o => o.status === OrderStatus.PENDING_PAYMENT).length, 
  [orders]);
  
  const pendingShipmentsCount = useMemo(() => 
    orders.filter(o => o.status === OrderStatus.CONFIRMED).length, 
  [orders]);

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    if (currentUser.role === UserRole.SELLER) {
      setSellers(prev => prev.map(s => s.id === currentUser.id ? (currentUser as Seller) : s));
    } else {
      const users = await db.getUsers();
      const updatedUsers = users.map(u => u.id === currentUser.id ? currentUser : u);
      await db.saveUsers(updatedUsers);
    }
    setIsProfileModalOpen(false);
    setIsSyncing(false);
    alert("Perfil atualizado!");
  };

  const navItems = [
    { id: 'DASHBOARD', label: 'Início', icon: <LayoutDashboard size={20} />, roles: [UserRole.ADMIN, UserRole.SELLER] },
    { id: 'NEW_ORDER', label: 'Nova Venda', icon: <PlusCircle size={20} />, roles: [UserRole.ADMIN, UserRole.SELLER] },
    { 
      id: 'ORDERS', 
      label: 'Vendas', 
      icon: <ShoppingCart size={20} />, 
      roles: [UserRole.ADMIN, UserRole.SELLER],
      badge: isAdmin && pendingPaymentsCount > 0 ? pendingPaymentsCount : null
    },
    { 
      id: 'SHIPPING', 
      label: 'Logística', 
      icon: <Truck size={20} />, 
      roles: [UserRole.ADMIN],
      badge: pendingShipmentsCount > 0 ? pendingShipmentsCount : null
    },
    { id: 'INVENTORY', label: 'Catálogo', icon: <BookOpen size={20} />, roles: [UserRole.ADMIN] },
    { id: 'SELLERS', label: 'Equipe', icon: <Users size={20} />, roles: [UserRole.ADMIN] },
    { id: 'REPORTS', label: 'Relatórios', icon: <BarChart3 size={20} />, roles: [UserRole.ADMIN] },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col no-print`}>
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white p-1.5 rounded-xl">
              <Star size={24} className="text-slate-900 fill-slate-900" />
            </div>
            <h1 className={`font-black text-lg transition-all whitespace-nowrap tracking-tighter text-blue-400 ${!isSidebarOpen && 'scale-0 w-0'}`}>
              Evangelho Prático
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hover:bg-white/10 p-1 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.filter(item => item.roles.includes(currentUser.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`
                flex items-center space-x-3 w-full p-3 rounded-xl transition-all relative
                ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}
                ${!isSidebarOpen ? 'justify-center' : ''}
              `}
            >
              <div className="relative">
                {item.icon}
                {!isSidebarOpen && item.badge && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
                )}
              </div>
              <span className={`${!isSidebarOpen ? 'hidden' : 'font-semibold'} flex-1 text-left whitespace-nowrap`}>{item.label}</span>
              {isSidebarOpen && item.badge && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 bg-white/5 border-t border-white/10 space-y-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${dbStatus === 'CLOUD' ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
             {dbStatus === 'CLOUD' ? <Globe size={12} /> : <Database size={12} />}
             {isSidebarOpen && <span>{dbStatus === 'CLOUD' ? 'Cloud Ativo' : 'Offline Mode'}</span>}
          </div>
          
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-3 w-full text-left p-2 rounded-xl hover:bg-white/10 transition-all ${!isSidebarOpen && 'justify-center'}`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg">
              {currentUser.name.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-[10px] text-blue-400 uppercase tracking-widest">{currentUser.role}</p>
              </div>
            )}
          </button>
          <button onClick={() => setCurrentUser(null)} className={`flex items-center space-x-3 w-full p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all ${!isSidebarOpen ? 'justify-center' : ''}`}>
            <LogOut size={18} />
            <span className={!isSidebarOpen ? 'hidden' : 'text-sm font-bold'}>Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto no-print relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-400 text-xs uppercase tracking-widest">
            <ShieldCheck size={14} className="text-blue-500" />
            <span>Evangelho Prático</span>
            <ChevronRight size={14} />
            <span className="font-black text-slate-900 uppercase">
              {navItems.find(i => i.id === currentView)?.label || 'Início'}
            </span>
          </div>
          <div className="flex items-center gap-6">
            {isSyncing && (
              <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
              </div>
            )}
          </div>
        </header>
        
        <div className="p-8 max-w-7xl mx-auto">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-6">
              <RefreshCw size={48} className="text-blue-600 animate-spin" />
              <p className="font-black uppercase italic tracking-[0.3em] text-slate-400">Carregando Evangelho Prático...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {currentView === 'DASHBOARD' && <Dashboard orders={orders} books={books} sellers={sellers} user={currentUser} />}
              {currentView === 'INVENTORY' && <Inventory books={books} setBooks={setBooks} />}
              {currentView === 'SELLERS' && <Sellers sellers={sellers} setSellers={setSellers} />}
              {currentView === 'ORDERS' && <Orders orders={orders} setOrders={setOrders} books={books} setBooks={setBooks} sellers={sellers} user={currentUser} />}
              {currentView === 'SHIPPING' && <ShippingManager orders={orders} setOrders={setOrders} sellers={sellers} />}
              {currentView === 'NEW_ORDER' && <NewOrder books={books} sellers={sellers} user={currentUser} onOrderCreated={(newOrder) => {
                setOrders([newOrder, ...orders]);
                setCurrentView('ORDERS');
              }} />}
              {currentView === 'REPORTS' && <Reports orders={orders} books={books} sellers={sellers} />}
            </div>
          )}
        </div>
      </main>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-700">
            <div className="bg-slate-700 p-8 flex justify-between items-center">
              <h3 className="text-white font-black text-lg uppercase tracking-widest italic flex items-center gap-3">
                <Settings size={22} className="text-blue-400" /> Perfil de Usuário
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-10 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Exibição</label>
                  <input required className="w-full p-4 bg-slate-900 text-white border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={currentUser.name} onChange={e => setCurrentUser({...currentUser, name: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-slate-700">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black hover:text-white uppercase text-xs tracking-widest">Fechar</button>
                <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-xl hover:bg-blue-500 transition-all">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
