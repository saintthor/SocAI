
import React from 'react';
import { Topic } from '../types';

interface SidebarProps {
  topics: Topic[];
  activeTopicId: string | null;
  onSelectTopic: (id: string | null) => void;
  onAddTopic: (parentId?: string) => void;
  isGeneratingBriefing: boolean;
  onGenerateBriefing: () => void;
  onClearData: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  topics, 
  activeTopicId, 
  onSelectTopic, 
  onAddTopic,
  isGeneratingBriefing,
  onGenerateBriefing,
  onClearData
}) => {
  const rootTopics = topics.filter(t => !t.parentId);

  const renderTopicItem = (topic: Topic, level: number = 0) => {
    const children = topics.filter(t => t.parentId === topic.id);
    const isActive = activeTopicId === topic.id;

    return (
      <div key={topic.id} className="mb-1">
        <button
          onClick={() => onSelectTopic(topic.id)}
          className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all text-left group ${
            isActive ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50'
          }`}
          style={{ paddingLeft: `${16 + level * 20}px` }}
        >
          <div className={`w-1.5 h-1.5 rounded-full mr-3 ${isActive ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
          <span className="truncate flex-1 text-sm">{topic.title}</span>
        </button>
        {children.length > 0 && (
          <div className="mt-1">
            {children.map(child => renderTopicItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 md:w-80 bg-white h-screen flex flex-col border-r border-slate-200 shadow-sm z-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
          事件脉动 AI
        </h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">分层情报追踪</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        <button
          onClick={() => onSelectTopic(null)}
          className={`w-full flex items-center px-4 py-3 rounded-xl transition-all mb-4 ${
            activeTopicId === null ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" /></svg>
          <span className="font-bold text-sm">全局情报简报</span>
        </button>

        <div className="pb-2">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">我的主题树</p>
        </div>

        <div className="space-y-1">
          {rootTopics.map(topic => renderTopicItem(topic))}
        </div>

        <button
          onClick={() => onAddTopic()}
          className="w-full flex items-center px-4 py-3 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-dashed border-slate-200 mt-4 text-sm"
        >
          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          <span>新建顶级主题</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          onClick={onGenerateBriefing}
          disabled={isGeneratingBriefing || topics.length === 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
        >
          {isGeneratingBriefing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          )}
          生成综合分析
        </button>
        <button
          onClick={onClearData}
          className="w-full py-2 text-[10px] text-slate-300 hover:text-red-400 transition-colors uppercase tracking-widest font-bold"
        >
          清空本地缓存
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
