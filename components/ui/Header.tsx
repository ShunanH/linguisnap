"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, Languages, Menu, X } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import Settings from './Settings';

export default function Header() {
  const { uiLang, setUiLang, t } = useLanguage(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <header className="flex items-center justify-between py-2 mb-6 gap-4">
      <Link href="/" className="group flex flex-col">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" size={24} />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 group-hover:opacity-80 transition-opacity">LinguiSnap</h1>
        </div>
        <p className="text-slate-500 text-sm mt-1 ml-8 hidden sm:block">{t.header.subtitle}</p>
      </Link>


      <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 font-bold text-sm transition-all shadow-sm">
        <Menu size={16} />
        <span>{t.header.menu}</span>
      </button>

      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)} 
      />
      

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{t.header.menu}</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"><X size={18} /></button>
        </div>


        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setUiLang(uiLang === 'zh' ? 'en' : 'zh')} className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors">
              <Languages size={18} /> {uiLang === 'zh' ? 'Switch to EN' : '切换至中文'}
            </button>
            <Link href="/tutorial" onClick={() => setIsSidebarOpen(false)} className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors">
              <BookOpen size={18} /> {t.header.tutorial}
            </Link>
          </div>

          <div className="h-px w-full bg-slate-100 my-4" />

  
          <Settings />
        </div>
      </div>
    </header>
  );
}