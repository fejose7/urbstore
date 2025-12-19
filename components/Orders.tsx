
import React, { useState } from 'react';
import { Order, OrderStatus, Book, Seller, UserAccount, UserRole } from '../types';
// Added Layers to imports
import { Search, Eye, CheckCircle, Printer, Tag, X, Upload, FileText, Edit3, Truck, Percent, Package, Component as SheepIcon, MapPin, Phone, Layers } from 'lucide-react';

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
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [labelToPrint, setLabelToPrint] = useState<Order | null>(null);

  const isAdmin = user.role === UserRole.ADMIN;
  
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
    if (!isAdmin) return matchesSearch && o.sellerId === user.id;
    return matchesSearch;
  });

  // Added handleUpdateDiscount to fix reference error
  const handleUpdateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const newDiscount = Number(discountValue);
    const seller = sellers.find(s => s.id === selectedOrder.sellerId);

    setOrders(prev => prev.map(o => {
      if (o.id === selectedOrder.id) {
        const subtotalAndShipping = o.totalValue + o.discount;
        const newTotalValue = Math.max(0, subtotalAndShipping - newDiscount);
        const newTotalProfit = (o.totalProfit + o.discount) - newDiscount;
        const newCommission = o.sellerId && seller ? Math.max(0, newTotalProfit * (seller.commissionRate / 100)) : 0;
        
        return {
          ...o,
          discount: newDiscount,
          totalValue: newTotalValue,
          totalProfit: newTotalProfit,
          sellerCommission: newCommission
        };
      }
      return o;
    }));
    
    setSelectedOrder(prev => {
      if (!prev) return null;
      const subtotalAndShipping = prev.totalValue + prev.discount;
      return {
        ...prev,
        discount: newDiscount,
        totalValue: Math.max(0, subtotalAndShipping - newDiscount)
      };
    });

    setIsEditingDiscount(false);
    alert("Desconto atualizado!");
  };

  const handleConfirmPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingOrder) return;

    setOrders(prev => prev.map(o => o.id === confirmingOrder.id ? { 
      ...o, 
      status: OrderStatus.CONFIRMED, 
      receiptData: receiptBase64 || undefined 
    } : o));
    
    // Baixa de estoque
    const updatedBooks = [...books];
    confirmingOrder.items.forEach(item => {
      const book = updatedBooks.find(b => b.id === item.bookId);
      if (!book) return;

      if (book.isBundle) {
        book.bundleItems?.forEach(componentId => {
          const componentIdx = updatedBooks.findIndex(b => b.id === componentId);
          if (componentIdx !== -1) {
            updatedBooks[componentIdx] = { 
              ...updatedBooks[componentIdx], 
              stock: Math.max(0, updatedBooks[componentIdx].stock - item.quantity) 
            };
          }
        });
      } else {
        const idx = updatedBooks.findIndex(b => b.id === item.bookId);
        if (idx !== -1) {
          updatedBooks[idx] = { 
            ...updatedBooks[idx], 
            stock: Math.max(0, updatedBooks[idx].stock - item.quantity) 
          };
        }
      }
    });
    
    setBooks(updatedBooks);
    setConfirmingOrder(null);
    setReceiptBase64(null);
    alert("Pagamento e comprovante registrados. Estoque atualizado!");
  };

  const printLabel = (order: Order) => {
    setLabelToPrint(order);
    setTimeout(() => {
      window.print();
      setLabelToPrint(null);
    }, 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Filtrar por nome ou ID..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 shadow-sm outline-none font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b">
                <th className="p-6">Pedido</th>
                <th className="p-6">Cliente</th>
                <th className="p-6 text-right">Total</th>
                <th className="p-6 text-center">Status Pagto</th>
                <th className="p-6 text-center">Envio</th>
                <th className="p-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-bold">
              {filteredOrders.map(order => {
                const seller = sellers.find(s => s.id === order.sellerId);
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <p className="font-mono text-[10px] text-slate-400 italic leading-none">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase mt-1 italic">{new Date(order.date).toLocaleDateString()}</p>
                    </td>
                    <td className="p-6 text-slate-900 uppercase italic leading-tight">
                       {order.customer.name}
                       <p className="text-[9px] text-slate-400 normal-case font-bold mt-1 tracking-widest uppercase">Canal: {seller?.name || 'Direta'}</p>
                    </td>
                    <td className="p-6 font-black text-right text-blue-600 text-base italic">R$ {order.totalValue.toFixed(2)}</td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        order.status === OrderStatus.PENDING_PAYMENT ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {order.status === OrderStatus.PENDING_PAYMENT ? 'Aguardando' : 'Confirmado'}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        order.status === OrderStatus.SHIPPED ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Truck size={10} className="mr-2" />
                        {order.status === OrderStatus.SHIPPED ? 'Enviado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-6 text-right space-x-2 whitespace-nowrap">
                      {order.status === OrderStatus.PENDING_PAYMENT && isAdmin && (
                        <button onClick={() => setConfirmingOrder(order)} className="p-3 text-green-600 hover:bg-green-600 hover:text-white rounded-xl border border-green-100 transition-all shadow-sm" title="Efetivar Pagamento"><CheckCircle size={20} /></button>
                      )}
                      <button onClick={() => { setSelectedOrder(order); setDiscountValue(order.discount); }} className="p-3 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl border border-blue-100 transition-all shadow-sm" title="Detalhes do Pedido"><Eye size={20} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação de Pagamento com Upload de Comprovante */}
      {confirmingOrder && (
        <div className="fixed inset-0 z-[110] bg-slate-900/98 flex items-center justify-center p-4 backdrop-blur-md no-print">
          <div className="bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 border border-slate-700 animate-in zoom-in duration-300">
            <h3 className="text-white font-black text-3xl mb-8 uppercase italic tracking-tighter flex items-center gap-4 leading-none">
              <CheckCircle size={32} className="text-green-500" /> Baixar Pedido
            </h3>
            
            <form onSubmit={handleConfirmPaymentSubmit} className="space-y-8">
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-700 shadow-inner">
                <p className="text-blue-400 font-black text-2xl italic uppercase tracking-tighter">R$ {confirmingOrder.totalValue.toFixed(2)}</p>
                <p className="text-slate-500 text-[10px] uppercase font-black mt-1 tracking-widest italic">Beneficiário: Manus Libros</p>
                <div className="mt-4 pt-4 border-t border-slate-800">
                   <p className="text-white font-bold text-xs uppercase">{confirmingOrder.customer.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anexar Comprovante (Opcional)</label>
                <label className="flex flex-col items-center justify-center w-full py-12 border-2 border-dashed border-slate-600 rounded-[1.5rem] cursor-pointer hover:bg-slate-700/50 transition-all group">
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                  {receiptBase64 ? (
                    <div className="flex flex-col items-center gap-2">
                       <FileText size={40} className="text-green-500" />
                       <span className="text-[10px] text-green-400 font-black uppercase italic">Comprovante Carregado</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={32} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Clique para selecionar</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex gap-6 pt-4">
                <button type="button" onClick={() => { setConfirmingOrder(null); setReceiptBase64(null); }} className="flex-1 py-4 text-slate-400 font-black hover:text-white uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-black uppercase italic shadow-2xl shadow-green-900/40 hover:bg-green-500 transition-all active:scale-95">Confirmar Recebimento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detalhes do Pedido / Fatura Imprimível */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 no-print overflow-y-auto">
          <div className="bg-white w-full max-w-3xl my-8 rounded-[3rem] shadow-2xl p-12 relative animate-in zoom-in duration-300">
            <button onClick={() => { setSelectedOrder(null); setIsEditingDiscount(false); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={32} /></button>

            {isEditingDiscount ? (
               <form onSubmit={handleUpdateDiscount} className="space-y-8">
                  <h3 className="text-3xl font-black border-b border-slate-900 pb-6 mb-8 uppercase italic tracking-tighter">Ajustar Desconto urb_store</h3>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Abatimento no Total (R$)</label>
                    <input type="number" step="0.01" className="w-full p-6 bg-slate-50 border border-blue-200 rounded-3xl outline-none font-black text-4xl text-blue-600 italic shadow-inner" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} />
                  </div>
                  <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase italic shadow-2xl text-xl tracking-tighter active:scale-95 transition-all">Salvar Alteração</button>
               </form>
            ) : (
              <div className="space-y-12">
                <div className="flex justify-between items-end border-b-[8px] border-slate-900 pb-8 font-black italic">
                  <div className="flex items-center gap-5">
                    <div className="bg-slate-900 p-2 rounded-2xl">
                       <SheepIcon size={48} className="text-white" />
                    </div>
                    <h2 className="text-5xl text-slate-900 italic tracking-tighter uppercase leading-none">Manus Libros</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400 mb-1 font-black">Pedido No.</p>
                    <p className="text-2xl font-mono leading-none">#{selectedOrder.id.slice(0, 10).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Dados de Entrega</p>
                    <p className="text-2xl font-black uppercase italic text-slate-900 leading-none">{selectedOrder.customer.name}</p>
                    <p className="text-sm font-bold text-slate-600 italic leading-snug">{selectedOrder.customer.address}</p>
                    <div className="flex gap-4 mt-2">
                       <p className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase italic">CEP: {selectedOrder.customer.zip}</p>
                       <p className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase italic">TEL: {selectedOrder.customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Resumo Operacional</p>
                    <p className="text-xs font-black uppercase italic">Data Lançamento: <span className="text-slate-900">{new Date(selectedOrder.date).toLocaleDateString()}</span></p>
                    <p className="text-xs font-black uppercase italic">Canal de Venda: <span className="text-blue-600">{sellers.find(s => s.id === selectedOrder.sellerId)?.name || 'Manus Direta'}</span></p>
                    <p className="text-xs font-black uppercase italic">Status Financeiro: <span className={selectedOrder.status === OrderStatus.PENDING_PAYMENT ? 'text-amber-600' : 'text-green-600'}>{selectedOrder.status === OrderStatus.PENDING_PAYMENT ? 'AGUARDANDO' : 'LIQUIDADO'}</span></p>
                  </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[2.5rem] border-4 border-slate-900 border-dashed relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><SheepIcon size={120} /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 border-b border-slate-200 pb-3">Detalhamento dos Itens</p>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 font-bold">
                        <span className="text-slate-800 italic flex items-center gap-3 uppercase text-xs">
                          {item.isBundle ? <Layers size={16} className="text-amber-500" /> : <SheepIcon size={14} className="text-slate-300" />}
                          {item.bookTitle} <span className="bg-slate-200 px-2 rounded-lg text-[9px] text-slate-500 not-italic">QT: {item.quantity}</span>
                        </span>
                        <span className="text-slate-900 text-sm font-black">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-10 space-y-3 border-t border-slate-200 pt-6">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase italic"><span>Logística ({selectedOrder.shippingType})</span><span>R$ {selectedOrder.shippingCost.toFixed(2)}</span></div>
                    {selectedOrder.discount > 0 && <div className="flex justify-between text-xs font-black text-red-600 uppercase italic"><span>Bonificação Aplicada</span><span>- R$ {selectedOrder.discount.toFixed(2)}</span></div>}
                  </div>

                  <div className="flex justify-between mt-8 pt-8 border-t-[6px] border-slate-900 font-black text-5xl italic tracking-tighter text-blue-600">
                    <span>LIQUIDAÇÃO</span>
                    <span>R$ {selectedOrder.totalValue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-6 pt-6 no-print">
                   <button onClick={() => window.print()} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase italic flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all text-sm tracking-widest"><Printer size={20} /> Imprimir Fatura</button>
                   {isAdmin && (
                     <button onClick={() => printLabel(selectedOrder)} className="flex-1 py-5 bg-amber-500 text-white rounded-2xl font-black uppercase italic flex items-center justify-center gap-3 shadow-2xl hover:bg-amber-400 transition-all text-sm tracking-widest"><Tag size={20} /> Imprimir Etiqueta</button>
                   )}
                   {isAdmin && selectedOrder.status === OrderStatus.PENDING_PAYMENT && (
                     <button onClick={() => setIsEditingDiscount(true)} className="px-10 py-5 bg-blue-100 text-blue-700 rounded-2xl font-black uppercase italic hover:bg-blue-200 transition-all text-sm tracking-widest">Ajustar Desconto</button>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Etiqueta de Envio Minimalista para Impressão */}
      {labelToPrint && (
        <div className="print-only bg-white p-10 min-h-screen flex flex-col items-center">
          <div className="border-[12px] border-slate-900 p-14 rounded-none max-w-4xl w-full text-center font-mono space-y-16 relative">
            <div className="absolute top-6 left-6 flex items-center gap-4">
               <div className="bg-slate-900 p-1.5 rounded-xl">
                  <SheepIcon size={32} className="text-white" />
               </div>
               <div className="font-black italic text-3xl tracking-tighter uppercase">Manus Libros</div>
            </div>
            <div className="absolute top-6 right-6 font-black italic uppercase text-xl bg-slate-900 text-white px-6 py-2">{labelToPrint.shippingType}</div>
            
            <h1 className="text-7xl font-black uppercase italic tracking-tighter border-b-[10px] border-slate-900 pb-12 pt-24 leading-none">DESTINATÁRIO</h1>
            
            <div className="space-y-16 py-12">
              <div className="flex flex-col items-center gap-4">
                <p className="text-2xl uppercase font-black text-slate-400 tracking-[0.6em]">Nome Completo</p>
                <h2 className="text-8xl font-black uppercase italic leading-none tracking-tight">{labelToPrint.customer.name}</h2>
              </div>
              
              <div className="space-y-8">
                <p className="text-2xl font-black uppercase text-slate-400 tracking-[0.6em]">Endereço Completo</p>
                <p className="text-5xl font-black uppercase italic tracking-tight leading-tight max-w-5xl mx-auto">{labelToPrint.customer.address}</p>
                
                <div className="inline-block bg-slate-900 text-white px-20 py-10 mt-10 shadow-2xl">
                  <p className="text-8xl font-black tracking-[0.2em]">CEP: {labelToPrint.customer.zip}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-20 border-t-[8px] border-slate-900 grid grid-cols-2 text-left gap-20">
               <div className="space-y-3">
                 <p className="text-sm font-black uppercase text-slate-400 italic tracking-[0.2em]">Contato Entrega</p>
                 <div className="flex items-center gap-5">
                   <Phone size={40} className="text-slate-900" />
                   <p className="text-4xl font-black italic">{labelToPrint.customer.phone}</p>
                 </div>
               </div>
               <div className="text-right flex flex-col items-end space-y-3">
                 <p className="text-sm font-black uppercase text-slate-400 italic tracking-[0.2em]">Expedido por</p>
                 <p className="text-3xl font-black italic uppercase">Manus Libros Logistics</p>
                 <p className="text-[12px] font-black uppercase text-slate-400 italic mt-3 border-2 border-slate-900 px-4 py-1">#ID: {labelToPrint.id.slice(0,12).toUpperCase()}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
