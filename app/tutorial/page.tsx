"use client";

import Link from 'next/link';
import { ArrowLeft, ExternalLink, Zap, Key, Construction } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

const TUTORIAL_DICT = {
  zh: {
    back: "返回主页", title: "使用指南", subtitle: "欢迎来到 LinguiSnap",
    modes: {
      title: "1. 运行模式说明", desc: "在右上角的菜单中，你可以随时切换适合自己的运行模式：",
      basicTitle: "学习模式 (Basic Mode)", basicDesc: "即时可用，无需配置。默认使用DeepSeek引擎。每日提供20次免费额度。",
      proTitle: "专业模式 (Pro Mode)", proDesc: "专业首选。填入你自己的大模型API Key，解除所有限制，并可自由切换至其他厂商旗舰模型，如Gemin, GPT, Claude。",
    },
    lego: {
      title: "2. 语言是一堆积木",
      p1: "传统的语言学习总是让人痛苦：背单词表，背语法规则，再做阅读。这就像是在逼人先背下所有乐高零件的图纸，再去拼一座城堡。",
      p2: "LinguiSnap是自上而下的学习方式。不需要死记硬背，直接从阅读整条句子开始。我们会像拆解积木一样，为你把整句话切分成最小的意义单位（词素），让你从语言骨架的角度真正理解外语是如何运作的。"
    },
    sentence: {
      title: "3. 语言的积木零件",
      desc: "当你输入一整句话时，LinguiSnap会将每个词精准剖析。以这句西班牙语为例：“Cada mañana me regalas la vida” (每一个清晨，你都赠与我新生)："
    },
    leipzig: {
      title: "4. 简化的专业语法标注",
      p1: "为了让你看懂语法的本质，我们使用国际语言学界通用的莱比锡标注法，并为初学者做了解释性的简化。它像贴标签一样，标出每个词块的语法身份，所有标签缩写均基于英语，更多信息请参阅底部链接。",
      quickStart: "常见标签快速入门",
      tags: [
        { t: "1SG", d: "我 (第一人称单数)" }, { t: "1PL", d: "我们 (第一人称复数)" }, { t: "3SG", d: "他/她/它 (第三人称单数)" },
        { t: "NEG", d: "否定 (表示不)" }, { t: "NOM", d: "主格 (动作执行者)" }, { t: "ACC", d: "宾格 (直接承受者)" },
        { t: "DAT", d: "与格 (间接承受者)" }, { t: "PST", d: "过去时 (Past)" }, { t: "FUT", d: "将来时 (Future)" },
        { t: "PTCP", d: "分词 (常作形容词)" }, { t: "F", d: "阴性 (Feminine)" }, { t: "M", d: "阳性 (Masculine)" }
      ],
      whyTitle: "为什么动词会有一连串的标签？",
      whyDesc1: "在许多语言中，一个词往往身兼数职。比如英语的 goes，它不仅表达“去”，还包含了“现在时”和“第三人称”的信息；但要确认到底是“它”“她”还是“他”，则要参照动作的发起者进行确认。所以它的标签是串联的：go-3SG.PRES（去-第三人称单数-现在时）。",
      whyDesc2: "再比如西班牙语的 comió（他吃了），标签是 eat-3SG.PST，意思是：吃-第三人称单数-过去时。"
    },
    card: {
      title: "5. 如何阅读分析卡？", desc: "以一个英语单词为例，看看卡片的每一层都在诉说什么：",
      l1: "原词 (Surface)：用户看到的表层文本。",
      l2: "词素 (Morphemes)：物理拆分。蓝色是前缀，黑色是词根，绿色是后缀。在首页中悬停可看词源故事。",
      l3: "语法解析：对应词素的语法标签。",
      l4: "直译 (Literal)：脱离语境的基本含义。"
    },
    action: "我已经懂了，开始解析！", reference: "阅读与参考",
    links: {
      l1Title: "莱比锡标注规则", l1Desc: "马克斯·普朗克演化人类学研究所发布的全球通用语法标注规范。",
      l2Title: "形态学 (Morphology) 词源学基础", l2Desc: "维基百科：关于词汇内部结构、词根与词缀的语言学分支。"
    }
  },
en: {
    back: "Back to Home", title: "User Guide", subtitle: "Welcome to LinguiSnap",
    modes: {
      title: "1. Operation Modes Explained", desc: "In the top right menu, you can switch to the operation mode that suits you at any time:",
      basicTitle: "Learning Mode (Basic Mode)", basicDesc: "Ready to use immediately, no configuration required. Powered by the DeepSeek engine by default. Provides 20 free quotas per day.",
      proTitle: "Pro Mode", proDesc: "The professional choice. Enter your own LLM API Key to remove all limits, and freely switch to flagship models from other providers, such as Gemini, GPT, and Claude.",
    },
    lego: {
      title: "2. Language is a pile of Lego blocks",
      p1: "Traditional language learning is always painful: memorizing vocabulary lists, memorizing grammar rules, and then doing reading. It's like forcing someone to memorize all the blueprints of Lego pieces before building a castle.",
      p2: "LinguiSnap is a top-down learning approach. No rote memorization needed, just start directly by reading the whole sentence. We will break down the entire sentence for you into the smallest units of meaning (morphemes) like dismantling Lego blocks, allowing you to truly understand how a foreign language works from the perspective of its linguistic skeleton."
    },
    sentence: {
      title: "3. The Lego pieces of language",
      desc: "When you enter a full sentence, LinguiSnap will accurately dissect every word. Take this Spanish sentence as an example: “Cada mañana me regalas la vida” (Every morning, you give me a new life):"
    },
    leipzig: {
      title: "4. Simplified Professional Grammar Glossing",
      p1: "To help you understand the essence of grammar, we use the internationally recognized Leipzig Glossing Rules, with explanatory simplifications for beginners. It works like tagging, indicating the grammatical identity of each word chunk. All tag abbreviations are based on English. For more information, please refer to the links at the bottom.",
      quickStart: "Quick start for common tags",
      tags: [
        { t: "1SG", d: "I (1st person singular)" }, { t: "1PL", d: "We (1st person plural)" }, { t: "3SG", d: "He/She/It (3rd person singular)" },
        { t: "NEG", d: "Negative (meaning 'not')" }, { t: "NOM", d: "Nominative (Action performer)" }, { t: "ACC", d: "Accusative (Direct receiver)" },
        { t: "DAT", d: "Dative (Indirect receiver)" }, { t: "PST", d: "Past tense (Past)" }, { t: "FUT", d: "Future tense (Future)" },
        { t: "PTCP", d: "Participle (often used as an adjective)" }, { t: "F", d: "Feminine (Feminine)" }, { t: "M", d: "Masculine (Masculine)" }
      ],
      whyTitle: "Why do verbs have a series of chained tags?",
      whyDesc1: "In many languages, a single word often plays multiple roles. For example, the English word 'goes' not only expresses 'go', but also contains the information of 'present tense' and 'third person'; however, to confirm whether it is 'it', 'she', or 'he', you must refer to the initiator of the action. So its tag is chained: go-3SG.PRES (go - 3rd person singular - present tense).",
      whyDesc2: "Another example is the Spanish 'comió' (he ate). The tag is eat-3SG.PST, which means: eat - 3rd person singular - past tense."
    },
    card: {
      title: "5. How to read the analysis card?", desc: "Taking an English word as an example, let's see what each layer of the card is telling you:",
      l1: "Surface Word: The surface text seen by the user.",
      l2: "Morphemes: Physical split. Blue is the prefix, black is the root, and green is the suffix. Hover over them on the home page to read the etymological story.",
      l3: "Grammar Analysis: The grammatical tags corresponding to the morphemes.",
      l4: "Literal Meaning: The basic meaning out of context."
    },
    action: "I got it, start analyzing!", reference: "Reading and Reference",
    links: {
      l1Title: "Leipzig Glossing Rules", l1Desc: "Global standard glossing rules published by the Max Planck Institute for Evolutionary Anthropology.",
      l2Title: "Morphology (Linguistics) Etymology Basics", l2Desc: "Wikipedia: The branch of linguistics that studies the internal structure of words, roots, and affixes."
    }
  }
};

