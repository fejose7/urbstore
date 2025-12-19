
import React, { useState } from 'react';
import { Order, OrderStatus, Seller } from '../types';
import { Package, Truck, Search, Eye, FileText, Upload, X, CheckCircle, Printer, Tag, MapPin, User, Phone, Briefcase, AlertCircle, Component as SheepIcon } from 'lucide-react';

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
    alert("Expedição concluída com sucesso!");
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
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Logística de Envios</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowHistory(false)} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full transition-all shadow-sm ${!showHistory ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>Pendentes</button>
            <button onClick={() => setShowHistory(true)} className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full transition-all shadow-sm ${showHistory ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>Enviados</button>
          </div>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Localizar destinatário..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] outline-none focus:ring-2 focus:ring-blue-500 font-bold shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden no-print">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <th className="p-6">ID Pedido</th>
              <th className="p-6">Destinatário</th>
              <th className="p-6">Vendedor</th>
              <th className="p-6">Frete</th>
              <th className="p-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-bold">
            {filteredOrders.length > 0 ? filteredOrders.map(order => {
              const seller = sellers.find(s => s.id === order.sellerId);
              return (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6 font-mono text-[10px] text-slate-400 italic">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-6 text-slate-900 uppercase italic">
                    <div className="flex items-center gap-3">
                      <p className="font-black leading-tight">{order.customer.name}</p>
                      <button onClick={() => printLabel(order)} className="p-2.5 bg-white text-slate-400 hover:text-blue-600 transition-all rounded-xl shadow-sm border border-slate-100" title="Imprimir Etiqueta"><Tag size={18} /></button>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                       <Briefcase size={14} className="text-slate-300" />
                       <span className="text-[10px] font-black uppercase text-slate-500 italic tracking-widest">{seller?.name || 'Venda Direta'}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic shadow-sm ${order.shippingType === 'SEDEX' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                      {order.shippingType || 'Simples'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    {order.status === OrderStatus.CONFIRMED ? (
                      <button onClick={() => setSelectedOrder(order)} className="bg-blue-600 text-white px-7 py-3 rounded-2xl font-black italic shadow-xl hover:bg-blue-500 transition-all flex items-center gap-2 ml-auto text-xs uppercase tracking-tighter">
                        <Truck size={18} /> Despachar
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-green-600 text-[10px] font-black uppercase flex items-center gap-2 italic leading-none">
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
                <td colSpan={5} className="p-32 text-center text-slate-300 font-black uppercase italic tracking-widest text-xs">Nenhum pedido aguardando despacho</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {labelToPrint && (
        <div className="print-only bg-white p-12 min-h-screen flex flex-col items-center">
          <div className="border-[15px] border-slate-900 p-16 rounded-none max-w-4xl w-full text-center font-mono space-y-16 relative">
            
            <div className="absolute top-6 left-6 flex items-center gap-3">
               <div className="bg-slate-900 p-1 rounded-lg">
                 <SheepIcon size={40} className="text-white" />
               </div>
               <div className="font-black italic text-4xl tracking-tighter uppercase">Manus Libros</div>
            </div>
            
            <div className="absolute top-6 right-6 font-black italic uppercase text-2xl bg-slate-900 text-white px-8 py-3">{labelToPrint.shippingType}</div>
            
            <h1 className="text-8xl font-black uppercase italic tracking-tighter border-b-[12px] border-slate-900 pb-16 pt-32">DESTINATÁRIO</h1>
            
            <div className="space-y-16 py-16">
              <div className="flex flex-col items-center gap-6">
                <p className="text-3xl uppercase font-black text-slate-400 tracking-[0.6em]">Nome Completo</p>
                <h2 className="text-8xl font-black uppercase italic leading-none tracking-tight">{labelToPrint.customer.name}</h2>
              </div>
              
              <div className="space-y-8">
                <p className="text-3xl font-black uppercase text-slate-400 tracking-[0.6em]">Endereço de Entrega Completo</p>
                <p className="text-5xl font-black uppercase italic tracking-tight leading-tight max-w-5xl mx-auto">{labelToPrint.customer.address}</p>
                
                <div className="inline-block bg-slate-900 text-white px-20 py-10 mt-12 shadow-2xl">
                  <p className="text-8xl font-black tracking-[0.2em]">CEP: {labelToPrint.customer.zip}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-24 border-t-[10px] border-slate-900 grid grid-cols-2 text-left gap-24">
               <div className="space-y-3">
                 <p className="text-sm font-black uppercase text-slate-400 italic tracking-[0.2em]">Telefone para Contato</p>
                 <div className="flex items-center gap-6">
                   <Phone size={48} className="text-slate-900" />
                   <p className="text-5xl font-black italic">{labelToPrint.customer.phone}</p>
                 </div>
               </div>
               <div className="text-right flex flex-col items-end space-y-3">
                 <p className="text-sm font-black uppercase text-slate-400 italic tracking-[0.2em]">Remetente Oficial</p>
                 <p className="text-4xl font-black italic uppercase">Manus Libros Logistics</p>
                 <p className="text-[14px] font-black uppercase text-slate-400 italic mt-4 tracking-[0.3em] border-2 border-slate-900 px-4 py-1">REF: #{labelToPrint.id.slice(0,10).toUpperCase()}</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[120] bg-slate-900/98 flex items-center justify-center p-4 backdrop-blur-md no-print">
          <div className="bg-slate-800 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-700">
            <div className="bg-slate-700 p-10 flex justify-between items-center border-b border-slate-600">
              <h3 className="text-white font-black text-3xl uppercase tracking-tighter italic flex items-center gap-4 leading-none">
                <Truck size={36} className="text-blue-400" /> Confirmar Envio
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={36} />
              </button>
            </div>
            <form onSubmit={handleConfirmShipment} className="p-12 space-y-10 text-slate-100">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-700 shadow-inner space-y-5">
                 <div className="space-y-1">
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest italic">Destinatário Manus Libros</p>
                    <p className="text-white font-black text-2xl uppercase italic tracking-tighter leading-none">{selectedOrder.customer.name}</p>
                  </div>
                <div className="flex items-start gap-4 pt-5 border-t border-slate-800/50">
                  <MapPin size={20} className="text-slate-600 mt-1 shrink-0" />
                  <p className="text-slate-400 text-sm italic uppercase leading-relaxed font-black tracking-tight">{selectedOrder.customer.address}, {selectedOrder.customer.zip}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Cód. Rastreio Transportadora *</label>
                <input required className="w-full p-6 bg-slate-700 text-white border border-slate-600 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase tracking-widest placeholder:text-slate-600 italic text-xl shadow-inner" placeholder="Ex: BR123456789XX" value={shippingData.trackingNumber} onChange={e => setShippingData({...shippingData, trackingNumber: e.target.value.toUpperCase()})} />
              </div>

              <div className="flex justify-end gap-8 pt-6">
                <button type="button" onClick={() => setSelectedOrder(null)} className="text-slate-500 font-black hover:text-white uppercase tracking-widest text-xs transition-colors">Abortar</button>
                <button type="submit" className="flex-1 py-6 bg-blue-600 text-white rounded-3xl font-black italic tracking-tighter uppercase shadow-2xl hover:bg-blue-500 active:scale-95 transition-all text-lg">Efetivar Envio</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingManager;
