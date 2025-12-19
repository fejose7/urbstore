
import React, { useState, useMemo } from 'react';
import { Book } from '../types';
import { Plus, Search, Edit2, Trash2, X, BookText, Package, Layers, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}

const Inventory: React.FC<Props> = ({ books, setBooks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState<{ type: 'ADD' | 'EDIT' | null, book: Partial<Book> | null }>({ type: null, book: null });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenAdd = () => {
    setModalState({ type: 'ADD', book: { isBundle: false, bundleItems: [], stock: 0 } });
    setErrors({});
  };
  
  const handleOpenEdit = (b: Book) => {
    setModalState({ type: 'EDIT', book: { ...b } });
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    const b = modalState.book!;
    if (!b.title) newErrors.title = true;
    if (b.costPrice === undefined || b.costPrice < 0) newErrors.costPrice = true;
    if (b.salePrice === undefined || b.salePrice < 0) newErrors.salePrice = true;
    
    if (b.isBundle) {
      if (!b.bundleItems || b.bundleItems.length === 0) newErrors.bundleItems = true;
    } else {
      if (b.stock === undefined || b.stock < 0) newErrors.stock = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const b = modalState.book as Book;
    if (modalState.type === 'ADD') {
      const newBook: Book = {
        ...b,
        id: crypto.randomUUID(),
        costPrice: Number(b.costPrice),
        salePrice: Number(b.salePrice),
        stock: b.isBundle ? 0 : Number(b.stock)
      };
      setBooks([newBook, ...books]);
    } else {
      setBooks(prev => prev.map(item => item.id === b.id ? { 
        ...b, 
        costPrice: Number(b.costPrice), 
        salePrice: Number(b.salePrice), 
        stock: b.isBundle ? 0 : Number(b.stock) 
      } : item));
    }
    setModalState({ type: null, book: null });
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja remover este item permanentemente do acervo?")) {
      setBooks(prev => prev.filter(b => b.id !== id));
    }
  };

  const availableBooksForBundle = useMemo(() => books.filter(b => !b.isBundle), [books]);

  const toggleBundleItem = (id: string) => {
    const current = modalState.book?.bundleItems || [];
    if (current.includes(id)) {
      setModalState({ ...modalState, book: { ...modalState.book!, bundleItems: current.filter(i => i !== id) } });
    } else {
      if (current.length >= 3) return alert("Um Box Especial pode ter no máximo 3 títulos.");
      setModalState({ ...modalState, book: { ...modalState.book!, bundleItems: [...current, id] } });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar títulos ou boxes..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 shadow-xl font-black uppercase italic tracking-tighter transition-all"
        >
          <Plus size={18} />
          <span>Cadastrar Título</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <th className="p-6">Tipo</th>
              <th className="p-6">Título Comercial</th>
              <th className="p-6">Preços</th>
              <th className="p-6">Estoque</th>
              <th className="p-6 text-right">Controle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBooks.map(book => (
              <tr key={book.id} className="hover:bg-slate-50 transition-all group">
                <td className="p-6">
                  {book.isBundle ? (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 w-fit"><Layers size={10} /> BOX</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 w-fit"><BookText size={10} /> LIVRO</span>
                  )}
                </td>
                <td className="p-6">
                  <p className="font-black text-slate-900 uppercase italic leading-none">{book.title}</p>
                  {book.isBundle && (
                    <p className="text-[9px] text-slate-400 font-bold uppercase italic mt-1 tracking-widest">{book.bundleItems?.length} livros vinculados</p>
                  )}
                </td>
                <td className="p-6">
                  <p className="text-blue-600 font-black italic text-lg tracking-tighter leading-none">R$ {book.salePrice.toFixed(2)}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">Custo: R$ {book.costPrice.toFixed(2)}</p>
                </td>
                <td className="p-6">
                  {book.isBundle ? (
                    <div className="flex items-center gap-2 text-slate-400 italic">
                      <Layers size={14} className="text-amber-500/50" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Dependente</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       <span className={`text-2xl font-black italic ${book.stock < 10 ? 'text-red-500' : 'text-slate-900'}`}>{book.stock}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase italic">UN</span>
                    </div>
                  )}
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(book)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(book.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalState.type && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-md">
          <div className="bg-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-700 my-8">
            <div className="bg-slate-700 p-8 flex justify-between items-center">
              <h3 className="text-white font-black text-xl uppercase tracking-widest flex items-center gap-3 italic">
                {modalState.book?.isBundle ? <Layers size={24} className="text-amber-500" /> : <BookText size={24} className="text-blue-500" />}
                {modalState.type === 'ADD' ? 'Novo Título' : 'Editar Título'}
              </h3>
              <button onClick={() => setModalState({ type: null, book: null })} className="text-slate-400 hover:text-white">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="flex gap-4 p-1.5 bg-slate-900 rounded-[1.25rem] border border-slate-700">
                 <button type="button" onClick={() => setModalState({...modalState, book: {...modalState.book!, isBundle: false}})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!modalState.book?.isBundle ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Livro Único</button>
                 <button type="button" onClick={() => setModalState({...modalState, book: {...modalState.book!, isBundle: true}})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalState.book?.isBundle ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>Box Especial</button>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.title ? 'text-red-400' : 'text-slate-400'}`}>Título Comercial *</label>
                <input className={`w-full p-4 bg-slate-700 text-white border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold ${errors.title ? 'border-red-500 ring-2' : 'border-slate-600'}`} value={modalState.book?.title || ''} onChange={e => setModalState({...modalState, book: {...modalState.book!, title: e.target.value}})} />
              </div>

              {modalState.book?.isBundle && (
                <div className="space-y-4">
                   <div className="flex items-center justify-between ml-1">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${errors.bundleItems ? 'text-red-400' : 'text-slate-400'}`}>Composição (Máx 3) *</label>
                    <span className="text-[9px] font-bold text-slate-500">{modalState.book?.bundleItems?.length || 0}/3</span>
                   </div>
                   <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-3 custom-scrollbar p-1.5 bg-slate-900 rounded-2xl border border-slate-700">
                      {availableBooksForBundle.length > 0 ? availableBooksForBundle.map(b => (
                        <button key={b.id} type="button" onClick={() => toggleBundleItem(b.id)} className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${modalState.book?.bundleItems?.includes(b.id) ? 'bg-amber-600/10 border-amber-500 text-amber-100' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                           <span className="text-xs font-bold uppercase italic">{b.title}</span>
                           {modalState.book?.bundleItems?.includes(b.id) ? <CheckCircle className="text-amber-500" size={16} /> : <Plus size={16} />}
                        </button>
                      )) : <p className="text-center text-[10px] py-10 text-slate-600 font-black uppercase italic">Sem livros cadastrados</p>}
                   </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.costPrice ? 'text-red-400' : 'text-slate-400'}`}>Custo (R$) *</label>
                  <input type="number" step="0.01" className={`w-full p-4 bg-slate-700 text-white border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black italic ${errors.costPrice ? 'border-red-500 ring-2' : 'border-slate-600'}`} value={modalState.book?.costPrice || ''} onChange={e => setModalState({...modalState, book: {...modalState.book!, costPrice: e.target.value}})} />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.salePrice ? 'text-red-400' : 'text-slate-400'}`}>Venda (R$) *</label>
                  <input type="number" step="0.01" className={`w-full p-4 bg-slate-700 text-white border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black italic ${errors.salePrice ? 'border-red-500 ring-2' : 'border-slate-600'}`} value={modalState.book?.salePrice || ''} onChange={e => setModalState({...modalState, book: {...modalState.book!, salePrice: e.target.value}})} />
                </div>
              </div>

              {!modalState.book?.isBundle ? (
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.stock ? 'text-red-400' : 'text-slate-400'}`}>Estoque Inicial *</label>
                  <input type="number" className={`w-full p-4 bg-slate-700 text-white border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black ${errors.stock ? 'border-red-500 ring-2' : 'border-slate-600'}`} value={modalState.book?.stock || ''} onChange={e => setModalState({...modalState, book: {...modalState.book!, stock: e.target.value}})} />
                </div>
              ) : (
                <div className="bg-amber-600/10 border border-amber-500/30 p-5 rounded-[1.5rem] flex items-center gap-4 text-amber-200">
                   <AlertCircle size={24} className="shrink-0 text-amber-500" />
                   <p className="text-[10px] font-bold uppercase italic leading-tight">O estoque do Box é dependente dos itens individuais que o compõem. O número não é editável diretamente.</p>
                </div>
              )}

              <div className="flex justify-end gap-5 pt-6 border-t border-slate-700">
                <button type="button" onClick={() => setModalState({ type: null, book: null })} className="px-6 py-4 text-slate-400 font-black hover:text-white uppercase tracking-widest text-xs transition-colors">Cancelar</button>
                <button type="submit" className="px-14 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-2xl hover:bg-blue-500 transition-all">Salvar Livro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
