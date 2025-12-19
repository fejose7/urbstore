
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
  Camera,
  AlertCircle,
  Component as SheepIcon,
  RefreshCw
} from 'lucide-react';
import { ViewType, Book, Seller, Order, UserAccount, UserRole, OrderStatus } from './types';
import { db } from './db';
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
  
  const [books, setBooks] = useState<Book[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Carga inicial assíncrona
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [b, s, o] = await Promise.all([
        db.getBooks(),
        db.getSellers(),
        db.getOrders()
      ]);
      setBooks(b);
      setSellers(s);
      setOrders(o);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Persistência assíncrona (Pre-Supabase)
  useEffect(() => { if (!isLoading) db.saveBooks(books); }, [books]);
  useEffect(() => { 
    if (!isLoading) {
      db.saveSellers(sellers); 
      if (currentUser?.role === UserRole.SELLER) {
        const updatedMe = sellers.find(s => s.id === currentUser.id);
        if (updatedMe) setCurrentUser({...updatedMe});
      }
    }
  }, [sellers]);
  useEffect(() => { if (!isLoading) db.saveOrders(orders); }, [orders]);

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
    alert("Perfil atualizado com sucesso!");
  };

  const navItems = [
    { id: 'DASHBOARD', label: 'Painel Geral', icon: <LayoutDashboard size={20} />, roles: [UserRole.ADMIN, UserRole.SELLER] },
    { id: 'NEW_ORDER', label: 'Lançar Venda', icon: <PlusCircle size={20} />, roles: [UserRole.ADMIN, UserRole.SELLER] },
    { 
      id: 'ORDERS', 
      label: 'Lista de Pedidos', 
      icon: <ShoppingCart size={20} />, 
      roles: [UserRole.ADMIN, UserRole.SELLER],
      badge: isAdmin && pendingPaymentsCount > 0 ? pendingPaymentsCount : null
    },
    { 
      id: 'SHIPPING', 
      label: 'Envios Pendentes', 
      icon: <Truck size={20} />, 
      roles: [UserRole.ADMIN],
      badge: pendingShipmentsCount > 0 ? pendingShipmentsCount : null
    },
    { id: 'INVENTORY', label: 'Estoque de Livros', icon: <BookOpen size={20} />, roles: [UserRole.ADMIN] },
    { id: 'SELLERS', label: 'Vendedores', icon: <Users size={20} />, roles: [UserRole.ADMIN] },
    { id: 'REPORTS', label: 'Relatórios', icon: <BarChart3 size={20} />, roles: [UserRole.ADMIN] },
  ];

  const renderContent = () => {
    if (isLoading) return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <RefreshCw size={48} className="text-blue-600 animate-spin" />
        <p className="font-black uppercase italic tracking-widest text-slate-400">Sincronizando Manus Libros...</p>
      </div>
    );

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard orders={orders} books={books} sellers={sellers} user={currentUser} />;
      case 'INVENTORY':
        return isAdmin ? <Inventory books={books} setBooks={setBooks} /> : null;
      case 'SELLERS':
        return isAdmin ? <Sellers sellers={sellers} setSellers={setSellers} /> : null;
      case 'ORDERS':
        return <Orders orders={orders} setOrders={setOrders} books={books} setBooks={setBooks} sellers={sellers} user={currentUser} />;
      case 'SHIPPING':
        return isAdmin ? <ShippingManager orders={orders} setOrders={setOrders} sellers={sellers} /> : null;
      case 'NEW_ORDER':
        return <NewOrder books={books} sellers={sellers} user={currentUser} onOrderCreated={(newOrder) => {
          setOrders([newOrder, ...orders]);
          setCurrentView('ORDERS');
        }} />;
      case 'REPORTS':
        return isAdmin ? <Reports orders={orders} books={books} sellers={sellers} /> : null;
      default:
        return <Dashboard orders={orders} books={books} sellers={sellers} user={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col no-print`}>
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white p-1.5 rounded-xl">
              <SheepIcon size={24} className="text-slate-900" />
            </div>
            <h1 className={`font-black text-lg transition-all whitespace-nowrap tracking-tighter text-blue-400 ${!isSidebarOpen && 'scale-0 w-0'}`}>
              Manus Libros
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hover:bg-white/10 p-1 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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

        <div className="p-4 bg-white/5 border-t border-white/10">
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-3 mb-4 w-full text-left p-2 rounded-xl hover:bg-white/10 transition-all ${!isSidebarOpen && 'justify-center'}`}
          >
            {currentUser.avatar ? (
              <img src={currentUser.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-blue-500" alt="Avatar" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg">
                {currentUser.name.charAt(0)}
              </div>
            )}
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
            <span>Manus Libros Cloud</span>
            <ChevronRight size={14} />
            <span className="font-black text-slate-900 uppercase">
              {navItems.find(i => i.id === currentView)?.label || 'Sistema'}
            </span>
          </div>
          <div className="flex items-center gap-6">
            {isSyncing && (
              <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
              </div>
            )}
            {isAdmin && (pendingPaymentsCount > 0 || pendingShipmentsCount > 0) && (
              <div className="flex gap-4">
                {pendingPaymentsCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg">
                    <AlertCircle size={14} className="text-amber-600" />
                    <span className="text-[10px] font-black text-amber-700 uppercase">{pendingPaymentsCount} Pagtos</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        
        <div className="p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 flex items-center justify-center p-4">
          <div className="bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="bg-slate-700 p-6 flex justify-between items-center">
              <h3 className="text-white font-black text-lg uppercase tracking-widest italic flex items-center gap-2">
                <Settings size={20} /> Perfil Cloud
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome de Exibição</label>
                  <input required className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-xl outline-none" value={currentUser.name} onChange={e => setCurrentUser({...currentUser, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Senha</label>
                  <input required type="text" className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={currentUser.password || ''} onChange={e => setCurrentUser({...currentUser, password: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-700">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-white uppercase text-xs">Sair</button>
                <button type="submit" disabled={isSyncing} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl disabled:opacity-50">
                  {isSyncing ? 'Salvando...' : 'Salvar Alterações'}
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
