
import React, { useState } from 'react';
import { Order, OrderStatus, Book, Seller, UserAccount, UserRole } from '../types';
import { Search, Eye, CheckCircle, Printer, Tag, X, Upload, Truck, Clock, AlertCircle, MapPin, Phone, User, FileText, Star } from 'lucide-react';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  sellers: Seller[];
  user: UserAccount;
}

const Orders: React.FC<Props> = ({ orders, setOrders, books, setBooks, sellers, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [labelToPrint, setLabelToPrint] = useState<Order | null>(null);

  const isAdmin = user.role === UserRole.ADMIN;
  
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
    if (!isAdmin) return matchesSearch && o.sellerId === user.id;
    return matchesSearch;
  });

  const handleConfirmPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingOrder || !receiptBase64) {
      alert("É obrigatório anexar o comprovante para confirmar o pagamento.");
      return;
    }

    setOrders(prev => prev.map(o => o.id === confirmingOrder.id ? { 
      ...o, 
      status: OrderStatus.CONFIRMED, 
      receiptData: receiptBase64 || undefined 
    } : o));
    
    const updatedBooks = [...books];
    confirmingOrder.items.forEach(item => {
      const bookIdx = updatedBooks.findIndex(b => b.id === item.bookId);
      if (bookIdx !== -1) {
        updatedBooks[bookIdx] = { 
          ...updatedBooks[bookIdx], 
          stock: Math.max(0, updatedBooks[bookIdx].stock - item.quantity) 
        };
      }
    });
    
    setBooks(updatedBooks);
    setConfirmingOrder(null);
    setReceiptBase64(null);
    alert("Venda confirmada no sistema!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const printLabel = (order: Order) => {
    setLabelToPrint(order);
    setTimeout(() => {
      window.print();
      setLabelToPrint(null);
    }, 300);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return <span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 italic tracking-tighter"><Clock size={12}/> Aguardando PIX</span>;
      case OrderStatus.CONFIRMED:
        return <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 italic tracking-tighter"><CheckCircle size={12}/> Pago / Pend. Envio</span>;
      case OrderStatus.SHIPPED:
        return <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 italic tracking-tighter shadow-lg shadow-blue-900/20"><Truck size={12}/> Enviado</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Localizar cliente ou código..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 shadow-sm outline-none font-bold italic" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden no-print">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="p-6">Ref. Pedido</th>
                <th className="p-6">Cliente</th>
                <th className="p-6 text-right">Valor Final</th>
                <th className="p-6 text-center">Situação</th>
                <th className="p-6 text-right">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-mono text-[10px] text-slate-400 italic font-black">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase mt-1 italic">{new Date(order.date).toLocaleDateString()}</p>
                  </td>
                  <td className="p-6 uppercase italic font-black text-slate-900 tracking-tighter truncate max-w-[200px]">{order.customer.name}</td>
                  <td className="p-6 text-right font-black text-blue-600 italic text-lg tracking-tighter">R$ {order.totalValue.toFixed(2)}</td>
                  <td className="p-6">
                    <div className="flex justify-center">{getStatusBadge(order.status)}</div>
                  </td>
                  <td className="p-6 text-right space-x-2 whitespace-nowrap">
                    {order.status === OrderStatus.PENDING_PAYMENT && isAdmin && (
                      <button onClick={() => setConfirmingOrder(order)} className="p-3 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all border border-green-100 shadow-sm" title="Confirmar Pagamento"><CheckCircle size={18} /></button>
                    )}
                    <button onClick={() => setSelectedOrder(order)} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 shadow-sm" title="Ver Detalhes"><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase italic tracking-widest text-xs">Nenhum registro encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmingOrder && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-sm no-print">
          <div className="bg-slate-800 w-full max-w-lg rounded-[3rem] shadow-2xl p-12 border border-slate-700 animate-in zoom-in duration-300">
            <h3 className="text-white font-black text-2xl mb-10 uppercase italic tracking-tighter flex items-center gap-4">
              <CheckCircle className="text-green-500" size={32} /> Confirmar Recebimento
            </h3>
            <form onSubmit={handleConfirmPaymentSubmit} className="space-y-8">
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-700 shadow-inner">
                <p className="text-blue-400 font-black text-3xl italic tracking-tighter">R$ {confirmingOrder.totalValue.toFixed(2)}</p>
                <p className="text-slate-500 text-[10px] font-black uppercase mt-2 tracking-widest leading-none">{confirmingOrder.customer.name}</p>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Anexar Comprovante do Cliente *</label>
                <label className={`flex flex-col items-center justify-center w-full h-40 border-4 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${receiptBase64 ? 'border-green-500 bg-green-500/10' : 'border-slate-600 hover:border-blue-500 hover:bg-slate-700/50'}`}>
                  <input type="file" required className="hidden" onChange={handleFileUpload} />
                  {receiptBase64 ? (
                    <div className="flex flex-col items-center text-green-400">
                      <CheckCircle size={32} className="mb-2" />
                      <span className="text-[10px] font-black uppercase">Imagem Carregada</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500">
                      <Upload size={32} className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Clique para subir o arquivo</span>
                    </div>
                  )}
                </label>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => {setConfirmingOrder(null); setReceiptBase64(null);}} className="flex-1 py-4 text-slate-400 font-black hover:text-white uppercase text-xs tracking-widest">Desistir</button>
                <button type="submit" className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-black uppercase italic shadow-2xl hover:bg-green-500 transition-all text-lg tracking-tighter">Efetivar Baixa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white w-full max-w-2xl my-8 rounded-[3.5rem] shadow-2xl p-12 relative animate-in zoom-in duration-300">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><X size={32} /></button>
            <div className="space-y-10">
              <div className="flex justify-between items-start border-b-[8px] border-slate-900 pb-8">
                <div>
                  <h2 className="text-5xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">Evangelho Prático</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Registro de Venda Consolidado</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-1">ID Transação</p>
                  <p className="text-2xl font-mono font-black italic tracking-tighter">#{selectedOrder.id.slice(0, 10).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><User size={12}/> Cliente Destino</p>
                  <p className="text-2xl font-black uppercase italic leading-none">{selectedOrder.customer.name}</p>
                  <p className="text-sm font-bold text-slate-600 leading-snug">{selectedOrder.customer.address}</p>
                  <p className="text-sm font-black bg-slate-100 w-fit px-3 py-1 rounded-lg">CEP: {selectedOrder.customer.zip}</p>
                </div>
                <div className="text-right space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Dados Auxiliares</p>
                  <div className="space-y-2">
                    <p className="text-sm font-black italic uppercase">Data: <span className="text-slate-900">{new Date(selectedOrder.date).toLocaleDateString()}</span></p>
                    <p className="text-sm font-black italic uppercase">Origem: <span className="text-blue-600">{sellers.find(s => s.id === selectedOrder.sellerId)?.name || 'Venda Direta'}</span></p>
                    <div className="flex justify-end pt-2">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2.5rem] border-4 border-slate-100 border-dashed">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-6 italic tracking-widest border-b border-slate-200 pb-3">Itens do Pedido</p>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm font-black italic">
                      <span className="text-slate-800 uppercase leading-none">{item.bookTitle} <span className="bg-slate-900 text-white px-2 py-0.5 rounded ml-2 not-italic text-[10px] font-black">{item.quantity} un</span></span>
                      <span>R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-black text-slate-400 italic"><span>Logística ({selectedOrder.shippingType})</span><span>R$ {selectedOrder.shippingCost.toFixed(2)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between text-xs font-black text-red-500 italic"><span>Desconto Comercial</span><span>- R$ {selectedOrder.discount.toFixed(2)}</span></div>}
                  <div className="flex justify-between pt-6 border-t-4 border-slate-900 font-black text-5xl italic tracking-tighter text-blue-600 leading-none">
                    <span>LIQUIDO</span>
                    <span>R$ {selectedOrder.totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => window.print()} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase italic flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all text-sm tracking-widest leading-none"><Printer size={20}/> Gerar Cupom</button>
                {isAdmin && (
                  <button onClick={() => printLabel(selectedOrder)} className="flex-1 py-5 bg-amber-500 text-white rounded-2xl font-black uppercase italic flex items-center justify-center gap-3 shadow-2xl hover:bg-amber-400 transition-all text-sm tracking-widest leading-none"><Tag size={20}/> Etiqueta Térmica</button>
                )}
                {selectedOrder.receiptData && (
                   <button onClick={() => {
                     const win = window.open();
                     win?.document.write(`<div style="display:flex;justify-content:center;padding:20px;"><img src="${selectedOrder.receiptData}" style="max-width:100%;box-shadow:0 0 20px rgba(0,0,0,0.1)"/></div>`);
                   }} className="p-5 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100" title="Ver Comprovante"><FileText size={20}/></button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Etiqueta de Envio - Minimalista e Legível (Foco em Térmica) */}
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
                  <span>Evangelho Prático © Gestão de Pedidos</span>
                  <span>REF: #{labelToPrint.id.slice(0, 10).toUpperCase()}</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
