
import React, { useMemo } from 'react';
import { Order, Book, Seller, OrderStatus, UserAccount, UserRole } from '../types';
import { TrendingUp, Package, DollarSign, Award, BookText, ShoppingBag, Wallet, Clock, Truck, AlertCircle } from 'lucide-react';

interface Props {
  orders: Order[];
  books: Book[];
  sellers: Seller[];
  user: UserAccount;
}

const Dashboard: React.FC<Props> = ({ orders, books, sellers, user }) => {
  const isAdmin = user.role === UserRole.ADMIN;
  
  const viewOrders = useMemo(() => {
    return isAdmin ? orders : orders.filter(o => o.sellerId === user.id);
  }, [orders, isAdmin, user.id]);

  const alerts = useMemo(() => {
    return {
      pendingPayment: viewOrders.filter(o => o.status === OrderStatus.PENDING_PAYMENT).length,
      pendingShipping: viewOrders.filter(o => o.status === OrderStatus.CONFIRMED).length
    };
  }, [viewOrders]);

  const stats = useMemo(() => {
    // Faturamento e Comissões APENAS de pedidos confirmados/despachados
    const paidOrders = viewOrders.filter(o => o.status !== OrderStatus.PENDING_PAYMENT);
    
    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalValue, 0);
    
    let displayProfitLabel = isAdmin ? 'Lucro Líquido Manus' : 'Comissão Disponível';
    let displayProfitValue = 0;

    if (isAdmin) {
      const totalSystemProfit = paidOrders.reduce((acc, o) => acc + o.totalProfit, 0);
      const totalCommissions = paidOrders.reduce((acc, o) => acc + o.sellerCommission, 0);
      displayProfitValue = totalSystemProfit - totalCommissions;
    } else {
      displayProfitValue = paidOrders.reduce((acc, o) => acc + o.sellerCommission, 0);
    }

    const totalUnitsSold = paidOrders.reduce((acc, o) => 
      acc + o.items.reduce((sum, item) => sum + item.quantity, 0), 0
    );

    return [
      { label: 'Faturamento Pago', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <DollarSign />, color: 'bg-blue-600' },
      { label: displayProfitLabel, value: `R$ ${displayProfitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <Wallet />, color: 'bg-green-600' },
      { label: 'Unidades Vendidas', value: totalUnitsSold, icon: <BookText />, color: 'bg-amber-600' },
      { label: 'Total Pedidos', value: viewOrders.length, icon: <ShoppingBag />, color: 'bg-indigo-600' },
    ];
  }, [viewOrders, isAdmin]);

  const sellerRanking = useMemo(() => {
    const map: Record<string, { name: string, avatar?: string, total: number }> = {};
    orders.filter(o => o.status !== OrderStatus.PENDING_PAYMENT).forEach(o => {
      const seller = sellers.find(s => s.id === o.sellerId);
      if (!seller) return;
      if (!map[o.sellerId]) map[o.sellerId] = { name: seller.name, avatar: seller.avatar, total: 0 };
      map[o.sellerId].total += o.totalValue;
    });
    return Object.values(map).sort((a,b) => b.total - a.total).slice(0, 5);
  }, [orders, sellers]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${alerts.pendingPayment > 0 ? 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-900/5' : 'bg-white border-slate-100 opacity-60'}`}>
          <div className="flex items-center gap-5">
            <div className={`p-5 rounded-2xl ${alerts.pendingPayment > 0 ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
              <Clock size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Aprovação Financeira</p>
              <h4 className="text-3xl font-black text-slate-900 italic tracking-tighter">{alerts.pendingPayment} Pedidos</h4>
            </div>
          </div>
          {alerts.pendingPayment > 0 && (
            <div className="flex flex-col items-end gap-1">
              <span className="bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full animate-pulse shadow-md">PENDENTE</span>
              <p className="text-[9px] font-bold text-amber-600 uppercase italic">Aguardando Pagto</p>
            </div>
          )}
        </div>

        <div className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${alerts.pendingShipping > 0 ? 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-900/5' : 'bg-white border-slate-100 opacity-60'}`}>
          <div className="flex items-center gap-5">
            <div className={`p-5 rounded-2xl ${alerts.pendingShipping > 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
              <Truck size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Pronto para Expedição</p>
              <h4 className="text-3xl font-black text-slate-900 italic tracking-tighter">{alerts.pendingShipping} Pedidos</h4>
            </div>
          </div>
          {alerts.pendingShipping > 0 && (
            <div className="flex flex-col items-end gap-1">
              <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full animate-pulse shadow-md">EXPEDIÇÃO</span>
              <p className="text-[9px] font-bold text-blue-600 uppercase italic">Pendente Envio</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-5 transition-transform hover:scale-[1.02]">
            <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 italic tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isAdmin && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3 mb-8 border-b border-slate-50 pb-5">
              <Award className="text-blue-600" size={24} />
              <h3 className="font-black text-xl uppercase italic tracking-tighter">Ranking Vendedores</h3>
            </div>
            <div className="space-y-4">
              {sellerRanking.length > 0 ? sellerRanking.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-white hover:border-blue-100 group">
                  <div className="flex items-center space-x-3">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-black shadow-sm ${i === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {i + 1}
                    </span>
                    <span className="font-black text-sm text-slate-800 uppercase italic tracking-tight">{s.name}</span>
                  </div>
                  <span className="text-blue-600 font-black text-sm italic tracking-tighter">R$ {s.total.toLocaleString('pt-BR')}</span>
                </div>
              )) : (
                <div className="py-12 text-center">
                  <AlertCircle size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-[10px] text-slate-400 font-black uppercase italic tracking-widest">Nenhuma venda paga ainda</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-8 border-b border-slate-50 pb-5">
            <TrendingUp className="text-green-600" size={24} />
            <h3 className="font-black text-xl uppercase italic tracking-tighter">Best Sellers</h3>
          </div>
          <div className="space-y-4">
            {paidOrdersCountByBook().slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl transition-all">
                <span className="text-xs font-black uppercase truncate max-w-[180px] text-slate-700 italic tracking-tight">{item.title}</span>
                <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm">{item.count} UN</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-8 border-b border-slate-50 pb-5">
            <Package className="text-amber-600" size={24} />
            <h3 className="font-black text-xl uppercase italic tracking-tighter">Estoque Crítico</h3>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             {books.filter(b => !b.isBundle).sort((a,b) => a.stock - b.stock).map(book => (
               <div key={book.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${book.stock < 10 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                 <span className="text-[10px] font-black truncate max-w-[160px] text-slate-500 uppercase italic tracking-widest leading-none">{book.title}</span>
                 <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-black italic ${book.stock < 10 ? 'text-red-600' : 'text-slate-900'}`}>{book.stock}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic">UN</span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );

  function paidOrdersCountByBook() {
    const map: Record<string, {title: string, count: number}> = {};
    orders.filter(o => o.status !== OrderStatus.PENDING_PAYMENT).forEach(o => {
      o.items.forEach(item => {
        if(!map[item.bookId]) map[item.bookId] = {title: item.bookTitle, count: 0};
        map[item.bookId].count += item.quantity;
      });
    });
    return Object.values(map).sort((a,b) => b.count - a.count);
  }
};

export default Dashboard;
