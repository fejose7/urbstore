
import React, { useState, useMemo } from 'react';
import { Book, Seller, Order, OrderStatus, Customer, UserAccount, UserRole } from '../types';
import { ShoppingCart, UserPlus, Package, Trash2, PlusCircle, Wallet, Truck, CheckCircle, Copy, ArrowRight, Layers, MapPin, RefreshCw, Clock } from 'lucide-react';

interface Props {
  books: Book[];
  sellers: Seller[];
  user: UserAccount;
  onOrderCreated: (order: Order) => void;
}

const NewOrder: React.FC<Props> = ({ books, sellers, user, onOrderCreated }) => {
  const [customer, setCustomer] = useState<Customer>({ name: '', address: '', zip: '', phone: '', email: '' });
  const [selectedSellerId, setSelectedSellerId] = useState(user.role === UserRole.SELLER ? user.id : '');
  const [cart, setCart] = useState<{ bookId: string, quantity: number }[]>([]);
  const [discountInput, setDiscountInput] = useState('0');
  
  const [shippingOptions, setShippingOptions] = useState<{ type: 'Simples' | 'SEDEX', cost: number, days: number }[]>([]);
  const [selectedShippingType, setSelectedShippingType] = useState<'Simples' | 'SEDEX' | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [showBankPopup, setShowBankPopup] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const cartDetails = useMemo(() => {
    return cart.map(item => {
      const book = books.find(b => b.id === item.bookId);
      if (!book) return null;
      return {
        ...item,
        title: book.title,
        price: book.salePrice,
        cost: book.costPrice,
        total: book.salePrice * item.quantity,
        stock: book.stock,
        isBundle: book.isBundle
      };
    }).filter(Boolean) as any[];
  }, [cart, books]);

  const subtotal = cartDetails.reduce((acc, item) => acc + item.total, 0);
  const totalCost = cartDetails.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
  const discount = parseFloat(discountInput) || 0;
  
  const currentShippingCost = useMemo(() => {
    if (!selectedShippingType) return 0;
    return shippingOptions.find(o => o.type === selectedShippingType)?.cost || 0;
  }, [selectedShippingType, shippingOptions]);

  const finalValue = Math.max(0, subtotal + currentShippingCost - discount);
  const totalProfit = (subtotal - discount) - totalCost;

  const handleCalculateShipping = () => {
    const cleanZip = customer.zip.replace(/\D/g, '');
    if (cleanZip.length < 8) return setErrors({ ...errors, customerZip: true });
    
    setErrors({ ...errors, customerZip: false });
    setIsCalculatingShipping(true);
    
    setTimeout(() => {
      const region = parseInt(cleanZip.charAt(0));
      let basePAC = 18.00;
      let baseSEDEX = 32.00;
      let daysPAC = 6;
      let daysSEDEX = 2;

      if (region >= 4 && region <= 9) { // N, NE, CO
        basePAC += 14.00;
        baseSEDEX += 28.00;
        daysPAC += 4;
        daysSEDEX += 2;
      } else if (region <= 1) { // SP
        basePAC -= 6.00;
        baseSEDEX -= 12.00;
        daysPAC = 2;
        daysSEDEX = 1;
      }

      setShippingOptions([
        { type: 'Simples', cost: basePAC, days: daysPAC },
        { type: 'SEDEX', cost: baseSEDEX, days: daysSEDEX }
      ]);
      setSelectedShippingType('Simples');
      setIsCalculatingShipping(false);
    }, 1000);
  };

  const handleAddToCart = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book || (!book.isBundle && book.stock <= 0)) return alert("Obra indisponível no estoque.");
    
    const existing = cart.find(c => c.bookId === bookId);
    if (existing) {
      setCart(cart.map(c => c.bookId === bookId ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { bookId, quantity: 1 }]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!customer.name) newErrors.customerName = true;
    if (!customer.zip) newErrors.customerZip = true;
    if (cart.length === 0) newErrors.cart = true;
    if (!selectedShippingType) newErrors.shipping = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const seller = sellers.find(s => s.id === selectedSellerId);
    const order: Order = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customer,
      items: cartDetails,
      discount,
      shippingCost: currentShippingCost,
      shippingType: selectedShippingType!,
      status: OrderStatus.PENDING_PAYMENT,
      sellerId: selectedSellerId || null,
      totalValue: finalValue,
      totalCost,
      totalProfit,
      sellerCommission: seller ? Math.max(0, totalProfit * (seller.commissionRate / 100)) : 0
    };
    setLastCreatedOrder(order);
    setShowBankPopup(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><UserPlus size={24} /></div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Destinatário</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2 space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
               <input className={`w-full p-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold italic transition-all ${errors.customerName ? 'border-red-500' : 'border-slate-100'}`} placeholder="Ex: Felipe Silva" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
             </div>
             <div className="md:col-span-2 space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço (Rua, Nº, Bairro, Cidade-UF)</label>
               <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold italic" placeholder="Logradouro completo..." value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
               <div className="flex gap-2">
                 <input className={`flex-1 p-4 bg-slate-50 border rounded-2xl font-black italic outline-none transition-all ${errors.customerZip ? 'border-red-500' : 'border-slate-100'}`} placeholder="00000-000" value={customer.zip} onChange={e => setCustomer({...customer, zip: e.target.value})} />
                 <button onClick={handleCalculateShipping} className="bg-slate-900 text-white px-6 rounded-2xl hover:bg-slate-800 transition-all shadow-xl">
                   {isCalculatingShipping ? <RefreshCw size={20} className="animate-spin" /> : <MapPin size={20} />}
                 </button>
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
               <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold italic outline-none" placeholder="(00) 00000-0000" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
             </div>
          </div>
          
          {shippingOptions.length > 0 && (
            <div className="mt-8 p-6 bg-blue-50/50 rounded-[2rem] border-2 border-blue-100 border-dashed animate-in zoom-in duration-300">
               <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 italic flex items-center gap-2">
                 <Truck size={14} /> Opções de Envio EP
               </p>
               <div className="grid grid-cols-2 gap-4">
                 {shippingOptions.map(opt => (
                   <button key={opt.type} onClick={() => setSelectedShippingType(opt.type)} className={`p-6 rounded-[1.5rem] border-2 transition-all text-left relative overflow-hidden bg-white ${selectedShippingType === opt.type ? 'border-blue-600 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                     <span className="font-black italic uppercase text-[10px] text-slate-400 block mb-1">{opt.type}</span>
                     <p className="text-2xl font-black text-blue-600 italic tracking-tighter leading-none">R$ {opt.cost.toFixed(2)}</p>
                     <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase flex items-center gap-1 italic"><Clock size={10}/> {opt.days} dias aprox.</p>
                   </button>
                 ))}
               </div>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-5">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Package size={24} /></div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Acervo Evangelho Prático</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.filter(b => b.stock > 0 || b.isBundle).map(book => (
              <button key={book.id} onClick={() => handleAddToCart(book.id)} className="flex items-center justify-between p-5 border border-slate-100 rounded-[1.5rem] hover:border-blue-500 hover:bg-blue-50/20 transition-all text-left group">
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-xl transition-all ${book.isBundle ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                    {book.isBundle ? <Layers size={20} /> : <PlusCircle size={20} />}
                   </div>
                   <div>
                    <p className="font-black text-slate-900 uppercase italic leading-none truncate max-w-[150px]">{book.title}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1 italic tracking-widest">R$ {book.salePrice.toFixed(2)}</p>
                   </div>
                </div>
                {!book.isBundle && <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded-lg italic">{book.stock} un</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`bg-slate-900 p-8 rounded-[3rem] shadow-2xl border-4 sticky top-24 transition-all ${errors.cart ? 'border-red-500' : 'border-slate-800'}`}>
          <h2 className="text-2xl font-black italic tracking-tighter mb-8 border-b border-slate-800 pb-5 uppercase text-white flex justify-between items-center leading-none">
            Checkout <ShoppingCart size={24} className="text-blue-500" />
          </h2>
          
          <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-3 custom-scrollbar">
            {cartDetails.map(item => (
              <div key={item.bookId} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-black text-[10px] text-white uppercase italic truncate max-w-[140px] leading-none mb-1">{item.title}</p>
                  <p className="text-[9px] font-bold text-blue-400 uppercase italic">R$ {item.price.toFixed(2)} x {item.quantity}</p>
                </div>
                <button onClick={() => setCart(cart.filter(c => c.bookId !== item.bookId))} className="text-slate-500 hover:text-red-400 transition-colors ml-4"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest italic"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
            <div className={`flex justify-between text-[10px] font-black uppercase tracking-widest italic ${errors.shipping ? 'text-red-400' : 'text-blue-500'}`}>
              <span>Envio</span>
              <span>{currentShippingCost > 0 ? `R$ ${currentShippingCost.toFixed(2)}` : 'S/ Frete'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-black uppercase text-red-500 italic tracking-widest">Desconto Urb</span>
              <input type="number" className="w-24 p-2 bg-slate-800 border border-slate-700 rounded-xl text-right font-black text-white outline-none focus:ring-1 focus:ring-red-500" value={discountInput} onChange={e => setDiscountInput(e.target.value)} />
            </div>
            <div className="flex justify-between pt-8 border-t-4 border-slate-800 font-black text-4xl italic tracking-tighter text-white leading-none">
              <span className="text-xs uppercase tracking-widest mt-3 text-slate-500">Total Venda</span>
              <span className="text-blue-500">R$ {finalValue.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <button onClick={handleSubmit} className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black italic tracking-tighter hover:bg-blue-500 transition-all uppercase shadow-2xl flex items-center justify-center gap-3 text-lg group active:scale-95">
              Confirmar Venda <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {showBankPopup && (
        <div className="fixed inset-0 z-[300] bg-slate-900/98 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border-4 border-slate-900 animate-in zoom-in duration-300">
             <div className="bg-slate-900 p-10 text-white text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20"><Wallet size={40} /></div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Aguardando PIX</h3>
              <p className="text-blue-400 font-black text-2xl italic tracking-tighter mt-4 leading-none">R$ {finalValue.toFixed(2)}</p>
            </div>
            <div className="p-10 space-y-6 text-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Chave PIX de Recebimento</p>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-black text-sm text-slate-800 break-all">pix@evangelhopratico.com.br</div>
               <button onClick={() => { onOrderCreated(lastCreatedOrder!); setShowBankPopup(false); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase italic tracking-tighter text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95">Venda Lançada</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrder;