export default function TutorialPage() {
  const { uiLang } = useLanguage();
  const t = TUTORIAL_DICT[uiLang] || TUTORIAL_DICT.zh;

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900 pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-10 space-y-8">
        
        {/* 顶部返回区域 */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white/60 px-4 py-2 rounded-full border border-slate-200 hover:bg-white shadow-sm">
            <ArrowLeft size={14} />
            {t.back}
          </Link>
        </div>

        {/* 文章主体 */}
        <article className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] border border-black/[0.04] shadow-sm space-y-10">
          
          <header className="border-b border-slate-100 pb-6 text-center">
            {/* 🌟 主标题：去掉了 text-4xl 和 font-extrabold，改为更克制的 text-2xl/3xl 和 font-semibold */}
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2 text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-500 tracking-wide">{t.subtitle}</p>
          </header>

          {/* ========================================== */}
          {/* 1. 运行模式说明 */}
          {/* ========================================== */}
          <section className="space-y-4">
            {/* 🌟 副标题：去掉了 text-2xl 和 font-bold，改为 text-lg/xl 和 font-medium */}
            <h2 className="text-lg md:text-xl font-medium text-slate-800 flex items-center gap-2">
              {t.modes.title}
            </h2>
            <p className="text-[15px] text-slate-600 leading-relaxed">{t.modes.desc}</p>
            
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                <h3 className="font-medium text-slate-800 text-[15px] mb-2">
                  {t.modes.basicTitle}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t.modes.basicDesc}</p>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                <h3 className="font-medium text-slate-800 text-[15px] mb-2">
                  {t.modes.proTitle}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t.modes.proDesc}</p>
              </div>
            </div>
          </section>

          {/* ========================================== */}
          {/* 2. 语言是一堆积木 */}
          {/* ========================================== */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-medium text-slate-800 flex items-center gap-2">
              {t.lego.title}
            </h2>
            <p className="text-[15px] text-slate-600 leading-relaxed">{t.lego.p1}</p>
            <p className="text-[15px] text-slate-600 leading-relaxed"><strong>{t.lego.p2}</strong></p>
          </section>

          {/* ========================================== */}
          {/* 3. 语言的积木零件 */}
          {/* ========================================== */}
          <section className="space-y-5">
            <h2 className="text-lg md:text-xl font-medium text-slate-800 flex items-center gap-2">
              {t.sentence.title}
            </h2>
            <p className="text-[15px] text-slate-600 leading-relaxed">{t.sentence.desc}</p>
            
            {/* 整句演示 UI - 整体缩小字号 */}
            <div className="bg-[#f8f9fa] p-5 md:p-6 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner">
              <div className="flex gap-3 w-max mx-auto">
                <div className="flex flex-col gap-1 items-center bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                  <span className="font-medium text-slate-800 text-base">cada</span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-50 px-1 rounded">every</span>
                  <span className="text-[13px] text-slate-500 italic mt-0.5">{uiLang === 'zh' ? '每个' : 'every'}</span>
                </div>
                <div className="flex flex-col gap-1 items-center bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                  <span className="font-medium text-slate-800 text-base">mañana</span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-50 px-1 rounded">morning</span>
                  <span className="text-[13px] text-slate-500 italic mt-0.5">{uiLang === 'zh' ? '早晨' : 'morning'}</span>
                </div>
                <div className="flex flex-col gap-1 items-center bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 border-b-2 border-b-indigo-400">
                  <span className="font-medium text-slate-800 text-base">me</span>
                  <span className="text-[10px] font-mono text-indigo-500 font-semibold bg-indigo-50 px-1 rounded border border-indigo-100">1SG.DAT</span>
                  <span className="text-[13px] text-slate-500 italic mt-0.5">{uiLang === 'zh' ? '对我' : 'to me'}</span>
                </div>
                <div className="flex flex-col gap-1 items-center bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 border-b-2 border-b-rose-400">
                  <span className="font-medium text-slate-800 text-base">regalas</span>
                  <span className="text-[10px] font-mono text-rose-500 font-semibold bg-rose-50 px-1 rounded border border-rose-100">give-2SG.PRES</span>
                  <span className="text-[13px] text-slate-500 italic mt-0.5">{uiLang === 'zh' ? '你赋予' : 'you give'}</span>
                </div>
                <div className="flex flex-col gap-1 items-center bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                  <span className="font-medium text-slate-800 text-base">la</span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-50 px-1 rounded">DEF.F.SG</span>
                  <span className="text-[13px] text-slate-500 italic mt-0.5">{uiLang === 'zh' ? '(冠词)' : 'the'}</span>
                </div>
                <div className="flex flex-col gap-1 items-center bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                  <span className="font-medium text-slate-800 text-base">vida</span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-50 px-1 rounded">life</span>
                  <span className="text-[13px] text-slate-500 italic mt-0.5">{uiLang === 'zh' ? '生命' : 'life'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================== */}
          {/* 4. Leipzig 标注法解释 */}
          {/* ========================================== */}
          <section className="space-y-5">
            <h2 className="text-lg md:text-xl font-medium text-slate-800 flex items-center gap-2">
              {t.leipzig.title}
            </h2>
            <p className="text-[15px] text-slate-600 leading-relaxed">{t.leipzig.p1}</p>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
              <p className="text-[13px] font-medium text-slate-400 uppercase tracking-widest">{t.leipzig.quickStart}</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-slate-600">
                {t.leipzig.tags.map((tag, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-medium bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{tag.t}</span> 
                    <span className="text-[13px]">{tag.d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
              <p className="font-medium text-[15px] text-slate-800">{t.leipzig.whyTitle}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{t.leipzig.whyDesc1}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{t.leipzig.whyDesc2}</p>
            </div>
          </section>

          {/* ========================================== */}
          {/* 5. 四行卡片拆解说明 */}
          {/* ========================================== */}
          <section className="space-y-6">
            <h2 className="text-lg md:text-xl font-medium text-slate-800 flex items-center gap-2">
              {t.card.title}
            </h2>
            <p className="text-[15px] text-slate-600 leading-relaxed">{t.card.desc}</p>

            <div className="flex flex-col lg:flex-row items-center gap-6 bg-[#f5f5f7] p-6 rounded-2xl border border-black/[0.04] shadow-inner justify-center">
              <div className="flex flex-col items-center gap-1.5 bg-white p-5 rounded-xl shadow-sm border border-slate-100 w-max pointer-events-none">
                <div className="text-lg font-semibold tracking-tight text-slate-900 h-6 flex items-end">disconnected</div>
                <div className="h-5 flex items-center font-mono text-sm tracking-wide">
                  <span className="text-blue-500">dis-</span>
                  <span className="text-slate-800 font-medium">connect</span>
                  <span className="text-emerald-500">-ed</span>
                </div>
                <div className="h-5 flex items-center mt-1">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                    NEG-connect-PTCP
                  </span>
                </div>
                <div className="text-[13px] text-slate-500 mt-1 h-5 flex items-start italic">
                  {uiLang === 'zh' ? '断开的 / 失去联系的' : 'disconnected / detached'}
                </div>
              </div>

              <div className="space-y-3 text-[14px] text-slate-600 flex-1">
                <div className="flex gap-2.5"><span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-medium shrink-0">1</span><p><strong>{t.card.l1}</strong></p></div>
                <div className="flex gap-2.5"><span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-medium shrink-0">2</span><p><strong>{t.card.l2}</strong></p></div>
                <div className="flex gap-2.5"><span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-medium shrink-0">3</span><p><strong>{t.card.l3}</strong></p></div>
                <div className="flex gap-2.5"><span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-medium shrink-0">4</span><p><strong>{t.card.l4}</strong></p></div>
              </div>
            </div>

            <div className="text-center pt-8">
              <Link href="/" className="inline-block bg-slate-900 text-white px-6 py-2.5 rounded-full text-[15px] font-medium shadow-sm hover:bg-slate-800 transition-colors">
                {t.action}
              </Link>
            </div>
          </section>

          {/* ========================================== */}
          {/* 参考链接与延伸阅读 */}
          {/* ========================================== */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="text-base font-medium text-slate-800">{t.reference}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a href="https://www.eva.mpg.de/lingua/resources/glossing-rules.php" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex flex-col pr-3">
                  <span className="font-medium text-slate-800 group-hover:text-slate-900 transition-colors text-[14px]">
                    {t.links.l1Title}
                  </span>
                  <span className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">
                    {t.links.l1Desc}
                  </span>
                </div>
                <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
              </a>
              <a href="https://en.wikipedia.org/wiki/Morphology_(linguistics)" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex flex-col pr-3">
                  <span className="font-medium text-slate-800 group-hover:text-slate-900 transition-colors text-[14px]">
                    {t.links.l2Title}
                  </span>
                  <span className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">
                    {t.links.l2Desc}
                  </span>
                </div>
                <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
              </a>
            </div>
          </section>

        </article>
      </div>
    </main>
  );
}