import Settings from '@/components/ui/Settings';
import Analyzer from '@/components/features/Analyzer';
import Header from '@/components/ui/Header';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900 pb-20">
      {/* max-w-5xl 保证了页面有足够的宽度来横向展示词组卡片 */}
      <div className="max-w-5xl mx-auto px-6 pt-10 space-y-8">
        
        {/* 1. 头部导航区域 (包含 Logo 和教程入口) */}
        <Header />

        {/* 2. 控制面板 (API Key、模型选择、语言偏好) */}
        <Settings />

        {/* 3. 核心交互区 (输入框、预设按钮、结果网格) */}
        <Analyzer />

      </div>
    </main>
  );
}