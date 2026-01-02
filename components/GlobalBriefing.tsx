
import React from 'react';
import { Briefing, Topic } from '../types';

interface GlobalBriefingProps {
  briefing: Briefing | null;
  topics: Topic[];
  isGenerating: boolean;
}

const GlobalBriefing: React.FC<GlobalBriefingProps> = ({ briefing, topics, isGenerating }) => {
  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-10">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">正在分析情报树</h2>
        <p className="text-slate-500 text-sm text-center">AI 正在深度关联各主题及子关注点，生成跨领域见解。</p>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">暂无智能简报</h2>
        <p className="text-slate-500 text-sm mb-8">请先添加主题并点击“生成简报”。</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-10">
          <div className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">INTELLIGENCE SUMMARY</div>
          <h1 className="text-4xl font-bold text-slate-900">综合情报简报</h1>
          <p className="text-slate-400 text-xs mt-2 font-mono">{new Date(briefing.timestamp).toLocaleString('zh-CN')}</p>
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div 
            className="prose prose-blue max-w-none leading-relaxed text-slate-700"
            dangerouslySetInnerHTML={{ __html: briefing.content }}
          />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.filter(t => briefing.topicIds.includes(t.id) && !t.parentId).slice(0, 4).map(topic => (
            <div key={topic.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <h4 className="text-slate-900 font-bold text-sm mb-1">{topic.title}</h4>
              <p className="text-slate-500 text-[10px] line-clamp-2">{topic.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlobalBriefing;
