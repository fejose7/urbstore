
import React, { useMemo, useState } from 'react';
import { Order, Book, OrderStatus, Seller } from '../types';
import { TrendingUp, Wallet, ShoppingBag, Download, AlertCircle, Calendar, Filter, Users, UserX, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  orders: Order[];
  books: Book[];
  sellers: Seller[];
}

const Reports: React.FC<Props> = ({ orders, books, sellers }) => {
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [sellerFilter, setSellerFilter] = useState('ALL');

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const isPaid = o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.SHIPPED;
      
      const orderDate = new Date(o.date);
      orderDate.setHours(0, 0, 0, 0);

      let inDateRange = true;
      if (dateFilter.start) {
        const start = new Date(dateFilter.start);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) inDateRange = false;
      }
      if (dateFilter.end) {
        const end = new Date(dateFilter.end);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) inDateRange = false;
      }
      
      const isCorrectSeller = sellerFilter === 'ALL' || (sellerFilter === 'NONE' ? o.sellerId === null : o.sellerId === sellerFilter);

      return isPaid && inDateRange && isCorrectSeller;
    });
  }, [orders, dateFilter, sellerFilter]);

  const metrics = useMemo(() => {
    const revenue = filteredOrders.reduce((acc, o) => acc + o.totalValue, 0);
    const cost = filteredOrders.reduce((acc, o) => acc + o.totalCost, 0);
    const profit = filteredOrders.reduce((acc, o) => acc + o.totalProfit, 0);
    const commission = filteredOrders.reduce((acc, o) => acc + o.sellerCommission, 0);
    
    return { revenue, cost, profit, commission, netAfterCommission: profit - commission };
  }, [filteredOrders]);

  const commissionReport = useMemo(() => {
    const report: Record<string, { name: string, rate: number, totalSales: number, totalCommission: number }> = {};
    
    filteredOrders.forEach(o => {
      const id = o.sellerId || 'NONE';
      if (!report[id]) {
        const seller = sellers.find(s => s.id === o.sellerId);
        report[id] = { 
          name: id === 'NONE' ? 'Manus Direta' : (seller?.name || 'Inativo'), 
          rate: id === 'NONE' ? 0 : (seller?.commissionRate || 0), 
          totalSales: 0, 
          totalCommission: 0 
        };
      }
      report[id].totalSales += o.totalValue;
      report[id].totalCommission += o.sellerCommission;
    });
    
    return Object.values(report).sort((a,b) => b.totalSales - a.totalSales);
  }, [filteredOrders, sellers]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
          <TrendingUp className="text-blue-600" size={32} /> urb_intelligence
        </h2>
        <button onClick={() => window.print()} className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all active:scale-95 uppercase italic tracking-tighter text-sm">
          <Download size={20} /> Exportar Fechamento
        </button>
      </div>

      {/* Seletor de Período via Calendário Visual */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 grid grid-cols-1 md:grid-cols-3 gap-10 no-print relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Calendar size={120} /></div>
        
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
            <Calendar size={14} className="text-blue-500" /> Início do Período
          </label>
          <div className="relative group">
            <input 
              type="date" 
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer" 
              value={dateFilter.start} 
              onChange={e => setDateFilter({...dateFilter, start: e.target.value})} 
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
            <Calendar size={14} className="text-blue-500" /> Final do Período
          </label>
          <div className="relative group">
            <input 
              type="date" 
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer" 
              value={dateFilter.end} 
              onChange={e => setDateFilter({...dateFilter, end: e.target.value})} 
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
            <Filter size={14} className="text-blue-500" /> Origem das Vendas
          </label>
          <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer" value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}>
            <option value="ALL">Todo o Time</option>
            <option value="NONE">Apenas Manus Direta</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-blue-500 transition-all">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ShoppingBag size={20} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Vendas Pagas</p>
          </div>
          <h4 className="text-3xl font-black text-slate-900 italic tracking-tighter">R$ {metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-green-500 transition-all">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all">
                <Wallet size={20} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Lucro Bruto</p>
          </div>
          <h4 className="text-3xl font-black text-green-600 italic tracking-tighter">R$ {metrics.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-amber-500 transition-all">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all">
                <AlertCircle size={20} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Comissões</p>
          </div>
          <h4 className="text-3xl font-black text-amber-600 italic tracking-tighter">R$ {metrics.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-blue-900/20 group hover:bg-slate-800 transition-all">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-blue-600 text-white rounded-xl">
                <CheckCircle size={20} />
             </div>
             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Saldo Real Manus</p>
          </div>
          <h4 className="text-3xl font-black italic tracking-tighter">R$ {metrics.netAfterCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="font-black uppercase italic tracking-[0.2em] text-sm flex items-center gap-3">
             <Users size={22} className="text-blue-400" /> Demonstrativo de Performace e Comissionamento
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b">
                <th className="p-6">Nome / Identificação Vendedor</th>
                <th className="p-6 text-center">Taxa (%)</th>
                <th className="p-6 text-right">Faturamento Gerado</th>
                <th className="p-6 text-right text-blue-600 font-black">Provisão Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-bold">
              {commissionReport.length > 0 ? commissionReport.map((rep, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-all">
                  <td className="p-6">
                    <span className="text-slate-900 italic uppercase font-black tracking-tight">{rep.name}</span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black italic shadow-sm">{rep.rate}%</span>
                  </td>
                  <td className="p-6 text-right italic text-slate-400 font-bold">R$ {rep.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-6 text-right font-black text-blue-600 text-xl italic tracking-tighter">R$ {rep.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-24 text-center">
                    <AlertCircle size={48} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-slate-300 font-black uppercase italic tracking-[0.3em] text-xs">Sem dados para os filtros selecionados</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
