
import React, { useState, useEffect, useRef } from 'react';
import { Topic, Briefing } from './types';
import Sidebar from './components/Sidebar';
import TopicDetail from './components/TopicDetail';
import GlobalBriefing from './components/GlobalBriefing';
import AddTopicModal from './components/AddTopicModal';
import { generateDailyBriefing } from './services/geminiService';

const TOPICS_KEY = 'eventpulse_topics_v3'; // 升级版本
const OLD_TOPICS_KEY = 'eventpulse_topics_v2'; // 迁移源

const App: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>(() => {
    // 1. 尝试读取 V3 数据
    const savedV3 = localStorage.getItem(TOPICS_KEY);
    if (savedV3) {
      try { return JSON.parse(savedV3); } catch (e) { console.error(e); }
    }
    // 2. 迁移逻辑：如果 V3 没数据，尝试读取 V2 数据
    const savedV2 = localStorage.getItem(OLD_TOPICS_KEY);
    if (savedV2) {
      try {
        const parsed = JSON.parse(savedV2);
        console.log("正在从旧版本迁移数据...");
        return parsed;
      } catch (e) { console.error(e); }
    }
    // 3. 初始空状态
    return [];
  });

  const [briefing, setBriefing] = useState<Briefing | null>(() => {
    const saved = localStorage.getItem('eventpulse_briefing_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [parentForNewTopic, setParentForNewTopic] = useState<string | undefined>(undefined);
  const [editingTopic, setEditingTopic] = useState<Topic | undefined>(undefined);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  
  // 使用 Ref 标记是否已完成初次加载，防止空保存覆盖
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    if (briefing) {
      localStorage.setItem('eventpulse_briefing_v3', JSON.stringify(briefing));
    }
  }, [briefing]);

  const handleAddTopic = (title: string, description: string, category: string, parentId?: string) => {
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      title,
      description,
      category,
      events: [],
      lastUpdated: 0,
      parentId,
      relevantSources: []
    };
    setTopics(prev => [...prev, newTopic]);
    setIsAddModalOpen(false);
    setActiveTopicId(newTopic.id);
  };

  const handleUpdateTopic = (updatedTopic: Topic) => {
    setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));
    setIsAddModalOpen(false);
    setEditingTopic(undefined);
  };

  const handleDeleteTopic = (id: string) => {
    if (window.confirm("确定要删除该主题及其所有子主题吗？数据将无法找回。")) {
      const idsToDelete = new Set([id]);
      // 简单递归查找子项（一级深度，可扩展）
      topics.forEach(t => { if (t.parentId === id) idsToDelete.add(t.id); });
      
      setTopics(prev => prev.filter(t => !idsToDelete.has(t.id)));
      if (activeTopicId && idsToDelete.has(activeTopicId)) {
        setActiveTopicId(null);
      }
      setIsAddModalOpen(false);
      setEditingTopic(undefined);
    }
  };

  const handleAddSubTopicFromSelection = (title: string, parentId: string) => {
    const parent = topics.find(t => t.id === parentId);
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      title,
      description: `针对 "${parent?.title}" 的追踪重点：${title}`,
      category: parent?.category || '常规',
      events: [],
      lastUpdated: 0,
      parentId,
      relevantSources: []
    };
    setTopics(prev => [...prev, newTopic]);
    setActiveTopicId(newTopic.id);
  };

  const handleGenerateBriefing = async () => {
    if (topics.length === 0) return;
    setIsGeneratingBriefing(true);
    setActiveTopicId(null);
    try {
      const content = await generateDailyBriefing(topics);
      setBriefing({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        content,
        topicIds: topics.map(t => t.id),
      });
    } catch (error) {
      alert("简报生成失败。");
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("这将清空所有监控主题。确定吗？")) {
      setTopics([]);
      setBriefing(null);
      localStorage.clear();
    }
  };

  const activeTopic = topics.find(t => t.id === activeTopicId);
  const currentSubTopics = topics.filter(t => t.parentId === activeTopicId);

  return (
    <div className="flex h-screen overflow-hidden text-slate-900 bg-white">
      <Sidebar 
        topics={topics} 
        activeTopicId={activeTopicId} 
        onSelectTopic={setActiveTopicId} 
        onAddTopic={(parentId) => {
          setEditingTopic(undefined);
          setParentForNewTopic(parentId);
          setIsAddModalOpen(true);
        }}
        onGenerateBriefing={handleGenerateBriefing}
        isGeneratingBriefing={isGeneratingBriefing}
        onClearData={handleClearAll}
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTopicId === null ? (
          <GlobalBriefing briefing={briefing} topics={topics} isGenerating={isGeneratingBriefing} />
        ) : activeTopic ? (
          <TopicDetail 
            topic={activeTopic} 
            subTopics={currentSubTopics}
            onUpdateTopic={handleUpdateTopic} 
            onAddSubTopic={handleAddSubTopicFromSelection}
            onEditTopic={(t) => {
              setEditingTopic(t);
              setIsAddModalOpen(true);
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">请选择主题</div>
        )}
      </main>
      {isAddModalOpen && (
        <AddTopicModal 
          parentId={parentForNewTopic}
          initialTopic={editingTopic}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTopic(undefined);
          }} 
          onAdd={handleAddTopic} 
          onSave={handleUpdateTopic}
          onDelete={handleDeleteTopic}
        />
      )}
    </div>
  );
};

export default App;
