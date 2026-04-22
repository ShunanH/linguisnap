import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react'; 

export default function TutorialPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900 pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-10 space-y-8">
        
        {/* 顶部返回区域 */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors bg-white/60 px-4 py-2 rounded-full border border-slate-200 hover:bg-white shadow-sm">
            <ArrowLeft size={16} />
            返回主页
          </Link>
        </div>

        {/* 文章主体 */}
        <article className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] border border-black/[0.04] shadow-sm space-y-12">
          
          <header className="border-b border-slate-100 pb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-900">使用教程</h1>
            <p className="text-lg text-slate-500 font-medium tracking-wide">欢迎来到 LinguiSnap</p>
          </header>

          {/* 理念 1 & 2：乐高与语料驱动 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-blue-500">1.</span> 语言是一堆积木
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              传统的语言学习总是让人痛苦：背单词表，背语法规则，阅读。这就像是在逼人先背下所有乐高零件的图纸，再去拼城堡。
            </p>
            <p className="text-slate-600 leading-relaxed text-lg">
              <strong>LinguiSnap 推荐“自上而下”的学习方式。</strong> 你不需要背任何东西，直接把真实的、鲜活的语料（一整句话）扔进来。我们会像拆解积木一样，为你把这句话切分成最小的意义单位（词素），使用语言学的方式为你搭建框架，让你从基础骨架的角度理解语言，从填补框架的角度了解词汇和语法。
            </p>
          </section>

          {/* 理念 3 & 4：Leipzig 标注法解释 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-blue-500">2.</span> 简化的语法标注
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              为了让你看懂语言的骨架，我们引入了国际语言学界通用的莱比锡标注法（并做了解释性的简化）。它不追求翻译的优美，而是像贴标签一样，标出每个词块的语法身份，从而让你理解每个词块的功能。它的标签缩写基于英语，更多相关内容请参阅底部链接。
            </p>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">常见标签快速入门</p>
              {/* 🌟 优化了响应式网格：手机1列，平板2列，电脑3列 */}
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-slate-700">
                {/* 基础人称与否定 */}
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">1SG</span> <span className="text-sm">我 (第一人称单数)</span></li>
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">1PL</span> <span className="text-sm">我们 (第一人称复数)</span></li>
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">3SG</span> <span className="text-sm">他/她/它 (第三人称单数)</span></li>
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">NEG</span> <span className="text-sm">否定 (表示“不”)</span></li>
                
                {/* 🌟 新增：格 (Cases) - 德语/俄语必备 */}
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">NOM</span> <span className="text-sm">主格 (动作执行者)</span></li>
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">ACC</span> <span className="text-sm">宾格 (直接承受者)</span></li>
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">DAT</span> <span className="text-sm">与格 (间接承受者)</span></li>
                
                {/* 🌟 新增：时态与词性 - 西班牙语/法语必备 */}
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">PST</span> <span className="text-sm">过去时 (Past)</span></li>
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">FUT</span> <span className="text-sm">将来时 (Future)</span></li>
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">PTCP</span> <span className="text-sm">分词 (常作形容词)</span></li>
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">F</span> <span className="text-sm">阴性 (Feminine)</span></li>
                <li className="flex items-center gap-3"><span className="font-mono text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">M</span> <span className="text-sm">阳性 (Masculine)</span></li>
              </ul>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-3">
              <p className="font-bold text-blue-900">为什么动词会有一连串的标签？</p>
              <p className="text-blue-800/80 leading-relaxed">
                在许多语言中，一个词往往身兼数职。比如英语的 <strong className="font-mono">goes</strong>（去），它不仅仅表达“去”的意思，还包含了“现在时”和“第三人称”的信息，也就是说，它的含义可以解释为“他/她/它（现在）去”。如何确定到底是“她”还是“他”，则要通过句子中这个动词的发起者“She”或“He”来确定。
                所以它的标签是串联的：<span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-600 mx-1">go-3SG.PRES（去-第三人称单数-现在时）</span>。
              </p>
              <p className="text-blue-800/80 leading-relaxed">
                再比如西班牙语的 <strong className="font-mono">comió</strong>（他吃了），标签是 <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-600 mx-1">eat-3SG.PST</span>，意思是：吃 - 第三人称单数 - 过去时。
              </p>
            </div>
          </section>

          {/* 理念 5：四行卡片拆解说明 */}
          <section className="space-y-8 pt-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-blue-500">3.</span> 如何阅读分析卡片？
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              以下面这个英语单词为例，看看每一层都在诉说什么：
            </p>

            {/* 静态的卡片示范（利用 Flex 布局完美还原首页样式） */}
            <div className="flex flex-col md:flex-row items-center gap-8 bg-[#f5f5f7] p-8 rounded-[2rem] border border-black/[0.04] shadow-inner justify-center">
              
              {/* 模拟的 WordCard */}
              <div className="flex flex-col items-center gap-2 bg-white p-6 rounded-2xl shadow-md border border-slate-100 w-max pointer-events-none">
                {/* 第 1 行 */}
                <div className="text-xl font-bold tracking-tight text-slate-900 h-8 flex items-end">
                  disconnected
                </div>
                {/* 第 2 行 */}
                <div className="h-6 flex items-center font-mono text-[15px] tracking-wide">
                  <span className="text-blue-500">dis-</span>
                  <span className="text-slate-800 font-semibold">connect</span>
                  <span className="text-emerald-500">-ed</span>
                </div>
                {/* 第 3 行 */}
                <div className="h-5 flex items-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                    NEG-connect-PTCP
                  </span>
                </div>
                {/* 第 4 行 */}
                <div className="text-sm text-slate-500 mt-1 h-6 flex items-start italic">
                  断开的 / 失去联系的
                </div>
              </div>

              {/* 卡片行数图例说明 */}
              <div className="space-y-4 text-sm text-slate-600 flex-1">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">1</span>
                  <p><strong>原词 (Surface)：</strong>用户看到的表层文本。</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">2</span>
                  <p><strong>词素 (Morphemes)：</strong>物理拆分。蓝色是<span className="text-blue-500 font-bold">前缀</span>，黑色是<span className="text-slate-800 font-bold">词根</span>，绿色是<span className="text-emerald-500 font-bold">后缀</span>。在首页中悬停可看词源故事。</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">3</span>
                  <p><strong>语法解析：</strong>对应词素的语法标签。比如 <code className="bg-slate-100 px-1 rounded">NEG</code> 代表表示反向/否定的前缀，<code className="bg-slate-100 px-1 rounded">PTCP</code> 代表将动词转化为状态形容词的过去分词后缀。</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">4</span>
                  <p><strong>直译 (Literal)：</strong>脱离语境的基本含义。</p>
                </div>
              </div>

            </div>

            <div className="text-center pt-8">
              <Link href="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all">
                我已经懂了，开始解析！
              </Link>
            </div>
          </section>
          {/* 新增：参考链接与延伸阅读 */}
          <section className="space-y-4 pt-8 border-t border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">阅读与参考</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 链接 1：Leipzig 官方规则 */}
              <a 
                href="https://www.eva.mpg.de/lingua/resources/glossing-rules.php" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col pr-4">
                  <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">
                    莱比锡标注规则
                  </span>
                  <span className="text-xs text-slate-500 mt-1 line-clamp-2">
                    马克斯·普朗克演化人类学研究所发布的全球通用语法标注规范。
                  </span>
                </div>
                <ExternalLink size={18} className="text-slate-400 group-hover:text-blue-500 shrink-0" />
              </a>

              {/* 链接 2：形态学维基百科 */}
              <a 
                href="https://en.wikipedia.org/wiki/Morphology_(linguistics)" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col pr-4">
                  <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">
                    形态学 (Morphology) 词源学基础
                  </span>
                  <span className="text-xs text-slate-500 mt-1 line-clamp-2">
                    维基百科：关于词汇内部结构、词根与词缀的语言学分支。
                  </span>
                </div>
                <ExternalLink size={18} className="text-slate-400 group-hover:text-blue-500 shrink-0" />
              </a>

            </div>
          </section>

        </article>
      </div>
    </main>
  );
}