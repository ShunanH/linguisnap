import Link from 'next/link';
import { BookOpen, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 mb-6 gap-4">
      {/* 左侧 Logo */}
      <Link href="/" className="group flex flex-col">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" size={24} />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 group-hover:opacity-80 transition-opacity">
            LinguiSnap
          </h1>
        </div>
        <p className="text-slate-500 text-sm mt-1 ml-8">你的语言理解助手。</p>
      </Link>

      {/* 右侧导航 */}
      <nav>
        <Link 
          href="/tutorial" 
          className="flex items-center gap-2 px-5 py-2 bg-white/60 border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm active:scale-95"
        >
          <BookOpen size={16} />
          <span>使用教程</span>
        </Link>
      </nav>
    </header>
  );
}