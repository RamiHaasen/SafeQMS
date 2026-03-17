
export type ISOStandard = '9001' | '14001' | '45001';

export type DocumentType = 'rutin' | 'bilaga' | 'process' | 'instruktion';
export type DocumentStatus = 'saknas' | 'utkast' | 'godkänd';

export type DocumentSubTab = 'library' | 'templates' | 'creation' | 'history' | 'details' | 'mine' | 'search' | 'manage' | 'links';

export interface EnhancedDocument extends LinkedDocument {
  version: string;
  folder?: string;
  linkedProcesses?: string[];
  linkedISOChapters?: string[];
  linkedLaws?: string[];
  publishToIntranet: boolean;
  history: { version: string; date: string; user: string; comment: string; action: string }[];
}

export interface LinkedDocument {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  lastEdited: string;
  owner: string;
  content?: string;
  version?: string;
  reviewDate?: string;
  approver?: string;
  category?: string;
  folder?: string;
  tags?: string[];
  history?: { date: string; user: string; action: string; version: string; comment?: string }[];
}

export interface ISOChapter {
  id: string;
  number: string;
  title: string;
  description: string;
  completed: boolean;
  standard: ISOStandard;
  documents: LinkedDocument[];
}

export interface ProcessItem {
  id: string;
  name: string;
  description?: string;
  subProcesses?: ProcessItem[];
  owner?: string; 
}

export interface ProcessMap {
  management: ProcessItem[];
  main: ProcessItem[];
  support: ProcessItem[];
}

export type CalendarEventType = 'revision' | 'rond' | 'möte' | 'utbildning' | 'mätning' | 'annat';
export type RecurrenceType = 'none' | 'monthly' | 'quarterly' | 'yearly';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  type: CalendarEventType;
  completed: boolean;
  description?: string;
  responsible?: string;
  recurrence: RecurrenceType;
  category?: string;
}

export interface Incident {
  id: string;
  type: 'deviation' | 'accident' | 'improvement';
  title: string;
  description: string;
  date: string;
  reporter: string;
  responsible: string; 
  status: 'open' | 'investigating' | 'closed';
  deadline?: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  requirements: string;
  influence: 'låg' | 'medel' | 'hög';
}

export interface RiskItem {
  id: string;
  category: string;
  description: string;
  probability: number; // 1-5
  impact: number; // 1-5
  mitigation: string;
  owner?: string;
}

export interface CompetenceRecord {
  id: string;
  employee: string;
  role: string;
  training: { name: string; status: 'klar' | 'planerad' | 'saknas' }[];
}

export interface LawRequirement {
  id: string;
  title: string;
  category: string;
  status: 'efterlevs' | 'delvis' | 'brist';
  lastReview: string;
}

export interface Objective {
  id: string;
  title: string;
  target: string;
  progress: number;
  deadline: string;
}

export interface Aspect {
  id: string;
  activity: string;
  impact: string;
  significance: 'låg' | 'medel' | 'hög';
}

export interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface ProductNews {
  id: string;
  title: string;
  date: string;
  content: string;
  isRead: boolean;
}

export interface Manual {
  id: string;
  title: string;
  category: string;
  url: string;
}

export interface User {
  name: string;
  email: string;
  role: 'admin' | 'employee';
  company: string;
  title?: string;
  phone?: string;
  profileImage?: string;
  favoriteDocIds: string[];
}
