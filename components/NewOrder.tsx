
import React, { useState, useMemo } from 'react';
import { Book, Seller, Order, OrderStatus, Customer, UserAccount, UserRole } from '../types';
import { ShoppingCart, UserPlus, Package, Trash2, PlusCircle, Wallet, Truck, CheckCircle, Copy, ArrowRight, Layers } from 'lucide-react';

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
  
  const [shippingOptions, setShippingOptions] = useState<{ type: 'Simples' | 'SEDEX', cost: number }[]>([]);
  const [selectedShippingType, setSelectedShippingType] = useState<'Simples' | 'SEDEX' | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [showBankPopup, setShowBankPopup] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const isAdmin = user.role === UserRole.ADMIN;

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

  const currentSeller = useMemo(() => sellers.find(s => s.id === selectedSellerId), [selectedSellerId, sellers]);
  const estimatedCommission = useMemo(() => {
    if (!currentSeller) return 0;
    return Math.max(0, totalProfit * (currentSeller.commissionRate / 100));
  }, [totalProfit, currentSeller]);

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!customer.name) newErrors.customerName = true;
    if (!customer.address) newErrors.customerAddress = true;
    if (!customer.zip) newErrors.customerZip = true;
    if (!customer.phone) newErrors.customerPhone = true;
    if (cart.length === 0) newErrors.cart = true;
    if (!selectedShippingType) newErrors.shipping = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculateShipping = () => {
    if (!customer.zip || customer.zip.length < 8) {
      setErrors({ ...errors, customerZip: true });
      return;
    }
    setErrors({ ...errors, customerZip: false });
    setIsCalculatingShipping(true);
    setTimeout(() => {
      const baseDist = parseInt(customer.zip.substring(0, 2)) % 5;
      const simpleCost = 15.00 + (baseDist * 4);
      const sedexCost = 35.00 + (baseDist * 10);
      setShippingOptions([{ type: 'Simples', cost: simpleCost }, { type: 'SEDEX', cost: sedexCost }]);
      setSelectedShippingType('Simples');
      setIsCalculatingShipping(false);
    }, 1000);
  };

  const handleAddToCart = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    if (!book.isBundle && book.stock <= 0) return alert("Produto sem estoque.");
    
    const existing = cart.find(c => c.bookId === bookId);
    if (existing) {
      if (!book.isBundle && existing.quantity >= book.stock) return alert("Quantidade máxima em estoque atingida.");
      setCart(cart.map(c => c.bookId === bookId ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { bookId, quantity: 1 }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const order: Order = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customer,
      items: cartDetails.map(item => ({
        bookId: item.bookId,
        bookTitle: item.title,
        quantity: item.quantity,
        unitPrice: item.price,
        unitCost: item.cost,
        isBundle: item.isBundle
      })),
      discount,
      shippingCost: currentShippingCost,
      shippingType: selectedShippingType!,
      status: OrderStatus.PENDING_PAYMENT,
      sellerId: selectedSellerId || null,
      totalValue: finalValue,
      totalCost,
      totalProfit,
      sellerCommission: selectedSellerId ? estimatedCommission : 0
    };

    setLastCreatedOrder(order);
    setShowBankPopup(true);
  };

  const handleFinish = () => {
    if (lastCreatedOrder) {
      onOrderCreated(lastCreatedOrder);
      setShowBankPopup(false);
    }
  };

  const PIX_KEY = "00020101021126360014br.gov.bcb.pix0114+55119957650085204000053039865802BR5911FELIPE JOSE6009SAO PAULO62070503***630416BB";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-6 border-b pb-4">
            <UserPlus className="text-blue-500" size={24} />
            <h2 className="text-xl font-black italic tracking-tighter uppercase">Dados do Cliente</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo *</label>
               <input className={`w-full p-3 bg-slate-50 border rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-bold ${errors.customerName ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`} value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
             </div>
             <div className="md:col-span-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Endereço de Entrega *</label>
               <input className={`w-full p-3 bg-slate-50 border rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none font-bold ${errors.customerAddress ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`} value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CEP *</label>
               <div className="flex gap-2">
                 <input className={`flex-1 p-3 bg-slate-50 border rounded-xl mt-1 font-bold ${errors.customerZip ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`} value={customer.zip} onChange={e => setCustomer({...customer, zip: e.target.value})} />
                 <button type="button" onClick={handleCalculateShipping} className="mt-1 bg-slate-900 text-white px-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center min-w-[50px]">
                   {isCalculatingShipping ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Truck size={18} />}
                 </button>
               </div>
             </div>
             <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telefone *</label><input className={`w-full p-3 bg-slate-50 border rounded-xl mt-1 font-bold ${errors.customerPhone ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`} value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} /></div>
          </div>
          
          {shippingOptions.length > 0 && (
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border-2 border-blue-100">
               <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">Modal de Entrega</p>
               <div className="grid grid-cols-2 gap-4">
                 {shippingOptions.map(option => (
                   <button key={option.type} type="button" onClick={() => setSelectedShippingType(option.type)} className={`p-4 rounded-xl border-2 transition-all text-left ${selectedShippingType === option.type ? 'border-blue-600 bg-white shadow-lg' : 'border-slate-200 bg-white/50 grayscale opacity-60'}`}>
                     <span className="font-black italic uppercase text-xs tracking-widest text-slate-900">{option.type}</span>
                     <p className="text-xl font-black text-blue-600 italic tracking-tighter">R$ {option.cost.toFixed(2)}</p>
                   </button>
                 ))}
               </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-6 border-b pb-4">
            <Package className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-slate-900 uppercase italic tracking-tighter">Catálogo urb_store</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.filter(b => b.stock > 0 || b.isBundle).map(book => (
              <button key={book.id} onClick={() => handleAddToCart(book.id)} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group">
                <div className="flex items-center gap-3">
                   {book.isBundle ? <Layers className="text-amber-500" size={18} /> : <PlusCircle className="text-slate-300 group-hover:text-blue-500" size={18} />}
                   <div>
                    <p className="font-bold text-slate-900 group-hover:text-blue-700 uppercase italic">{book.title}</p>
                    <p className="text-xs text-slate-500 font-bold">R$ {book.salePrice.toFixed(2)} {book.isBundle && '| BOX ESPECIAL'}</p>
                   </div>
                </div>
                <div className="text-xs font-black text-slate-400">{book.isBundle ? 'BOX' : `${book.stock}un`}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`bg-slate-900 p-8 rounded-3xl shadow-2xl border sticky top-24 transition-all ${errors.cart ? 'border-red-500 shadow-red-900/20' : 'border-slate-800'}`}>
          <h2 className="text-2xl font-black italic tracking-tighter mb-8 border-b border-slate-700 pb-4 uppercase text-white flex justify-between items-center">urb_store</h2>
          
          <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {cartDetails.map(item => (
              <div key={item.bookId} className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {item.isBundle && <Layers size={10} className="text-amber-400" />}
                    <p className="font-bold text-xs text-slate-100 truncate max-w-[140px] uppercase italic">{item.title}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-3">
                     <button onClick={() => setCart(cart.map(c => c.bookId === item.bookId ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))} className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center font-black">-</button>
                     <span className="text-sm font-black text-slate-100">{item.quantity}</span>
                     <button onClick={() => handleAddToCart(item.bookId)} className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center font-black">+</button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-blue-400">R$ {item.total.toFixed(2)}</p>
                  <button onClick={() => setCart(cart.filter(c => c.bookId !== item.bookId))} className="text-red-400 hover:text-red-300 mt-2"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-700 text-slate-300">
            <div className="flex justify-between text-xs font-bold uppercase"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
            <div className={`flex justify-between text-xs font-bold uppercase ${errors.shipping ? 'text-red-400' : 'text-blue-400'}`}>
              <span>Frete</span>
              <span>{currentShippingCost > 0 ? `R$ ${currentShippingCost.toFixed(2)}` : 'Não calculado'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase text-red-400">Desconto (R$)</span>
              <input type="number" className="w-24 p-2 bg-slate-800 border border-slate-700 rounded-xl text-right font-black text-white" value={discountInput} onChange={e => setDiscountInput(e.target.value)} />
            </div>
            <div className="flex justify-between pt-6 border-t-2 border-slate-100 font-black text-3xl italic tracking-tighter text-white">
              <span>TOTAL</span>
              <span className="text-blue-400">R$ {finalValue.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {(isAdmin || user.role === UserRole.SELLER) && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vendedor</label>
                <select className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold outline-none" value={selectedSellerId} onChange={e => setSelectedSellerId(e.target.value)}>
                  {user.role === UserRole.SELLER ? <option value={user.id}>{user.name}</option> : (
                    <>
                      <option value="">Venda Direta (Sem Vendedor)</option>
                      {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </>
                  )}
                </select>
              </div>
            )}
            <button onClick={handleSubmit} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black italic tracking-tighter hover:bg-blue-500 transition-all uppercase shadow-2xl flex items-center justify-center gap-2">
              Gerar Pedido <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {showBankPopup && (
        <div className="fixed inset-0 z-[300] bg-slate-900/98 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border-4 border-slate-900">
             {/* Pop-up de pagamento PIX já implementado */}
             <div className="bg-slate-900 p-8 text-white text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3"><Wallet size={40} /></div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Check-out PIX</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200/50 space-y-4">
                 <p className="font-black text-slate-800 text-center uppercase italic">Chave PIX (Copia e Cola)</p>
                 <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                    <p className="text-[9px] font-mono text-slate-500 break-all line-clamp-2 flex-1">{PIX_KEY}</p>
                    <button onClick={() => { navigator.clipboard.writeText(PIX_KEY); alert("Copiado!"); }} className="p-3 bg-slate-900 text-white rounded-xl"><Copy size={16} /></button>
                 </div>
              </div>
              <button onClick={handleFinish} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase italic tracking-tighter">Concluir Lançamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrder;
