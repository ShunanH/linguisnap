export interface Morpheme {
  text: string;
  type: 'prefix' | 'root' | 'suffix' | 'particle' | 'none'; 
}

// 🌟 新增：结构化的逻辑解析
export interface LogicItem {
  part: string;     // 词素或标签本身（如 "des-" 或 "NEG"）
  meaning: string;  // 简短的含义解释
}

export interface WordAnalysis {
  original: string;           
  morphemes: Morpheme[];      
  morphemeLogics: LogicItem[]; // 🌟 变成数组
  gloss: string;              
  glossLogics: LogicItem[];    // 🌟 变成数组
  translation: string;        
}

export interface SentenceAnalysis {
  correctedSentence: string | null;
  words: WordAnalysis[];
  overallTranslation: string; 
}

export const getSystemPrompt = (lang: string) => {
  // 🌟 核心魔法：彻底净化 JSON 模板，绝不留一丝英文诱导！
  let exLogic1 = "否定前缀，表示相反";
  let exRoot = "词根：幸运";
  let exLogic2 = "表示否定";
  let exTrans = "不幸地";
  let exOverall = "不幸的是，...";

  let langInstruction = "";
  
  if (lang === "zh-parse-en-trans") {
    langInstruction = `
输出语言限制 - 混合模式
1. 所有的词素解析 (morphemeLogics) 和语法解析 (glossLogics) 必须使用纯中文进行解释。
2. 每个单词的直译 (translation) 必须使用对应语法、对应含义的英文。
3. 但最底部的整句意译 (overallTranslation)，必须使用极其地道、贴合原句语序的英语！`;
    exTrans = "unfortunately";
    exOverall = "Unfortunately, ...";
    
  } else if (lang === "en-all") {
    langInstruction = `
输出语言终极限制 - 全英文模式
1. 所有的逻辑解释 (morphemeLogics, glossLogics)、词汇直译 (translation) 以及整句意译 (overallTranslation) 必须全部使用纯英文。`;
    exLogic1 = "Negative prefix";
    exRoot = "Root: fortune";
    exLogic2 = "Negative";
    exTrans = "unfortunately";
    exOverall = "Unfortunately, ...";
    
  } else {
    langInstruction = `
输出语言终极限制 - 全中文模式
1. 所有的逻辑解释 (morphemeLogics, glossLogics)、词汇直译 (translation) 以及整句意译 (overallTranslation) 必须全部使用纯中文！
2. 绝对不要在 translation 和 overallTranslation 中输出任何英语！必须是纯中文意译！严禁中英双语混合！`;
  }

  return `
你是一个顶级的计算语言学家。请对用户提供的句子进行形态学拆解和 Leipzig Glossing Rules 标注。

1. 如果用户输入的句子存在明显的单词拼写错误或缺失变音符号，请将其修正为正确的拼写。
2. 只能修改拼写（Typo），绝对不能（NEVER）修改语法结构、替换动词、或增删词汇！
3. 接下来的所有拆解、标注和翻译，都必须基于仅修正了拼写，但原封不动保留了原语法的句子进行！可以在整句翻译里提示语法错误，但拆解必须针对原词。

${langInstruction}

请严格按照以下 JSON 结构返回结果：
{
  "correctedSentence": null,
  "words": [
    {
      "original": "Desafortunadamente",
      "morphemes": [
        { "text": "des-", "type": "prefix" },
        { "text": "a-", "type": "prefix" },
        { "text": "fortun", "type": "root" },
        { "text": "-ad", "type": "suffix" },
        { "text": "-a", "type": "suffix" },
        { "text": "-mente", "type": "suffix" }
      ],
      "morphemeLogics": [
        { "part": "des-", "meaning": "${exLogic1}" },
        { "part": "fortun", "meaning": "${exRoot}" }
      ],
      "gloss": "NEG-fortune-PTCP-F-ADV",
      "glossLogics": [
        { "part": "NEG", "meaning": "${exLogic2}" }
      ],
      "translation": "${exTrans}"
    }
  ],
  "overallTranslation": "${exOverall}"
}

注意：
1. morphemes 中的 type 只能是 "prefix", "root", "suffix", "particle", "none"。
2. morphemeLogics 和 glossLogics 必须是数组！每个元素的 meaning 必须简短但能够理解（25个字以内）。
3. glossLogics 用大白话解释该语法角色的作用。
4. overallTranslation 要求自然、贴切、能够理解。
5. 如果遇到极长的复合词（如西班牙语的附着代词连写），请准确拆分，但依然保持解释的简短。
`;
};