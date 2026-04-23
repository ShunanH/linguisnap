import React from 'react';
import WordCard from './WordCard';
import { SentenceAnalysis } from '@/lib/prompts';

export default function ResultGrid({ data }: { data: SentenceAnalysis }) {
  if (!data || !data.words) return null;

  return (
    <div className="bg-white/80 backdrop-blur-xl px-10 pt-10 pb-8 rounded-[2rem] border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-0">
        
        <div className="flex gap-x-10 items-start overflow-x-auto pb-6 w-full custom-scrollbar">
          {data.words.map((word, idx) => (
            <WordCard key={idx} word={word} />
          ))}
        </div>

        <div className="mt-4 pt-6 border-t border-slate-100/60 text-center">
          <p className="text-sm font-medium text-slate-400 tracking-widest uppercase mb-2">整句意译</p>
          <p className="text-xl text-slate-700 font-medium">{data.overallTranslation}</p>
        </div>

      </div>
  );
}