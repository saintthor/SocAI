
import React, { useState, useRef, useEffect } from 'react';
import { Topic, Message } from '../types';
import { deepDiveChat, fetchTopicUpdates } from '../services/geminiService';

interface TopicDetailProps {
  topic: Topic;
  subTopics: Topic[];
  onUpdateTopic: (topic: Topic) => void;
  onAddSubTopic: (title: string, parentId: string) => void;
  onEditTopic: (topic: Topic) => void;
}

const TopicDetail: React.FC<TopicDetailProps> = ({ topic, subTopics, onUpdateTopic, onAddSubTopic, onEditTopic }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selection, setSelection] = useState<{ text: string, top: number, left: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const handleManualRefresh = async () => {
    setIsUpdating(true);
    try {
      const { summary, sources, relevantWebsites } = await fetchTopicUpdates(topic, subTopics);
      const newEvent = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        content: summary,
        sourceUrls: sources,
      };
      const updatedTopic = {
        ...topic,
        events: [...topic.events, newEvent],
        lastUpdated: Date.now(),
        relevantSources: Array.from(new Set([...(topic.relevantSources || []), ...relevantWebsites]))
      };
      onUpdateTopic(updatedTopic);
    } catch (error) {
      alert("刷新失败，请检查网络。");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;
    const userMsg: Message = { role: 'user', content: inputMessage, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    try {
      const response = await deepDiveChat(topic, inputMessage);
      setChatMessages(prev => [...prev, { role: 'model', content: response, timestamp: Date.now() }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'model', content: "对话服务异常，请稍后再试。", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 2) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text: sel.toString().trim(),
        top: rect.top + window.scrollY - 45,
        left: rect.left + rect.width / 2
      });
    } else {
      // 延迟清除，防止点击按钮时瞬间消失
      setTimeout(() => {
        if (!window.getSelection()?.toString()) setSelection(null);
      }, 100);
    }
  };

  const saveAsFocusPoint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selection) {
      onAddSubTopic(selection.text, topic.id);
      setSelection(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white" onMouseUp={handleMouseUp}>
      {selection && (
        <button 
          onMouseDown={(e) => e.preventDefault()} // 阻止按钮夺取焦点，保持选中状态
          onClick={saveAsFocusPoint}
          className="fixed z-[100] bg-blue-600 text-white text-xs px-4 py-2 rounded-full shadow-2xl hover:bg-blue-700 transition-all transform scale-100 hover:scale-105 active:scale-95 font-bold"
          style={{ top: selection.top, left: selection.left, transform: 'translateX(-50%)' }}
        >
          🔍 设为关注点
        </button>
      )}

      <div className="p-6 border-b border-slate-100 bg-white/95 backdrop-blur flex justify-between items-center shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 truncate">{topic.title}</h2>
            {topic.parentId && <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-100">子关注点</span>}
          </div>
          <p className="text-slate-500 text-sm max-w-2xl truncate">{topic.description}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={() => onEditTopic(topic)}
            className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all"
            title="编辑主题属性"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={isUpdating}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 text-sm font-bold"
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : "同步情报"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-3/5 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">情报数据库 / 条目历史</h3>
            <span className="text-[10px] text-slate-400">共 {topic.events.length} 条记录</span>
          </div>
          {topic.events.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 mx-2">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-slate-400 text-sm">情报库尚空。点击右上角“同步情报”启动搜索。</p>
            </div>
          ) : (
            [...topic.events].reverse().map((event, index) => (
              <div key={event.id} className="relative pl-8 border-l-2 border-blue-100 group">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500 group-hover:bg-blue-500 transition-colors"></div>
                <div className="text-[10px] text-blue-500 font-bold mb-3 flex items-center gap-2">
                  <span>条目 #{topic.events.length - index}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div 
                    className="topic-content prose prose-sm max-w-none text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: event.content }}
                  />
                  {event.sourceUrls && event.sourceUrls.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                      {event.sourceUrls.slice(0, 3).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-slate-50 text-slate-500 px-2 py-1 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors">核心引用 {i + 1}</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="w-2/5 flex flex-col bg-white border-l border-slate-100">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              深度分析工作站
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">AI 已加载情报库，可就已有条目进行提问。</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">交互式研判</h4>
                <p className="text-slate-400 text-xs">尝试问我：“对比最近三条记录，发生了什么质变？”</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[90%] p-4 rounded-2xl text-xs shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-slate-100 text-slate-800'}`}
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                </div>
                AI 正在研判情报库...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="在此输入您的分析需求..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs transition-all pr-12 shadow-inner"
              />
              <button type="submit" className="absolute right-2 top-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" /></svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TopicDetail;
