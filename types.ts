
export interface EventItem {
  id: string;
  timestamp: number;
  content: string; 
  sourceUrls: string[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  events: EventItem[];
  lastUpdated: number;
  parentId?: string; 
  relevantSources?: string[]; // 设为可选，兼容旧数据
}

export interface Briefing {
  id: string;
  timestamp: number;
  content: string; 
  topicIds: string[];
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}
