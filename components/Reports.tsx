
import React, { useMemo, useState } from 'react';
import { Order, Book, OrderStatus, Seller } from '../types';
import { TrendingUp, Download, Calendar, Filter, Users, PieChart as PieChartIcon, BarChart as BarChartIcon, DollarSign, Wallet, Star } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

interface Props {
  orders: Order[];
  books: Book[];
  sellers: Seller[];
}

const Reports: React.FC<Props> = ({ orders, books, sellers }) => {
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [sellerFilter, setSellerFilter] = useState('ALL');

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const isPaid = o.status !== OrderStatus.PENDING_PAYMENT;
      const orderDate = new Date(o.date);
      
      let inDateRange = true;
      if (dateFilter.start) {
        const start = new Date(dateFilter.start);
        if (orderDate < start) inDateRange = false;
      }
      if (dateFilter.end) {
        const end = new Date(dateFilter.end);
        end.setHours(23, 59, 59);
        if (orderDate > end) inDateRange = false;
      }
      
      const isCorrectSeller = sellerFilter === 'ALL' || o.sellerId === sellerFilter;

      return isPaid && inDateRange && isCorrectSeller;
    });
  }, [orders, dateFilter, sellerFilter]);

  const metrics = useMemo(() => {
    const revenue = filteredOrders.reduce((acc, o) => acc + o.totalValue, 0);
    const profit = filteredOrders.reduce((acc, o) => acc + o.totalProfit, 0);
    const commissions = filteredOrders.reduce((acc, o) => acc + o.sellerCommission, 0);
    const cost = filteredOrders.reduce((acc, o) => acc + o.totalCost, 0);
    
    return { revenue, profit, commissions, cost, net: profit - commissions };
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    const data: Record<string, any> = {};
    filteredOrders.forEach(o => {
      const seller = sellers.find(s => s.id === o.sellerId)?.name || 'Canal Direto';
      if (!data[seller]) data[seller] = { name: seller, vendas: 0, comissao: 0 };
      data[seller].vendas += o.totalValue;
      data[seller].comissao += o.sellerCommission;
    });
    return Object.values(data).sort((a,b) => b.vendas - a.vendas);
  }, [filteredOrders, sellers]);

  const compositionData = [
    { name: 'Custo de Produção', value: metrics.cost },
    { name: 'Comissões Equipe', value: metrics.commissions },
    { name: 'Lucro Disponível EP', value: metrics.net }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
          <Star className="text-blue-600 fill-blue-600" size={32} /> Inteligência de Dados
        </h2>
        <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl leading-none flex items-center gap-3">
          <Download size={16} /> Fechamento de Ciclo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><Calendar size={12} /> Data Início</label>
          <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={dateFilter.start} onChange={e => setDateFilter({...dateFilter, start: e.target.value})} />
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><Calendar size={12} /> Data Final</label>
          <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={dateFilter.end} onChange={e => setDateFilter({...dateFilter, end: e.target.value})} />
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><Filter size={12} /> Filtro Canal</label>
          <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}>
            <option value="ALL">Toda a Organização</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Faturamento Bruto', value: metrics.revenue, color: 'text-blue-600', icon: <DollarSign /> },
          { label: 'Provisão Comissões', value: metrics.commissions, color: 'text-amber-600', icon: <Users /> },
          { label: 'Lucro do Projeto', value: metrics.profit, color: 'text-green-600', icon: <TrendingUp /> },
          { label: 'Resultado Final EP', value: metrics.net, color: 'text-slate-900', icon: <Wallet />, dark: true },
        ].map((item, i) => (
          <div key={i} className={`${item.dark ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white text-slate-900'} p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-transform hover:scale-105`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${item.dark ? 'text-blue-400' : 'text-slate-400'}`}>{item.label}</p>
            <h4 className={`text-2xl font-black italic tracking-tighter ${!item.dark && item.color}`}>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl h-[480px]">
          <h3 className="font-black uppercase italic text-lg tracking-tighter mb-8 flex items-center gap-3">
            <BarChartIcon size={20} className="text-blue-600" /> Vendas x Canal
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} fontWeight="black" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} fontWeight="black" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px'}} />
              <Bar dataKey="vendas" fill="#2563eb" radius={[10, 10, 0, 0]} name="Faturamento R$" />
              <Bar dataKey="comissao" fill="#f59e0b" radius={[10, 10, 0, 0]} name="Comissão R$" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl h-[480px]">
          <h3 className="font-black uppercase italic text-lg tracking-tighter mb-8 flex items-center gap-3">
            <PieChartIcon size={20} className="text-green-600" /> Distribuição de Margem EP
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={compositionData} innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none">
                {compositionData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="font-black uppercase italic tracking-widest text-sm flex items-center gap-3 leading-none">
            <Star size={20} className="text-blue-400 fill-blue-400" /> Demonstrativo Financeiro Evangelho Prático
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <th className="p-6">Representante / Canal</th>
                <th className="p-6 text-right">Volume Processado</th>
                <th className="p-6 text-right">Taxa Atribuída</th>
                <th className="p-6 text-right">Provisão Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold text-sm">
              {chartData.map((row, i) => {
                const sellerInfo = sellers.find(s => s.name === row.name);
                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 uppercase italic font-black text-slate-900 leading-none">{row.name}</td>
                    <td className="p-6 text-right text-slate-400">R$ {row.vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-6 text-right font-black italic">{sellerInfo?.commissionRate || 0}%</td>
                    <td className="p-6 text-right text-blue-600 font-black text-lg italic tracking-tighter">R$ {row.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
              {chartData.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase italic text-xs">Aguardando dados de fechamento</td>
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
