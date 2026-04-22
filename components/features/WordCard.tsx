import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { WordAnalysis, Morpheme } from '@/lib/prompts';

const getMorphemeColor = (type: Morpheme['type']) => {
  switch (type) {
    case 'prefix': return 'text-blue-500';
    case 'root': return 'text-slate-800 font-semibold';
    case 'suffix': return 'text-emerald-500';
    case 'particle': return 'text-amber-500';
    default: return 'text-slate-500';
  }
};

export default function WordCard({ word }: { word: WordAnalysis }) {
  return (
    // 用 Tooltip.Provider 包裹卡片，设置 100ms 的悬停延迟，防误触
    <Tooltip.Provider delayDuration={100}>
      <div className="flex flex-col items-center gap-2 w-max min-w-[80px]">
        
        {/* 第 1 行：原词 */}
        <div className="text-xl font-bold tracking-tight text-slate-900 h-8 flex items-end whitespace-nowrap">
          {word.original}
        </div>

        {/* ============================== */}
        {/* 第 2 行：词素拆解 (上方深色浮窗) */}
        {/* ============================== */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            {/* 触发器 */}
            <div className="cursor-pointer h-6 flex items-center outline-none">
              <div className="flex font-mono text-[15px] tracking-wide whitespace-nowrap">
                {word.morphemes.map((m, idx) => (
                  <span key={idx} className={getMorphemeColor(m.type)}>{m.text}</span>
                ))}
              </div>
            </div>
          </Tooltip.Trigger>

          {/* 🌟 真正的魔法：Portal 传送门！它会让浮窗直接跳出任何滚动条的限制 */}
          <Tooltip.Portal>
            <Tooltip.Content 
              side="top" 
              sideOffset={12} 
              className="z-[9999] animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="w-72 p-4 bg-slate-900/95 backdrop-blur-md text-white text-sm rounded-2xl shadow-2xl border border-slate-700/50">
                <p className="font-medium mb-3 opacity-60 text-[11px] uppercase tracking-widest border-b border-slate-700 pb-2">词源结构</p>
                <div className="space-y-2.5">
                  {word.morphemeLogics?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-left">
                      <span className="font-mono text-blue-300 font-semibold shrink-0 mt-0.5">{item.part}</span>
                      <span className="text-slate-300 leading-snug">{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* 原生自带的高级小三角箭头 */}
              <Tooltip.Arrow className="fill-slate-900/95" width={16} height={8} />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        {/* ============================== */}
        {/* 第 3 行：语法标签 (下方浅色浮窗) */}
        {/* ============================== */}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className="cursor-pointer h-5 flex items-center outline-none">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 whitespace-nowrap transition-colors hover:border-slate-300 hover:text-slate-600">
                {word.gloss}
              </span>
            </div>
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content 
              side="bottom" 
              sideOffset={12} 
              className="z-[9999] animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="w-64 p-4 bg-white border border-slate-200 shadow-[0_12px_40px_rgb(0,0,0,0.12)] text-slate-800 text-sm rounded-2xl">
                <p className="font-medium mb-3 text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-100 pb-2">语法解析</p>
                <div className="space-y-2.5">
                  {word.glossLogics?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-left">
                      <span className="font-mono text-slate-700 font-bold shrink-0 mt-0.5 text-xs bg-slate-100 px-1 rounded">{item.part}</span>
                      <span className="text-slate-600 leading-snug">{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Tooltip.Arrow className="fill-white" width={16} height={8} />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        {/* 第 4 行：直译 */}
        <div className="text-sm text-slate-500 mt-1 h-6 flex items-start italic whitespace-nowrap">
          {word.translation}
        </div>
        
      </div>
    </Tooltip.Provider>
  );
}