
import React, { useState } from 'react';
import { Topic } from '../types';

interface AddTopicModalProps {
  parentId?: string;
  initialTopic?: Topic;
  onClose: () => void;
  onAdd: (title: string, description: string, category: string, parentId?: string) => void;
  onSave?: (updatedTopic: Topic) => void;
  onDelete?: (id: string) => void;
}

const AddTopicModal: React.FC<AddTopicModalProps> = ({ parentId, initialTopic, onClose, onAdd, onSave, onDelete }) => {
  const [title, setTitle] = useState(initialTopic?.title || '');
  const [description, setDescription] = useState(initialTopic?.description || '');
  const [category, setCategory] = useState(initialTopic?.category || '常规');

  const isEditMode = !!initialTopic;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      if (isEditMode && onSave && initialTopic) {
        onSave({
          ...initialTopic,
          title,
          description,
          category,
        });
      } else {
        onAdd(title, description, category, parentId);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditMode ? '编辑监控属性' : (parentId ? '添加子关注点' : '启动新情报追踪')}
            </h2>
            <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-wider font-semibold">
              {isEditMode ? '修改监控指令' : 'AI 将以此为核心执行初始化检索'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">主题名称</label>
            <input
              autoFocus required type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：量子计算商用化进度"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">核心情报描述</label>
            <textarea
              required value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请描述您关心的重点、维度或特定目标..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none shadow-inner"
            />
          </div>

          {!parentId && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">情报分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option>地缘政治</option>
                <option>技术与创新</option>
                <option>金融市场</option>
                <option>环境与气候</option>
                <option>科学研究</option>
                <option>常规</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            {isEditMode && onDelete && (
              <button 
                type="button" 
                onClick={() => onDelete(initialTopic!.id)}
                className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
                title="删除此主题"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 text-sm font-bold hover:text-slate-600">取消</button>
            <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]">
              {isEditMode ? '保存变更' : '启动追踪'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTopicModal;
