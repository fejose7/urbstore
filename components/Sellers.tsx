import React, { useState } from 'react';
import { Seller, UserRole } from '../types';
import { Plus, User, Mail, Phone, Wallet, Save, X, Edit2, Trash2, Key, Camera, UserX, Users } from 'lucide-react';

interface Props {
  sellers: Seller[];
  setSellers: React.Dispatch<React.SetStateAction<Seller[]>>;
}

const Sellers: React.FC<Props> = ({ sellers, setSellers }) => {
  const [modalState, setModalState] = useState<{ type: 'ADD' | 'EDIT' | null, seller: Partial<Seller> | null }>({ type: null, seller: null });

  const handleOpenAdd = () => setModalState({ type: 'ADD', seller: { commissionRate: 15, role: UserRole.SELLER } });
  const handleOpenEdit = (s: Seller) => setModalState({ type: 'EDIT', seller: {...s} });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = modalState.seller as Seller;
    if (modalState.type === 'ADD') {
      const newSeller: Seller = {
        ...s,
        id: crypto.randomUUID(),
        commissionRate: Number(s.commissionRate),
        role: UserRole.SELLER
      };
      setSellers([newSeller, ...sellers]);
    } else {
      setSellers(prev => prev.map(item => item.id === s.id ? { ...s, commissionRate: Number(s.commissionRate) } : item));
    }
    setModalState({ type: null, seller: null });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setModalState({...modalState, seller: {...modalState.seller!, avatar: reader.result as string}});
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir este vendedor? Todas as estatísticas associadas serão mantidas no histórico de pedidos, mas o acesso do vendedor será revogado.")) {
      setSellers(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Equipe Comercial</h2>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center space-x-3 bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 shadow-xl transition-all font-black uppercase italic tracking-tighter text-sm"
        >
          <Plus size={18} />
          <span>Novo Vendedor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sellers.map(seller => (
          <div key={seller.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group relative transition-all hover:shadow-xl hover:border-blue-100">
            <div className="flex justify-between items-start mb-6">
              {seller.avatar ? (
                <img src={seller.avatar} className="w-20 h-20 rounded-3xl object-cover shadow-lg border-2 border-white" alt="Avatar" />
              ) : (
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center font-black text-2xl border border-blue-100">
                  {seller.name.charAt(0)}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleOpenEdit(seller)} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(seller.id)} className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm"><UserX size={18} /></button>
              </div>
            </div>
            
            <h3 className="font-black text-xl mb-4 truncate text-slate-900 uppercase italic tracking-tighter">{seller.name}</h3>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase italic"><Mail size={14} className="text-blue-500" /> {seller.email}</div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase italic"><Phone size={14} className="text-blue-500" /> {seller.phone || 'Sem Telefone'}</div>
              <div className="flex items-center gap-3 text-xs font-bold text-blue-600 uppercase italic bg-blue-50 px-3 py-2 rounded-xl border border-blue-100"><Key size={14} /> ID: {seller.username}</div>
            </div>
            
            <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Taxa de Comissão</span>
                <span className="text-lg font-black text-slate-900 italic tracking-tighter">{seller.commissionRate}%</span>
              </div>
              <div className="bg-slate-900 text-white p-2 rounded-xl">
                 <Wallet size={18} />
              </div>
            </div>
          </div>
        ))}
        {sellers.length === 0 && (
          <div className="col-span-full py-20 bg-slate-100 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            {/* Fix: Import Users from lucide-react */}
            <Users size={48} className="mb-4 opacity-20" />
            <p className="font-black uppercase italic tracking-[0.4em] text-xs">Nenhum vendedor registrado</p>
          </div>
        )}
      </div>

      {modalState.type && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in duration-300">
            <div className="bg-slate-700 p-8 flex justify-between items-center border-b border-slate-600">
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter flex items-center gap-4 italic leading-none">
                {modalState.type === 'ADD' ? <Plus size={32} className="text-blue-400" /> : <Edit2 size={32} className="text-blue-400" />}
                {modalState.type === 'ADD' ? 'Credencial Cloud' : 'Gestão de Vendedor'}
              </h3>
              <button onClick={() => setModalState({ type: null, seller: null })} className="text-slate-400 hover:text-white transition-colors">
                <X size={32} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo Comercial</label>
                  <input required className="w-full p-5 bg-slate-700 text-white border border-slate-600 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase italic shadow-inner" value={modalState.seller?.name || ''} onChange={e => setModalState({...modalState, seller: {...modalState.seller!, name: e.target.value}})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Percentual de Comissão (%)</label>
                  <input required type="number" className="w-full p-5 bg-slate-700 text-white border border-slate-600 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 font-black italic shadow-inner text-xl text-blue-400" value={modalState.seller?.commissionRate || ''} onChange={e => setModalState({...modalState, seller: {...modalState.seller!, commissionRate: Number(e.target.value)}})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail para Notificações</label>
                  <input required type="email" className="w-full p-5 bg-slate-700 text-white border border-slate-600 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={modalState.seller?.email || ''} onChange={e => setModalState({...modalState, seller: {...modalState.seller!, email: e.target.value}})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Contato</label>
                  <input className="w-full p-5 bg-slate-700 text-white border border-slate-600 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={modalState.seller?.phone || ''} onChange={e => setModalState({...modalState, seller: {...modalState.seller!, phone: e.target.value}})} />
                </div>
              </div>

              <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-700/50 space-y-6">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] italic mb-4">Credenciais de Acesso ao Sistema</p>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase italic">ID de Usuário</label>
                      <input required className="w-full p-4 bg-slate-800 text-white border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black tracking-widest" value={modalState.seller?.username || ''} onChange={e => setModalState({...modalState, seller: {...modalState.seller!, username: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase italic">Chave de Acesso</label>
                      <input required className="w-full p-4 bg-slate-800 text-white border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black tracking-widest" value={modalState.seller?.password || ''} onChange={e => setModalState({...modalState, seller: {...modalState.seller!, password: e.target.value}})} />
                    </div>
                 </div>
              </div>

              <div className="flex justify-end gap-6 pt-8 border-t border-slate-700">
                <button type="button" onClick={() => setModalState({ type: null, seller: null })} className="px-8 py-5 text-slate-500 font-black hover:text-white uppercase tracking-widest text-xs transition-colors">Cancelar</button>
                <button type="submit" className="px-12 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase italic tracking-tighter shadow-2xl hover:bg-blue-500 transition-all text-lg">Confirmar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sellers;