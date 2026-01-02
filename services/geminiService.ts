
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Topic, EventItem } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export const fetchTopicUpdates = async (topic: Topic, subTopics: Topic[] = []): Promise<{ summary: string; sources: string[]; relevantWebsites: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const isNew = topic.lastUpdated === 0;
  const timeContext = isNew 
    ? "这是一个新主题，请执行全时域搜索，涵盖该主题的起源、发展现状及所有关键里程碑。" 
    : `请搜索自 ${new Date(topic.lastUpdated).toLocaleString('zh-CN')} 以来发生的最新进展。`;

  const sourceContext = topic.relevantSources && topic.relevantSources.length > 0 
    ? `请优先从以下已知高度相关的网站获取信息：${topic.relevantSources.join(', ')}。`
    : "请在搜索过程中识别并列出 3-5 个与此主题高度相关的专业资讯网站或官方源。";

  const subTopicContext = subTopics.length > 0
    ? `该主题包含以下子关注点，请在搜索时优先关注与之相关的动态：${subTopics.map(s => s.title).join(', ')}。`
    : "";

  const prompt = `你是一个情报专家。
  主题：${topic.title}
  描述：${topic.description}
  
  要求：
  1. ${timeContext}
  2. ${sourceContext}
  3. ${subTopicContext}
  4. 你的回答必须是纯 HTML 格式。使用 <h3>, <p>, <ul>, <li>, <strong> 等标签。不要包含 Markdown 的代码块包装。
  5. 除了事件摘要，最后请以 JSON 格式提供识别到的相关网站列表，格式如 [RELEVANT_SITES: url1, url2]。
  
  请用中文回答。`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let rawText = response.text || "未找到新更新。";
    const siteMatch = rawText.match(/\[RELEVANT_SITES:\s*([^\]]+)\]/);
    const relevantWebsites = siteMatch 
      ? siteMatch[1].split(',').map(s => s.trim()).filter(s => s.startsWith('http')) 
      : [];
    const summary = rawText.replace(/\[RELEVANT_SITES:[^\]]+\]/, '').trim();
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    return { summary, sources, relevantWebsites };
  } catch (error) {
    console.error("获取主题更新时出错:", error);
    throw error;
  }
};

export const generateDailyBriefing = async (topics: Topic[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const topicsSummary = topics.map(t => {
    const recentEvents = t.events.slice(-3).map(e => `[${new Date(e.timestamp).toLocaleDateString()}] ${e.content}`).join("<br>");
    return `主题: ${t.title}<br>关键背景: ${t.description}<br>近期条目:<br>${recentEvents}`;
  }).join("<hr>");

  const prompt = `你是一位首席智能分析师。请基于以下各个独立主题的追踪数据，生成一份综合性的 HTML 情报简报。
  
  要求：
  1. 寻找不同主题（甚至是跨领域的）之间的关联和潜在影响。
  2. 采用高级情报周刊的排版风格。
  3. 语气专业、严谨且富有洞察力。
  4. 严禁使用 Markdown。

  待处理数据：
  ${topicsSummary}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "简报生成中。";
  } catch (error) {
    console.error("生成简报出错:", error);
    throw error;
  }
};

export const deepDiveChat = async (topic: Topic, query: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // 核心：构建结构化情报库上下文
  const eventDB = topic.events.length > 0 
    ? topic.events.map((e, idx) => `条目 #${idx + 1} (记录于 ${new Date(e.timestamp).toLocaleString()})\n内容: ${e.content}`).join('\n\n')
    : "（当前数据库为空，尚未追踪到任何事件条目）";

  const systemInstruction = `你是一位深度分析专家。用户正在就主题 "${topic.title}"（描述：${topic.description}）与你交流。
  
  【情报库内容 - 极其重要】
  以下是你系统目前已经成功追踪并存储的所有事件条目：
  ${eventDB}

  【回答准则】
  1. 当用户提到“这些条目”、“上述消息”、“追踪到的内容”时，你必须精准指代上述【情报库内容】。
  2. 你应该能够对比情报库中不同时间点的变化。
  3. 结合你的外部知识和 Google 搜索对这些条目进行点评、解释或预测。
  4. 必须以 HTML 格式回答（使用 <h3>, <p>, <ul>, <li>, <span style="color:blue"> 等）。
  5. 严禁使用 Markdown 代码块。`;

  const chat = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  });

  try {
    const response = await chat.sendMessage({ message: query });
    return response.text || "分析中...";
  } catch (error) {
    console.error("对话失败:", error);
    throw error;
  }
};
