
import React, { useState } from 'react';
import { Order, OrderStatus, Seller } from '../types';
import { Package, Truck, Search, Eye, FileText, X, CheckCircle, Tag, MapPin, Clock, Star } from 'lucide-react';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  sellers: Seller[];
}

const ShippingManager: React.FC<Props> = ({ orders, setOrders, sellers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingData, setShippingData] = useState({ trackingNumber: '', document: '' });
  const [showHistory, setShowHistory] = useState(false);
  const [labelToPrint, setLabelToPrint] = useState<Order | null>(null);

  const filteredOrders = orders.filter(o => {
    const statusMatch = showHistory ? o.status === OrderStatus.SHIPPED : o.status === OrderStatus.CONFIRMED;
    const searchMatch = o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
    return statusMatch && searchMatch;
  });

  const handleConfirmShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const updatedOrder = { 
      ...selectedOrder, 
      status: OrderStatus.SHIPPED, 
      trackingNumber: shippingData.trackingNumber, 
      shippingDocument: shippingData.document 
    };

    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
    setSelectedOrder(null);
    setShippingData({ trackingNumber: '', document: '' });
    alert("Expedição realizada com sucesso!");
  };

  const printLabel = (order: Order) => {
    setLabelToPrint(order);
    setTimeout(() => {
      window.print();
      setLabelToPrint(null);
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3 leading-none">
            <Truck size={32} className="text-blue-600" /> Fluxo de Expedição
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setShowHistory(false)} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full transition-all flex items-center gap-2 ${!showHistory ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
              <Clock size={12} /> A Enviar
            </button>
            <button onClick={() => setShowHistory(true)} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full transition-all flex items-center gap-2 ${showHistory ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
              <CheckCircle size={12} /> Despachados
            </button>
          </div>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Nome, CEP ou Pedido..." className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold shadow-sm italic transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden no-print">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="p-8">Controle Interno</th>
                <th className="p-8">Destinatário EP</th>
                <th className="p-8 text-center">Modalidade</th>
                <th className="p-8 text-right">Gestão Logística</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-bold">
              {filteredOrders.length > 0 ? filteredOrders.map(order => {
                const seller = sellers.find(s => s.id === order.sellerId);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-8">
                      <p className="font-mono text-[10px] text-slate-400 italic font-black leading-none">#{order.id.slice(0, 10).toUpperCase()}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black italic mt-1 leading-none">{new Date(order.date).toLocaleDateString()}</p>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <p className="font-black uppercase italic text-slate-900 text-base leading-none mb-1 tracking-tighter">{order.customer.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase italic tracking-widest">{order.customer.zip} | {seller?.name || 'Venda EP'}</p>
                        </div>
                        <button onClick={() => printLabel(order)} className="p-3 bg-white text-slate-400 hover:text-blue-600 transition-all rounded-2xl shadow-sm border border-slate-100" title="Imprimir Etiqueta"><Tag size={20} /></button>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic shadow-sm border ${order.shippingType === 'SEDEX' ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                        {order.shippingType || 'PAC'}
                      </span>
                    </td>
                    <td className="p-8 text-right">
                      {order.status === OrderStatus.CONFIRMED ? (
                        <button onClick={() => setSelectedOrder(order)} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black italic shadow-2xl hover:bg-blue-500 transition-all flex items-center gap-3 ml-auto text-sm uppercase tracking-tighter leading-none group-hover:scale-105 active:scale-95">
                          <Truck size={20} /> Despachar
                        </button>
                      ) : (
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-green-600 text-[10px] font-black uppercase flex items-center gap-2 italic leading-none border-2 border-green-100 bg-green-50 px-3 py-1.5 rounded-full">
                            <CheckCircle size={14}/> Enviado
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase italic font-black">TRACK: {order.trackingNumber}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="p-40 text-center text-slate-300 font-black uppercase italic tracking-widest text-xs">Sem fluxo pendente no momento</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reutiliza o mesmo design de etiqueta térmica otimizado */}
      {labelToPrint && (
        <div className="print-only bg-white min-h-screen flex items-center justify-center p-4">
          <div className="border-[8px] border-black w-full max-w-[480px] p-8 font-sans text-black space-y-10 leading-none">
            <div className="flex justify-between items-center border-b-8 border-black pb-6">
               <div className="flex items-center gap-3">
                  <Star size={32} className="fill-black" />
                  <h1 className="text-3xl font-black uppercase tracking-tighter">EP LOGÍSTICA</h1>
               </div>
               <div className="bg-black text-white px-4 py-2 font-black text-lg">{labelToPrint.shippingType}</div>
            </div>
            <div className="space-y-4">
               <p className="text-[12px] font-black uppercase tracking-widest opacity-50">DESTINATÁRIO</p>
               <h2 className="text-5xl font-black uppercase tracking-tighter border-l-8 border-black pl-4 leading-tight">{labelToPrint.customer.name}</h2>
            </div>
            <div className="space-y-4 pt-4">
               <p className="text-[12px] font-black uppercase tracking-widest opacity-50">ENDEREÇO COMPLETO</p>
               <p className="text-3xl font-black uppercase leading-tight tracking-tight">{labelToPrint.customer.address}</p>
            </div>
            <div className="flex flex-col gap-6 pt-10 border-t-8 border-black">
               <div className="bg-black text-white p-6 flex flex-col items-center justify-center space-y-2">
                  <p className="text-[12px] font-black uppercase tracking-widest">CÓDIGO POSTAL / CEP</p>
                  <p className="text-7xl font-black tracking-widest">{labelToPrint.customer.zip}</p>
               </div>
               <div className="flex justify-between items-end italic font-black text-[10px] uppercase opacity-40">
                  <span>Evangelho Prático © Logística</span>
                  <span>REF: #{labelToPrint.id.slice(0, 10).toUpperCase()}</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[120] bg-slate-900/98 flex items-center justify-center p-4 backdrop-blur-md no-print">
          <div className="bg-slate-800 w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in duration-300">
            <div className="bg-slate-700 p-12 flex justify-between items-center border-b border-slate-600">
              <h3 className="text-white font-black text-4xl uppercase tracking-tighter italic flex items-center gap-6 leading-none">
                <Package size={48} className="text-blue-400" /> Expedição EP
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X size={48} />
              </button>
            </div>
            <form onSubmit={handleConfirmShipment} className="p-14 space-y-12 text-slate-100">
              <div className="bg-slate-900 p-10 rounded-[3rem] border-2 border-slate-700 shadow-inner space-y-4">
                 <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.3em] italic leading-none">Objeto para:</p>
                 <p className="text-white font-black text-3xl uppercase italic tracking-tighter leading-none">{selectedOrder.customer.name}</p>
                 <div className="flex items-start gap-4 pt-6 border-t border-slate-800">
                   <MapPin size={24} className="text-slate-600 shrink-0" />
                   <p className="text-slate-400 text-lg italic uppercase leading-tight font-black tracking-tighter">{selectedOrder.customer.address} ({selectedOrder.customer.zip})</p>
                 </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 italic">Código de Rastreio EP *</label>
                <input required className="w-full p-8 bg-slate-700 text-white border-4 border-slate-600 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-blue-500 font-black uppercase tracking-[0.2em] placeholder:text-slate-600 italic text-2xl shadow-inner text-center" placeholder="EP-XXXX-BR" value={shippingData.trackingNumber} onChange={e => setShippingData({...shippingData, trackingNumber: e.target.value.toUpperCase()})} />
              </div>

              <div className="flex justify-end gap-10 pt-10">
                <button type="button" onClick={() => setSelectedOrder(null)} className="text-slate-500 font-black hover:text-white uppercase tracking-widest text-sm transition-colors">Voltar</button>
                <button type="submit" className="flex-1 py-8 bg-blue-600 text-white rounded-[2.5rem] font-black italic tracking-tighter uppercase shadow-2xl hover:bg-blue-500 active:scale-95 transition-all text-2xl leading-none">Confirmar Envio</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingManager;
