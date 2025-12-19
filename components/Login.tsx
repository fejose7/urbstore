import React, { useState } from 'react';
import { db } from '../db';
import { UserAccount } from '../types';
import { Lock, User as UserIcon, Component as SheepIcon } from 'lucide-react';

interface Props {
  onLogin: (user: UserAccount) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Fix: Make handleLogin async and await the database calls to resolve promises before spreading
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
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 border border-slate-100">
        <div className="bg-slate-900 p-12 text-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600/5 pointer-events-none"></div>
          
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white rounded-full p-2 shadow-2xl border-4 border-blue-500 overflow-hidden flex items-center justify-center group hover:scale-110 transition-transform">
               <SheepIcon size={56} className="text-slate-900" />
            </div>
          </div>
          
          <h1 className="text-4xl font-black italic tracking-tighter text-blue-400">Manus Libros</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">Sistema de Gestão</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] text-center font-black uppercase tracking-widest border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Usuário de Acesso</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 placeholder:text-slate-200"
                placeholder="Login"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Senha Privada</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 placeholder:text-slate-200"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase italic tracking-tighter hover:bg-slate-800 shadow-2xl transition-all active:scale-[0.97] mt-4"
          >
            Acessar Sistema
          </button>
        </form>
        <div className="p-6 text-center border-t border-slate-50">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Manus Libros Technology © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Login;