
import React, { useState } from 'react';
import { db } from '../db';
import { UserAccount } from '../types';
import { Lock, User as UserIcon, Star } from 'lucide-react';

interface Props {
  onLogin: (user: UserAccount) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = await db.getUsers();
    const sellers = await db.getSellers();
    const allAccounts = [...users, ...sellers];
    const found = allAccounts.find(u => u.username === username && u.password === password);

    if (found) {
      onLogin(found);
    } else {
      setError('Credenciais incorretas.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-12 text-center text-white relative">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-blue-500">
               <Star size={56} className="text-slate-900 fill-slate-900" />
            </div>
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-blue-400">Evangelho Prático</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">Gestão de Vendas & Logística</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] text-center font-black uppercase tracking-widest border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Usuário</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                placeholder="Ex: Admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase italic tracking-tighter hover:bg-slate-800 shadow-2xl transition-all mt-4"
          >
            Entrar no Sistema
          </button>
        </form>
        <div className="p-6 text-center border-t border-slate-50">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Evangelho Prático © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
