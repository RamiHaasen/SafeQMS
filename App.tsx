import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  AlertTriangle, 
  MessageSquare, 
  LogOut, 
  CheckCircle2,
  Plus,
  Send,
  Sparkles,
  Bot,
  X,
  Loader2,
  Calendar as CalendarIcon,
  Search,
  ClipboardList,
  Target,
  Gavel,
  ShieldAlert,
  Users,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Edit2,
  ChevronRight,
  ChevronDown,
  Trash2,
  GitBranch,
  UserCheck,
  FileBadge,
  Lightbulb,
  User as UserIcon,
  Settings as SettingsIcon,
  Key,
  Star,
  Newspaper,
  Book,
  Camera,
  Info,
  Bell,
  ExternalLink,
  Clock,
  Check,
  ChevronLeft,
  CalendarDays,
  CalendarRange,
  ListTodo,
  Files,
  FileSearch,
  Link as LinkIcon,
  FolderOpen,
  MoreVertical,
  Activity,
  History,
  ArrowLeft,
  Paperclip,
  Share2,
  Home,
  Network,
  Trophy,
  Filter,
  ChevronFirst,
  ChevronLast,
  Printer,
  Maximize2,
  FilePlus,
  Folders,
  Eye,
  FileCheck
} from 'lucide-react';
import { ISO_CHAPTERS } from './constants';
import { 
  ISOStandard, 
  ISOChapter, 
  Incident, 
  Message, 
  User, 
  LinkedDocument, 
  EnhancedDocument,
  DocumentSubTab,
  DocumentType, 
  DocumentStatus,
  CalendarEvent,
  CalendarEventType,
  RecurrenceType,
  ProcessMap,
  ProductNews,
  Manual,
  ProcessItem,
  Stakeholder,
  RiskItem,
  Objective,
  CompetenceRecord,
  LawRequirement
} from './types';
import { 
  getISOAdvice, 
  askISOConsultant, 
  suggestAnnualPlan,
  generateISOTemplate
} from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// --- Types ---

type Tab = 
  | 'dashboard' 
  | 'calendar' 
  | 'stakeholders' 
  | 'risks' 
  | 'standards' 
  | 'rondering' 
  | 'competence' 
  | 'objectives' 
  | 'incidents' 
  | 'laws' 
  | 'chat' 
  | 'templates' 
  | 'profile'
  | 'documents';

// --- Sub-components ---

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
  hasDropdown?: boolean;
  isOpen?: boolean;
}> = ({ icon, label, active, onClick, hasDropdown, isOpen }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-md font-bold' 
        : 'text-slate-500 hover:bg-slate-100 font-medium'
    }`}
  >
    <div className="flex items-center space-x-3">
      {icon}
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </div>
    {hasDropdown && (
      <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    )}
  </button>
);

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, children, className, action }) => (
  <div className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-200 ${className}`}>
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const Logo: React.FC = () => (
  <div className="flex items-center gap-0 mb-10 select-none cursor-pointer">
    <svg width="180" height="42" viewBox="0 0 180 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20L15 27L28 8" stroke="#086481" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 20L25 32" stroke="black" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M15 20L25 10" stroke="black" strokeWidth="5.5" strokeLinecap="round" />
      <text x="32" y="32" fill="black" style={{ font: '700 30px Inter, sans-serif', letterSpacing: '-1.5px' }}>orrektum<tspan fill="black">.</tspan></text>
    </svg>
  </div>
);

const MONTHS = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
const DAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

type CalendarViewType = 'day' | 'week' | 'workweek' | 'month' | 'year';

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDocMenuOpen, setIsDocMenuOpen] = useState(false);
  const [activeDocSubTab, setActiveDocSubTab] = useState<DocumentSubTab>('library');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [chapters, setChapters] = useState<ISOChapter[]>(ISO_CHAPTERS);
  const [selectedStandard, setSelectedStandard] = useState<ISOStandard>('9001');

  const [creationForm, setCreationForm] = useState({
    name: '',
    folder: 'Allmänt',
    publish: false
  });

  const folders = ['Kvalitet', 'Miljö', 'Arbetsmiljö', 'HR', 'Ledning', 'Allmänt'];

  const [currentUser, setCurrentUser] = useState<User>({ 
    name: 'Rami Haasén', 
    email: 'rami@korrektum.se', 
    role: 'admin', 
    company: 'Korrektum AB',
    title: 'Kvalitetschef',
    phone: '0720232023',
    profileImage: '', 
    favoriteDocIds: ['doc1']
  });

  const [selectedDocument, setSelectedDocument] = useState<LinkedDocument | null>(null);
  const [isDocDetailOpen, setIsDocDetailOpen] = useState(false);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [docEditContent, setDocEditContent] = useState('');

  const [allDocuments, setAllDocuments] = useState<LinkedDocument[]>([
    { 
      id: 'doc1', 
      name: 'Rutin för avvikelsehantering', 
      type: 'rutin', 
      status: 'godkänd', 
      lastEdited: '2024-04-15', 
      owner: 'Rami Haasén',
      content: '# Rutin för avvikelsehantering\n\n## 1. Syfte\nSyftet med denna rutin är att säkerställa att alla avvikelser identifieras, dokumenteras och åtgärdas.\n\n## 2. Omfattning\nDenna rutin gäller för alla anställda på Korrektum AB.',
      version: '1.2',
      category: 'Kvalitet',
      folder: 'Kvalitet',
      history: [{ date: '2024-04-15', user: 'Rami Haasén', action: 'Godkänd', version: '1.2' }]
    },
    { 
      id: 'doc2', 
      name: 'Miljöpolicy 2024', 
      type: 'process', 
      status: 'utkast', 
      lastEdited: '2024-05-01', 
      owner: 'Rami Haasén',
      content: '# Miljöpolicy\n\nVi strävar efter att minimera vår miljöpåverkan...',
      version: '0.9',
      category: 'Miljö',
      folder: 'Miljö'
    },
    { id: 'doc3', name: 'Utbildningsplan HR', type: 'bilaga', status: 'godkänd', lastEdited: '2024-03-20', owner: 'Rami Haasén', category: 'HR', folder: 'HR' },
    { id: 'doc4', name: 'Brandskyddsinstruktion', type: 'instruktion', status: 'godkänd', lastEdited: '2024-02-10', owner: 'Sven Säkerhet', category: 'Säkerhet', folder: 'Allmänt' },
    { id: 'doc5', name: 'Ledningens genomgång - Protokoll', type: 'bilaga', status: 'godkänd', lastEdited: '2024-01-15', owner: 'Rami Haasén', category: 'Ledning', folder: 'Ledning' }
  ]);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarViewType>('month');
  const [calendarFilters, setCalendarFilters] = useState<string[]>(['Kvalitet', 'Miljö', 'Arbetsmiljö', 'Internrevisioner']);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState<string>('');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    { id: 'ev1', title: 'Internrevision 9001', date: '2025-05-15', startTime: '09:00', endTime: '12:00', type: 'revision', completed: false, recurrence: 'yearly', category: 'Internrevisioner' },
    { id: 'ev2', title: 'Ledningens genomgång', date: '2025-06-10', startTime: '13:00', endTime: '16:00', type: 'möte', completed: false, recurrence: 'quarterly', category: 'Kvalitet' },
    { id: 'ev3', title: 'Måluppföljning Q2', date: '2025-05-30', startTime: '10:00', endTime: '11:00', type: 'mätning', completed: false, recurrence: 'monthly', category: 'Kvalitet' }
  ]);

  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    title: currentUser.title || '',
    email: currentUser.email,
    phone: currentUser.phone || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    setProfileForm({
      name: currentUser.name,
      title: currentUser.title || '',
      email: currentUser.email,
      phone: currentUser.phone || ''
    });
  }, [currentUser.name, currentUser.title, currentUser.email, currentUser.phone]);

  const [processMap, setProcessMap] = useState<ProcessMap>({
    management: [{ id: 'm1', name: 'LEDNING & FÖRBÄTTRING', subProcesses: [], owner: 'Rami Haasén' }],
    main: [
      { id: 'p1', name: 'MARKNAD', subProcesses: [], owner: 'Anna Marknad' },
      { id: 'p2', name: 'SÄLJ', subProcesses: [], owner: 'Sven Sälj' },
      { id: 'p3', name: 'PRODUKTION', subProcesses: [], owner: 'Rami Haasén' },
      { id: 'p4', name: 'PRODUKTUTVECKLING', subProcesses: [], owner: 'Erik Utveckling' }
    ],
    support: [
      { id: 's1', name: 'HR & LÖN', subProcesses: [], owner: 'Rami Haasén' },
      { id: 's2', name: 'IT', subProcesses: [], owner: 'IT-Teamet' },
      { id: 's3', name: 'INKÖP & LEVERANTÖRER', subProcesses: [], owner: 'Rami Haasén' },
      { id: 's4', name: 'EKONOMI', subProcesses: [], owner: 'Ekonomi-avd' },
      { id: 's5', name: 'MILJÖ & SÄKERHET', subProcesses: [], owner: 'Rami Haasén' }
    ]
  });

  const [selectedProcess, setSelectedProcess] = useState<{ category: keyof ProcessMap; id: string } | null>(null);

  // Swimlanes state for the detailed view
  const [swimlanes, setSwimlanes] = useState<string[]>(['Marknad', 'Säljteam', 'Försäljningschef', 'R&D']);
  
  // Custom nodes state for the detailed map view
  const [mapNodes, setMapNodes] = useState<any[]>([
    { id: 'n1', name: 'Försäljningsmål', lane: 0, pos: 1, type: 'start' },
    { id: 'n2', name: 'Prospektering', lane: 0, pos: 3, type: 'step', hasDoc: true },
    { id: 'n3', name: '1:a kontakt', lane: 1, pos: 3, type: 'step' },
    { id: 'n4', name: 'Behovsanalys', lane: 1, pos: 5, type: 'step', hasDoc: true },
    { id: 'n5', name: 'Presentation & Proposition', lane: 1, pos: 7, type: 'step' },
    { id: 'n6', name: 'Förhandling & Avslut', lane: 2, pos: 8, type: 'step' },
    { id: 'n7', name: 'Eftermarknad & Relationer', lane: 0, pos: 12, type: 'step' },
    { id: 'n8', name: 'Utformning av lösning', lane: 3, pos: 5, type: 'step' },
    { id: 'n9', name: 'Orderhantering och installation', lane: 3, pos: 8, type: 'step' },
  ]);

  const [myIncidents] = useState<Incident[]>([
    { id: 'inc1', type: 'deviation', title: 'Maskinhaveri linje 4', description: 'Givare trasig', date: '2024-05-10', reporter: 'Erik', responsible: 'Rami Haasén', status: 'investigating', deadline: '2024-05-20' },
    { id: 'inc2', type: 'improvement', title: 'Energibesparingsförslag', description: 'Byta till LED i hall B', date: '2024-05-12', reporter: 'Anna', responsible: 'Rami Haasén', status: 'open', deadline: '2024-06-01' }
  ]);

  const [productNews] = useState<ProductNews[]>([
    { id: 'n1', title: 'Ny modul: Riskmodul 2.0', date: '2024-05-01', content: 'Nu kan du visualisera risker i värmekartor.', isRead: false },
    { id: 'n2', title: 'Förbättrad AI-sök', date: '2024-04-20', content: 'AI-experten kan nu läsa dina uppladdade PDF-filer.', isRead: true }
  ]);

  const [manuals] = useState<Manual[]>([
    { id: 'm1', title: 'Kom igång med Processkartan', category: 'Navigering', url: '#' },
    { id: 'm2', title: 'Skapa din första avvikelse', category: 'Ärenden', url: '#' },
    { id: 'm3', title: 'Hantera lagkrav effektivt', category: 'Lagar', url: '#' }
  ]);

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([
    { id: 's1', name: 'Kunder', requirements: 'Hög leveransprecision, kvalitetscertifikat', influence: 'hög' },
    { id: 's2', name: 'Medarbetare', requirements: 'Säker arbetsmiljö, tydliga rutiner', influence: 'hög' },
    { id: 's3', name: 'Myndigheter', requirements: 'Efterlevnad av lagar, miljörapportering', influence: 'medel' }
  ]);

  const [risks, setRisks] = useState<RiskItem[]>([
    { id: 'r1', category: 'Produktion', description: 'Maskinhaveri linje 4', probability: 2, impact: 4, mitigation: 'Förebyggande underhåll varje månad', owner: 'Rami Haasén' },
    { id: 'r2', category: 'IT', description: 'Dataintrång', probability: 1, impact: 5, mitigation: 'Brandvägg, 2FA, backup', owner: 'IT-Teamet' }
  ]);

  const [objectives, setObjectives] = useState<Objective[]>([
    { id: 'o1', title: 'Minska reklamationer', target: '< 1%', progress: 65, deadline: '2024-12-31' },
    { id: 'o2', title: 'Minska elförbrukning', target: '-10%', progress: 30, deadline: '2024-12-31' }
  ]);

  const [competence, setCompetence] = useState<CompetenceRecord[]>([
    { id: 'c1', employee: 'Rami Haasén', role: 'Kvalitetschef', training: [{ name: 'ISO 9001 Internrevisor', status: 'klar' }, { name: 'HLR', status: 'planerad' }] },
    { id: 'c2', employee: 'Erik Svensson', role: 'Produktionsledare', training: [{ name: 'Säkra lyft', status: 'klar' }] }
  ]);

  const [laws, setLaws] = useState<LawRequirement[]>([
    { id: 'l1', title: 'Miljöbalken', category: 'Miljö', status: 'efterlevs', lastReview: '2024-01-10' },
    { id: 'l2', title: 'Arbetsmiljölagen', category: 'Arbetsmiljö', status: 'delvis', lastReview: '2024-02-15' }
  ]);

  const [templatePrompt, setTemplatePrompt] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState('');

  const [messages, setMessages] = useState<Message[]>([{ id: '1', user: 'System', text: 'Välkommen till SafeQMS!', timestamp: '09:00' }]);
  const [isAiConsultant, setIsAiConsultant] = useState(false);
  const [aiPanel, setAiPanel] = useState({ isOpen: false, content: '', title: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [profileTab, setProfileTab] = useState<'info' | 'security' | 'tasks' | 'news' | 'manuals'>('info');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); setIsLoggedIn(true); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentUser(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setCurrentUser(prev => ({
      ...prev,
      name: profileForm.name,
      title: profileForm.title,
      email: profileForm.email,
      phone: profileForm.phone
    }));
    alert('Dina uppgifter har sparats!');
  };

  const handleOpenDoc = (doc: LinkedDocument) => {
    setSelectedDocument(doc);
    setDocEditContent(doc.content || '');
    setIsDocDetailOpen(true);
    setIsEditingDoc(false);
  };

  const handleSaveDoc = () => {
    if (!selectedDocument) return;
    
    const updatedDoc: LinkedDocument = {
      ...selectedDocument,
      content: docEditContent,
      lastEdited: new Date().toISOString().split('T')[0],
      status: 'utkast',
      version: (parseFloat(selectedDocument.version || '0.0') + 0.1).toFixed(1),
      history: [
        ...(selectedDocument.history || []),
        { 
          date: new Date().toISOString().split('T')[0], 
          user: currentUser.name, 
          action: 'Uppdaterad', 
          version: (parseFloat(selectedDocument.version || '0.0') + 0.1).toFixed(1) 
        }
      ]
    };

    setAllDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    setSelectedDocument(updatedDoc);
    setIsEditingDoc(false);
  };

  const handleAiImproveDoc = async () => {
    if (!selectedDocument) return;
    setIsLoading(true);
    const prompt = `Förbättra följande dokumentinnehåll för att bättre uppfylla ISO-krav. Behåll Markdown-formatering:\n\n${docEditContent}`;
    const improved = await askISOConsultant(prompt, []);
    if (improved) {
      setDocEditContent(improved);
    }
    setIsLoading(false);
  };

  const handleApproveDoc = () => {
    if (!selectedDocument) return;
    
    const updatedDoc: LinkedDocument = {
      ...selectedDocument,
      status: 'godkänd',
      approver: currentUser.name,
      lastEdited: new Date().toISOString().split('T')[0],
      history: [
        ...(selectedDocument.history || []),
        { 
          date: new Date().toISOString().split('T')[0], 
          user: currentUser.name, 
          action: 'Godkänd', 
          version: selectedDocument.version || '1.0' 
        }
      ]
    };

    setAllDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    setSelectedDocument(updatedDoc);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('De nya lösenorden matchar inte varandra.');
      return;
    }
    alert('Lösenordet har uppdaterats framgångsrikt!');
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.message as HTMLInputElement;
    const text = input.value;
    if (!text) return;

    const userMsg = { id: Date.now().toString(), user: currentUser.name, text, timestamp: 'Nu' };
    setMessages(prev => [...prev, userMsg]);
    input.value = '';

    if (isAiConsultant) {
      setIsLoading(true);
      const advice = await askISOConsultant(text, messages);
      const aiMsg = { id: Date.now().toString(), user: 'ISO-AI Konsult', text: advice, timestamp: 'Nu' };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }
  };

  const filteredDocs = useMemo(() => {
    let list = allDocuments;
    if (searchQuery) {
      list = list.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedFolder) {
      list = list.filter(d => d.folder === selectedFolder);
    }
    if (activeDocSubTab === 'mine') {
      list = list.filter(d => d.owner === currentUser.name);
    }
    return list;
  }, [allDocuments, searchQuery, selectedFolder, activeDocSubTab, currentUser.name]);

  const handleAiDraftGenerator = async () => {
    if (!creationForm.name) return alert("Ange ett namn på dokumentet först.");
    setIsLoading(true);
    const draft = await generateISOTemplate(creationForm.name, selectedStandard);
    setAiPanel({ isOpen: true, title: `AI-Utkast: ${creationForm.name}`, content: draft });
    setIsLoading(false);
  };

  const handleAiSummary = async (doc: LinkedDocument) => {
    setIsLoading(true);
    const summary = await askISOConsultant(`Sammanfatta syftet med "${doc.name}"...`, []);
    setAiPanel({ isOpen: true, title: `AI-Analys: ${doc.name}`, content: summary });
    setIsLoading(false);
  };

  const showDocumentDetails = (docId: string) => {
    const doc = allDocuments.find(d => d.id === docId);
    if (doc) handleOpenDoc(doc);
  };

  const toggleFavoriteDoc = (docId: string) => {
    setCurrentUser(prev => {
      const isFav = prev.favoriteDocIds.includes(docId);
      return {
        ...prev,
        favoriteDocIds: isFav 
          ? prev.favoriteDocIds.filter(id => id !== docId)
          : [...prev.favoriteDocIds, docId]
      };
    });
  };

  const handleCalendarNav = (direction: number) => {
    const newDate = new Date(currentCalendarDate);
    if (calendarView === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (calendarView === 'week' || calendarView === 'workweek') newDate.setDate(newDate.getDate() + (direction * 7));
    else if (calendarView === 'day') newDate.setDate(newDate.getDate() + direction);
    else if (calendarView === 'year') newDate.setFullYear(newDate.getFullYear() + direction);
    setCurrentCalendarDate(newDate);
  };

  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent = { ...event, id: `ev-${Date.now()}` };
    setCalendarEvents(prev => [...prev, newEvent]);
    setIsEventModalOpen(false);
  };

  // --- Calendar Helpers ---
  const generateCalendarDays = useCallback(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);
    
    // Adjusted for Monday start (Swedish standard)
    const adjustedFirstDay = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days = [];

    // Prev month days
    for (let i = adjustedFirstDay; i > 0; i--) {
      days.push({
        day: prevMonthLastDay - i + 1,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        currentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        currentMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        currentMonth: false
      });
    }
    return days;
  }, [currentCalendarDate]);

  const visibleDays = useMemo(() => {
    const allDays = generateCalendarDays();
    if (calendarView === 'month') return allDays;
    
    // For week/workweek/day, we find the current date in the generated days
    const todayIndex = allDays.findIndex(d => 
      d.day === currentCalendarDate.getDate() && 
      d.month === currentCalendarDate.getMonth() && 
      d.year === currentCalendarDate.getFullYear()
    );

    if (calendarView === 'day') {
      return todayIndex !== -1 ? [allDays[todayIndex]] : [allDays[0]];
    }

    if (calendarView === 'week' || calendarView === 'workweek') {
      // Find the start of the week (Monday)
      // generateCalendarDays already starts with Monday if it's the first day of the grid
      // But we need the week containing currentCalendarDate
      const dayOfWeek = currentCalendarDate.getDay(); // 0 is Sunday
      const diff = currentCalendarDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(currentCalendarDate);
      monday.setDate(diff);
      
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDays.push({
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          currentMonth: d.getMonth() === currentCalendarDate.getMonth()
        });
      }
      
      if (calendarView === 'workweek') return weekDays.slice(0, 5);
      return weekDays;
    }

    return allDays;
  }, [calendarView, currentCalendarDate, generateCalendarDays]);

  const myDashboardTasks = useMemo(() => {
    return myIncidents.filter(inc => inc.responsible === currentUser.name && inc.status !== 'closed');
  }, [myIncidents, currentUser.name]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return calendarEvents
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [calendarEvents]);

  // Standard chapters for High Level Structure
  const getISOChapters = (standard: ISOStandard): ISOChapter[] => {
    return ISO_CHAPTERS.map(ch => ({
      ...ch,
      standard: standard,
      completed: false 
    }));
  };

  const openAiAdvice = async (chapter: ISOChapter) => {
    setIsLoading(true);
    setAiPanel({ isOpen: true, title: `ISO ${chapter.standard} - Kapitel ${chapter.number}`, content: 'Hämtar råd för att uppfylla kraven...' });
    const advice = await getISOAdvice(chapter.number, chapter.standard);
    setAiPanel({ isOpen: true, title: `Kravanalys: ${chapter.title}`, content: advice || 'Kunde inte hämta råd just nu.' });
    setIsLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center">
            <div className="flex justify-center mb-10"><Logo /></div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-8">Logga in i SafeQMS</h1>
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <input type="email" required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="E-post" defaultValue="rami@korrektum.se" />
              <input type="password" required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Lösenord" defaultValue="password" />
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 shadow-xl transition-all uppercase tracking-widest text-sm">Logga in</button>
            </form>
            <p className="mt-8 text-xs text-slate-400 font-bold uppercase tracking-widest cursor-pointer hover:text-blue-600">Glömt lösenord?</p>
        </div>
      </div>
    );
  }

  const currentSelectedProc = selectedProcess ? processMap[selectedProcess.category].find(p => p.id === selectedProcess.id) : null;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 p-8 flex flex-col hidden lg:flex">
        <Logo />
        
        <div 
          onClick={() => {
            setActiveTab('profile');
            setSelectedProcess(null); 
          }}
          className={`flex items-center gap-4 p-4 rounded-[2rem] cursor-pointer transition-all border mb-8 group ${activeTab === 'profile' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center overflow-hidden border border-slate-200 group-hover:scale-105 transition-transform shrink-0">
             {currentUser.profileImage ? (
               <img src={currentUser.profileImage} className="w-full h-full object-cover" alt="Profile" />
             ) : (
               <UserIcon size={24} className={activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'} />
             )}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black truncate">{currentUser.name}</p>
            <p className={`text-[9px] font-bold uppercase tracking-widest truncate ${activeTab === 'profile' ? 'text-blue-100' : 'text-slate-400'}`}>{currentUser.title}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1">
          <SidebarItem icon={<LayoutDashboard size={16}/>} label="Översikt" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSelectedProcess(null); }} />
          
          <div className="pt-6 pb-2 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Dokumentation</div>
          <div className="relative">
            <SidebarItem 
              icon={<Files size={16}/>} 
              label="Dokument" 
              active={activeTab === 'documents'} 
              onClick={() => {
                setActiveTab('documents');
                setIsDocMenuOpen(!isDocMenuOpen);
              }} 
              hasDropdown
              isOpen={isDocMenuOpen}
            />
            {isDocMenuOpen && activeTab === 'documents' && (
              <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-100 pl-4 animate-in slide-in-from-top-2 duration-200">
                <button onClick={() => setActiveDocSubTab('mine')} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeDocSubTab === 'mine' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Mina dokument</button>
                <button onClick={() => setActiveDocSubTab('search')} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeDocSubTab === 'search' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Sök i dokument</button>
                <button onClick={() => setActiveDocSubTab('manage')} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeDocSubTab === 'manage' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Hantera</button>
                <button onClick={() => setActiveDocSubTab('links')} className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeDocSubTab === 'links' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Kopplade dokument</button>
              </div>
            )}
          </div>

          <div className="pt-6 pb-2 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Planering</div>
          <SidebarItem icon={<CalendarIcon size={16}/>} label="Årshjul" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <SidebarItem icon={<Users size={16}/>} label="Intressenter" active={activeTab === 'stakeholders'} onClick={() => setActiveTab('stakeholders')} />
          <SidebarItem icon={<ShieldCheck size={16}/>} label="Riskhantering" active={activeTab === 'risks'} onClick={() => setActiveTab('risks')} />
          
          <div className="pt-6 pb-2 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Kvalitet</div>
          <SidebarItem icon={<BookOpen size={16}/>} label="Standarder" active={activeTab === 'standards'} onClick={() => setActiveTab('standards')} />
          <SidebarItem icon={<ClipboardList size={16}/>} label="Rondering" active={activeTab === 'rondering'} onClick={() => setActiveTab('rondering')} />
          <SidebarItem icon={<GraduationCap size={16}/>} label="Kompetens" active={activeTab === 'competence'} onClick={() => setActiveTab('competence')} />
          
          <div className="pt-6 pb-2 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Uppföljning</div>
          <SidebarItem icon={<Target size={16}/>} label="Mål & KPI" active={activeTab === 'objectives'} onClick={() => setActiveTab('objectives')} />
          <SidebarItem icon={<AlertTriangle size={16}/>} label="Ärenden" active={activeTab === 'incidents'} onClick={() => setActiveTab('incidents')} />
          <SidebarItem icon={<Gavel size={16}/>} label="Lagar & Krav" active={activeTab === 'laws'} onClick={() => setActiveTab('laws')} />
          
          <div className="pt-6 pb-2 px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Verktyg</div>
          <SidebarItem icon={<MessageSquare size={16}/>} label="Chatt" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <SidebarItem icon={<FileText size={16}/>} label="AI Mallar" active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto max-h-screen">
        {activeTab === 'dashboard' && !selectedProcess && (
          <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header className="flex justify-between items-end mb-10 border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Översikt</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{currentUser.company} | Dashboard</p>
               </div>
               <div className="flex gap-4">
                  <div className="bg-white px-6 py-3 rounded-2xl border flex items-center gap-3 shadow-sm">
                     <Clock size={18} className="text-blue-600" />
                     <span className="text-[10px] font-black uppercase text-slate-600">Idag: {new Date().toLocaleDateString('sv-SE')}</span>
                  </div>
               </div>
            </header>

            {/* 1. PROCESS MAP (TOP) */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                   <GitBranch size={24} className="text-blue-600" />
                   Företagets Processkarta
                 </h3>
              </div>
              <div className="space-y-10">
                <div className="relative p-8 rounded-[3rem] border-2 border-slate-100 bg-gradient-to-br from-white to-yellow-50/20 shadow-inner text-center">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border rounded-full">Ledningsprocesser</div>
                  <div className="flex justify-center flex-wrap gap-4">
                    {processMap.management.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedProcess({ category: 'management', id: p.id })}
                        className={`w-80 h-24 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-[2rem] shadow-xl flex flex-col items-center justify-center transition-all border-4 relative active:scale-95 ${p.owner === currentUser.name ? 'border-blue-600 shadow-blue-100 ring-4 ring-blue-50/30' : 'border-yellow-300'}`}
                      >
                        <span className="font-black text-lg tracking-tighter text-center leading-tight uppercase">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative p-8 rounded-[3rem] border-2 border-slate-100 bg-gradient-to-br from-white to-blue-50/20 shadow-inner">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border rounded-full">Huvudprocesser</div>
                  <div className="flex items-center justify-center flex-wrap gap-4 px-2">
                    {processMap.main.map((p, idx) => (
                      <React.Fragment key={p.id}>
                        <button 
                          onClick={() => setSelectedProcess({ category: 'main', id: p.id })}
                          className={`min-w-[180px] px-6 h-28 bg-blue-300 hover:bg-blue-400 text-slate-900 rounded-[2rem] shadow-xl flex flex-col items-center justify-center transition-all border-2 relative group active:scale-95 ${p.owner === currentUser.name ? 'border-blue-600 bg-blue-400 ring-4 ring-blue-50/30' : 'border-blue-400'}`}
                        >
                          <span className="font-black text-sm tracking-tight text-center leading-snug uppercase">{p.name}</span>
                        </button>
                        {idx < processMap.main.length - 1 && <ArrowRight className="text-slate-200 shrink-0 hidden md:block" size={20} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CERTIFIERINGSRESA */}
            <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-3 mb-10">
                    <Trophy size={24} className="text-yellow-400" />
                    Vår Certifieringsresa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                     {[
                       { std: '9001', prog: 75, color: 'bg-blue-500' },
                       { std: '14001', prog: 35, color: 'bg-emerald-500' },
                       { std: '45001', prog: 15, color: 'bg-red-500' }
                     ].map(item => (
                       <div key={item.std} className="space-y-4">
                          <div className="flex justify-between items-end">
                             <span className="text-lg font-black tracking-tight uppercase">ISO {item.std}</span>
                             <span className="text-sm font-black text-slate-400">{item.prog}%</span>
                          </div>
                          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                             <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.prog}%` }}></div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* 3. MINA DEADLINES */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl relative overflow-hidden">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                    <Activity size={24} className="text-blue-600" />
                    Mina Aktuella Uppdrag & Deadlines
                  </h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myDashboardTasks.map(inc => (
                    <div key={inc.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group/task hover:bg-white hover:shadow-lg transition-all hover:border-blue-200">
                       <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-2xl ${inc.type === 'deviation' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                             <AlertTriangle size={24}/>
                          </div>
                          <div>
                             <p className="font-black text-base text-slate-800 uppercase tracking-tight leading-tight">{inc.title}</p>
                             <div className="flex gap-4 mt-1">
                               <p className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1"><Clock size={12}/> Deadline: {inc.deadline}</p>
                             </div>
                          </div>
                       </div>
                       <button className="bg-white border-2 border-slate-100 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">Öppna</button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* --- ÅRSHJUL (OUTLOOK INSPIRED) --- */}
        {activeTab === 'calendar' && (
          <div className="h-[calc(100vh-80px)] max-w-[1600px] mx-auto flex flex-col animate-in fade-in duration-500 overflow-hidden">
            {/* Header / Toolbar */}
            <header className="flex items-center justify-between bg-white border border-slate-200 rounded-t-[2rem] p-4 shadow-sm">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleCalendarNav(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentCalendarDate(new Date())} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">IDAG</button>
                    <button onClick={() => handleCalendarNav(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    {MONTHS[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                  </h3>
               </div>
               
               <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border">
                  {[
                    { id: 'day', label: 'Dag' },
                    { id: 'workweek', label: 'Arbetsvecka' },
                    { id: 'week', label: 'Vecka' },
                    { id: 'month', label: 'Månad' }
                  ].map(view => (
                    <button 
                      key={view.id} 
                      onClick={() => setCalendarView(view.id as any)}
                      className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${calendarView === view.id ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {view.label}
                    </button>
                  ))}
               </div>

               <div className="flex items-center gap-3">
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Printer size={20}/></button>
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Search size={20}/></button>
                  <button 
                    onClick={() => {
                      setNewEventDate(new Date().toISOString().split('T')[0]);
                      setIsEventModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Plus size={16}/> Ny Aktivitet
                  </button>
               </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden bg-white border-x border-b border-slate-200 rounded-b-[2rem] shadow-sm">
               {/* Left Sidebar Pane */}
               <aside className="w-80 border-r border-slate-200 p-6 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
                  {/* Mini Calendar View */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{MONTHS[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}</span>
                        <div className="flex gap-1">
                          <button onClick={() => handleCalendarNav(-1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronLeft size={14}/></button>
                          <button onClick={() => handleCalendarNav(1)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronRight size={14}/></button>
                        </div>
                     </div>
                     <div className="grid grid-cols-7 gap-1 text-center">
                        {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map(d => <span key={d} className="text-[8px] font-black text-slate-300 uppercase">{d}</span>)}
                        {generateCalendarDays().slice(0, 31).map((d, i) => (
                          <div 
                            key={i} 
                            onClick={() => setCurrentCalendarDate(new Date(d.year, d.month, d.day))}
                            className={`p-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${d.day === currentCalendarDate.getDate() && d.month === currentCalendarDate.getMonth() ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            {d.day}
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Calendar Categories / Filters */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Mina Kalendrar</h4>
                      <div className="space-y-3">
                          {[
                            { id: 'Kvalitet', name: 'ISO 9001 Kvalitet', color: 'bg-blue-500' },
                            { id: 'Miljö', name: 'ISO 14001 Miljö', color: 'bg-emerald-500' },
                            { id: 'Arbetsmiljö', name: 'ISO 45001 Arbetsmiljö', color: 'bg-red-500' },
                            { id: 'Internrevisioner', name: 'Internrevisioner', color: 'bg-amber-500' }
                          ].map(cal => (
                            <label key={cal.id} className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative">
                                 <input 
                                   type="checkbox" 
                                   checked={calendarFilters.includes(cal.id)}
                                   onChange={(e) => {
                                     if (e.target.checked) setCalendarFilters(prev => [...prev, cal.id]);
                                     else setCalendarFilters(prev => prev.filter(f => f !== cal.id));
                                   }}
                                   className="peer sr-only" 
                                 />
                                 <div className={`w-5 h-5 rounded-lg border-2 border-slate-200 transition-all peer-checked:border-none ${calendarFilters.includes(cal.id) ? cal.color : ''} flex items-center justify-center`}>
                                    <Check size={12} className={`text-white transition-transform ${calendarFilters.includes(cal.id) ? 'scale-100' : 'scale-0'}`} />
                                 </div>
                              </div>
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-900">{cal.name}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
               </aside>

               {/* Main Calendar View Pane */}
               <section className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
                  {/* Days Header */}
                  <div className={`grid border-b border-slate-200 bg-white ${
                    calendarView === 'day' ? 'grid-cols-1' : 
                    calendarView === 'workweek' ? 'grid-cols-5' : 
                    'grid-cols-7'
                  }`}>
                    {(calendarView === 'day' 
                      ? [(['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'])[currentCalendarDate.getDay()]]
                      : calendarView === 'workweek'
                        ? ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag']
                        : ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
                    ).map(day => (
                      <div key={day} className="py-4 text-center border-r border-slate-100 last:border-r-0">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                      </div>
                    ))}
                  </div>

                  {/* The Grid */}
                  <div className={`flex-1 grid auto-rows-fr overflow-y-auto custom-scrollbar ${
                    calendarView === 'day' ? 'grid-cols-1' : 
                    calendarView === 'workweek' ? 'grid-cols-5' : 
                    'grid-cols-7'
                  }`}>
                     {visibleDays.map((date, idx) => {
                       const formattedDate = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                       const dayEvents = calendarEvents.filter(e => 
                         e.date === formattedDate && 
                         (!e.category || calendarFilters.includes(e.category))
                       );
                       const isToday = date.day === new Date().getDate() && date.month === new Date().getMonth() && date.year === new Date().getFullYear();

                       return (
                         <div 
                           key={idx} 
                           className={`min-h-[140px] p-2 border-r border-b border-slate-100 transition-all group hover:bg-white flex flex-col gap-1 ${date.currentMonth ? 'bg-white' : 'bg-slate-50/50'}`}
                         >
                           <div className="flex justify-between items-start">
                             <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-black transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-slate-900'}`}>
                               {date.day}
                             </span>
                             <button 
                               onClick={() => {
                                 setNewEventDate(formattedDate);
                                 setIsEventModalOpen(true);
                               }}
                               className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"
                             >
                               <Plus size={14} />
                             </button>
                           </div>
                           
                           {/* Render Events */}
                           <div className="flex-1 space-y-1.5 overflow-hidden">
                             {dayEvents.map(event => (
                               <div 
                                 key={event.id} 
                                 className={`p-2 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-sm border-l-4 truncate cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                   event.type === 'revision' ? 'bg-amber-50 text-amber-700 border-amber-500' :
                                   event.type === 'mätning' ? 'bg-blue-50 text-blue-700 border-blue-500' :
                                   'bg-emerald-50 text-emerald-700 border-emerald-500'
                                 }`}
                               >
                                 <div className="flex justify-between items-start mb-0.5">
                                    <span>{event.startTime}</span>
                                    {event.completed && <Check size={10} />}
                                 </div>
                                 <div className="truncate">{event.title}</div>
                               </div>
                             ))}
                           </div>
                         </div>
                       );
                     })}
                  </div>
               </section>
            </div>
          </div>
        )}

        {/* EVENT MODAL */}
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ny Aktivitet</h3>
                <button onClick={() => setIsEventModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"><X size={20}/></button>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addCalendarEvent({
                    title: formData.get('title') as string,
                    date: formData.get('date') as string,
                    startTime: formData.get('startTime') as string,
                    endTime: formData.get('endTime') as string,
                    type: formData.get('type') as any,
                    category: formData.get('category') as string,
                    completed: false,
                    recurrence: formData.get('recurrence') as any
                  });
                }}
                className="p-8 space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titel</label>
                  <input name="title" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold" placeholder="T.ex. Internrevision" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                    <select name="category" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold">
                      <option value="Kvalitet">ISO 9001 Kvalitet</option>
                      <option value="Miljö">ISO 14001 Miljö</option>
                      <option value="Arbetsmiljö">ISO 45001 Arbetsmiljö</option>
                      <option value="Internrevisioner">Internrevisioner</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Typ</label>
                    <select name="type" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold">
                      <option value="revision">Revision</option>
                      <option value="rond">Rond</option>
                      <option value="möte">Möte</option>
                      <option value="utbildning">Utbildning</option>
                      <option value="mätning">Mätning</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Datum</label>
                    <input name="date" type="date" defaultValue={newEventDate} required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Återkommande</label>
                    <select name="recurrence" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold">
                      <option value="none">Ingen</option>
                      <option value="monthly">Månadsvis</option>
                      <option value="quarterly">Kvartalsvis</option>
                      <option value="yearly">Årsvis</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starttid</label>
                    <input name="startTime" type="time" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sluttid</label>
                    <input name="endTime" type="time" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsEventModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Avbryt</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Spara Aktivitet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STAKEHOLDERS TAB */}
        {activeTab === 'stakeholders' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Intressenter</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Krav och förväntningar från omvärlden</p>
               </div>
               <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                 <Plus size={16}/> Ny Intressent
               </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stakeholders.map(s => (
                <Card key={s.id} title={s.name} action={<span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${s.influence === 'hög' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{s.influence} inflytande</span>}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Krav & Förväntningar</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed mb-6">{s.requirements}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-slate-50 border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100">Redigera</button>
                    <button className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* RISKS TAB */}
        {activeTab === 'risks' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Riskhantering</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Identifiera och minimera verksamhetsrisker</p>
               </div>
               <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                 <Plus size={16}/> Ny Risk
               </button>
            </header>
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Beskrivning</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sannolikhet</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Konsekvens</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Åtgärd</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ansvarig</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {risks.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase">{r.category}</span></td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-700">{r.description}</td>
                      <td className="px-8 py-6 text-center"><span className={`w-8 h-8 inline-flex items-center justify-center rounded-lg font-black text-xs ${r.probability > 3 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{r.probability}</span></td>
                      <td className="px-8 py-6 text-center"><span className={`w-8 h-8 inline-flex items-center justify-center rounded-lg font-black text-xs ${r.impact > 3 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{r.impact}</span></td>
                      <td className="px-8 py-6 text-sm font-medium text-slate-500">{r.mitigation}</td>
                      <td className="px-8 py-6 text-xs font-black uppercase text-slate-400">{r.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OBJECTIVES TAB */}
        {activeTab === 'objectives' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Mål & KPI</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Strategiska mål och mätbara resultat</p>
               </div>
               <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                 <Plus size={16}/> Nytt Mål
               </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {objectives.map(o => (
                <Card key={o.id} title={o.title} action={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline: {o.deadline}</span>}>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{o.target}</span>
                    <span className="text-sm font-black text-blue-600">{o.progress}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${o.progress}%` }}></div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Uppdatera</button>
                    <button className="px-6 py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Historik</button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === 'incidents' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Ärendehantering</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Avvikelser, olyckor och förbättringsförslag</p>
               </div>
               <div className="flex gap-3">
                  <button className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg flex items-center gap-2">
                    <AlertTriangle size={16}/> Ny Avvikelse
                  </button>
                  <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2">
                    <Plus size={16}/> Nytt Förbättringsförslag
                  </button>
               </div>
            </header>
            <div className="space-y-4">
              {myIncidents.map(inc => (
                <div key={inc.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-8">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${inc.type === 'deviation' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      <AlertTriangle size={32}/>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${inc.type === 'deviation' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{inc.type === 'deviation' ? 'Avvikelse' : 'Förbättring'}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inc.date}</span>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{inc.title}</h4>
                      <p className="text-sm font-medium text-slate-500 mt-1">{inc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ansvarig</p>
                      <p className="text-xs font-bold text-slate-800 uppercase">{inc.responsible}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <span className="px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase">{inc.status}</span>
                    </div>
                    <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95">Hantera</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LAWS TAB */}
        {activeTab === 'laws' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Lagar & Krav</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Lagbevakning och regelefterlevnad</p>
               </div>
               <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2">
                 <Search size={16}/> Sök i Laglista
               </button>
            </header>
            <div className="grid grid-cols-1 gap-4">
              {laws.map(l => (
                <div key={l.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center justify-between hover:shadow-lg transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border"><Gavel size={24}/></div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{l.category}</span>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{l.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Senast granskad: {l.lastReview}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${l.status === 'efterlevs' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span>
                    <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><ExternalLink size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-500">
            <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
               <div className="flex items-center gap-4">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Samarbete</h2>
                  <div className="flex bg-slate-100 p-1 rounded-xl border">
                    <button onClick={() => setIsAiConsultant(false)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isAiConsultant ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Team</button>
                    <button onClick={() => setIsAiConsultant(true)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isAiConsultant ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>ISO-AI</button>
                  </div>
               </div>
            </header>
            <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar bg-slate-50/30">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.user === currentUser.name ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-6 rounded-[2rem] shadow-sm ${m.user === currentUser.name ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none'}`}>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">{m.user}</p>
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                      <p className="text-[9px] font-black text-right mt-3 opacity-40">{m.timestamp}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border p-6 rounded-[2rem] rounded-bl-none flex gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-8 bg-white border-t">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input name="message" autoComplete="off" className="flex-1 px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-2 focus:ring-blue-600 font-medium" placeholder={isAiConsultant ? "Ställ en fråga till ISO-experten..." : "Skriv ett meddelande till teamet..."} />
                  <button type="submit" className="bg-blue-600 text-white p-5 rounded-[1.5rem] hover:bg-blue-700 shadow-lg transition-all active:scale-90">
                    <Send size={24}/>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">AI Dokumentmallar</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Generera ISO-anpassade dokument på sekunder</p>
               </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card title="Dokument-Generator">
                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed italic">Beskriv dokumentet du behöver för ISO {selectedStandard}, t.ex. "Miljöpolicy" eller "Rutin för internrevision".</p>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ämne / Titel</label>
                    <input 
                      value={templatePrompt}
                      onChange={(e) => setTemplatePrompt(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold" 
                      placeholder="t.ex. Kvalitetsmål 2024" 
                    />
                  </div>
                  <button 
                    disabled={isLoading || !templatePrompt}
                    onClick={async () => {
                      setIsLoading(true);
                      const res = await generateISOTemplate(templatePrompt, selectedStandard);
                      setGeneratedTemplate(res || '');
                      setIsLoading(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>}
                    Skapa ISO-Mall
                  </button>
                </div>
              </Card>
              <Card title="Förhandsgranskning" action={<button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ladda ner PDF</button>}>
                <div className="bg-slate-50 p-8 rounded-[2rem] min-h-[500px] border border-slate-100 overflow-y-auto max-h-[600px] custom-scrollbar prose prose-slate max-w-none">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                      <Loader2 className="animate-spin text-blue-600" size={40}/>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI arbetar...</p>
                    </div>
                  ) : generatedTemplate ? (
                    <Markdown>{generatedTemplate}</Markdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4 opacity-30">
                      <FileText size={48}/>
                      <p className="text-sm font-bold uppercase tracking-widest">Ingen mall genererad ännu</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">
                    {activeDocSubTab === 'library' ? 'Dokumentbibliotek' : 
                     activeDocSubTab === 'templates' ? 'Mallbibliotek' : 
                     activeDocSubTab === 'creation' ? 'Skapa Nytt Dokument' : 'Dokumentdetaljer'}
                  </h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Digital Ledningsdokumentation</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setActiveDocSubTab('creation')} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                    <FilePlus size={18}/> Nytt Dokument
                  </button>
               </div>
            </header>

            {/* Sub-navigation */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border w-fit shadow-sm">
               {[
                 { id: 'library', label: 'Bibliotek', icon: <Folders size={14}/> },
                 { id: 'templates', label: 'Mallar', icon: <FileText size={14}/> },
                 { id: 'creation', label: 'Skapa Nytt', icon: <Sparkles size={14}/> }
               ].map(tab => (
                 <button 
                  key={tab.id} 
                  onClick={() => setActiveDocSubTab(tab.id as any)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeDocSubTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                   {tab.icon} {tab.label}
                 </button>
               ))}
            </div>

            {/* Biblioteksvyn */}
            {activeDocSubTab === 'library' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Mapp-navigering */}
                <div className="lg:col-span-1 space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <FolderOpen size={14}/> Mapper
                  </h4>
                  <button onClick={() => setSelectedFolder(null)} className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${!selectedFolder ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border text-slate-500 hover:bg-slate-100'}`}>
                    <span>Alla Dokument</span>
                    <span className="opacity-40">{allDocuments.length}</span>
                  </button>
                  {folders.map(f => (
                    <button key={f} onClick={() => setSelectedFolder(f)} className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedFolder === f ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border text-slate-500 hover:bg-slate-100'}`}>
                      <span>{f}</span>
                      <span className="opacity-40">{allDocuments.filter(d => d.folder === f).length}</span>
                    </button>
                  ))}
                </div>

                {/* Dokumentlista */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-3xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 shadow-sm" placeholder="Sök i biblioteket..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Namn</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Åtgärder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDocs.map(doc => (
                          <tr key={doc.id} onClick={() => showDocumentDetails(doc.id)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl shadow-sm ${doc.type === 'rutin' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  <FileText size={20}/>
                                </div>
                                <div>
                                  <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{doc.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{doc.folder}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleAiSummary(doc as any); }} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"><Bot size={14}/> AI Analys</button>
                                <button className="p-2 hover:bg-white rounded-lg border text-slate-400 hover:text-blue-600 transition-all shadow-sm"><Eye size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Skapa Nytt Dokument (AI-fokus) */}
            {activeDocSubTab === 'creation' && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-gradient-to-r from-indigo-900 to-blue-900 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                   <div className="relative z-10 flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center backdrop-blur-md">
                         <Sparkles size={32} className="text-blue-300 animate-pulse"/>
                      </div>
                      <div>
                         <h4 className="text-lg font-black uppercase tracking-tight">AI-Assisterat Skapande</h4>
                         <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Generera utkast och få smarta förslag</p>
                      </div>
                   </div>
                   <button onClick={handleAiDraftGenerator} className="relative z-10 bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">Generera Utkast</button>
                </div>

                <Card title="Dokumentdetaljer" className="p-10">
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dokumentets Namn</label>
                          <input className="w-full p-5 bg-slate-50 border rounded-2xl font-bold outline-none" placeholder="t.ex. Rutin för Onboarding" value={creationForm.name} onChange={(e) => setCreationForm({...creationForm, name: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Kategori / Mapp</label>
                          <select className="w-full p-5 bg-slate-50 border rounded-2xl font-bold outline-none" value={creationForm.folder} onChange={(e) => setCreationForm({...creationForm, folder: e.target.value})}>
                             {folders.map(f => <option key={f}>{f}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="pt-6 border-t flex gap-4">
                       <button onClick={() => setActiveDocSubTab('library')} className="flex-1 bg-slate-100 text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Spara Utkast</button>
                       <button onClick={() => { alert('Dokument publicerat!'); setActiveDocSubTab('library'); }} className="flex-2 bg-blue-600 text-white py-5 px-12 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl flex items-center justify-center gap-3">
                          <FileCheck size={18}/> Publicera Version 1.0
                       </button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* DOCUMENT DETAIL MODAL */}
        {isDocDetailOpen && selectedDocument && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl border shadow-sm text-blue-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedDocument.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Version {selectedDocument.version || '1.0'}</span>
                      <span className="text-slate-300">•</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDocument.status === 'godkänd' ? 'text-emerald-600' : 'text-yellow-600'}`}>{selectedDocument.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isEditingDoc ? (
                    <>
                      <button 
                        disabled={isLoading}
                        onClick={handleAiImproveDoc}
                        className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                        Förbättra med AI
                      </button>
                      <button onClick={() => setIsEditingDoc(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Avbryt</button>
                      <button onClick={handleSaveDoc} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Spara Ändringar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setIsEditingDoc(true)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Edit2 size={14}/> Redigera
                      </button>
                      {selectedDocument.status !== 'godkänd' && currentUser.role === 'admin' && (
                        <button onClick={handleApproveDoc} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2">
                          <CheckCircle2 size={14}/> Godkänn
                        </button>
                      )}
                      <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-blue-600 transition-all"><Printer size={20}/></button>
                      <button onClick={() => setIsDocDetailOpen(false)} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-500 transition-all"><X size={20}/></button>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 flex overflow-hidden">
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white">
                  {isEditingDoc ? (
                    <textarea 
                      value={docEditContent}
                      onChange={(e) => setDocEditContent(e.target.value)}
                      className="w-full h-full min-h-[500px] p-8 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm leading-relaxed"
                      placeholder="Skriv dokumentinnehåll här (Markdown stöds)..."
                    />
                  ) : (
                    <div className="prose prose-slate max-w-none">
                      <Markdown>{selectedDocument.content || '*Inget innehåll ännu.*'}</Markdown>
                    </div>
                  )}
                </div>

                {/* Sidebar Info */}
                <aside className="w-80 border-l border-slate-100 bg-slate-50/50 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Information</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ägare</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase">{selectedDocument.owner}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Typ</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase">{selectedDocument.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Kategori</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase">{selectedDocument.category || 'Osorterad'}</span>
                      </div>
                      {selectedDocument.approver && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Godkänd av</span>
                          <span className="text-[10px] font-black text-emerald-600 uppercase">{selectedDocument.approver}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Revisionshistorik</h4>
                    <div className="space-y-4">
                      {selectedDocument.history?.map((h, i) => (
                        <div key={i} className="relative pl-6 border-l-2 border-slate-200 py-1">
                          <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-white border-2 border-blue-600"></div>
                          <p className="text-[10px] font-black text-slate-900 uppercase">{h.action} - v{h.version}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{h.date} | {h.user}</p>
                        </div>
                      )) || <p className="text-[10px] font-bold text-slate-400 italic">Ingen historik tillgänglig.</p>}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-200">
                    <button className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all group">
                      <div className="flex items-center gap-3">
                        <Paperclip size={16} className="text-slate-400 group-hover:text-blue-600" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Bilagor (0)</span>
                      </div>
                      <Plus size={14} className="text-slate-300" />
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}

        {/* RONDERING TAB */}
        {activeTab === 'rondering' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Rondering</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Skyddsronder och miljöinspektioner</p>
               </div>
               <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                 <Camera size={16}/> Starta Rond
               </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card title="Kommande Ronder">
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border text-blue-600 shadow-sm"><CalendarIcon size={20}/></div>
                      <div>
                        <p className="font-black text-sm uppercase">Skyddsrond Lager</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">2024-06-15 | Rami Haasén</p>
                      </div>
                    </div>
                    <button className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Starta</button>
                  </div>
                </div>
              </Card>
              <Card title="Senaste Protokoll">
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border text-emerald-600 shadow-sm"><CheckCircle2 size={20}/></div>
                      <div>
                        <p className="font-black text-sm uppercase">Miljörond Kontor</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">2024-05-01 | Godkänd</p>
                      </div>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-blue-600"><ExternalLink size={18}/></button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* COMPETENCE TAB */}
        {activeTab === 'competence' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Kompetens</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Utbildningsmatris och kompetensbehov</p>
               </div>
               <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                 <Plus size={16}/> Ny Utbildning
               </button>
            </header>
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medarbetare</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utbildningar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {competence.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 text-sm font-black text-slate-800 uppercase">{c.employee}</td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">{c.role}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {c.training.map((t, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${t.status === 'klar' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STANDARDS TAB */}
        {activeTab === 'standards' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Standarder & Krav</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Digital kravhantering för ISO-certifiering</p>
               </div>
               <div className="flex gap-3 bg-white p-1.5 rounded-2xl border shadow-sm">
                 {(['9001', '14001', '45001'] as ISOStandard[]).map(std => (
                   <button 
                    key={std} 
                    onClick={() => setSelectedStandard(std)}
                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${selectedStandard === std ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                   >
                     ISO {std}
                   </button>
                 ))}
               </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
               {getISOChapters(selectedStandard).map(chapter => (
                 <div key={chapter.id} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col">
                    <div className="p-8 flex-1">
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border flex items-center justify-center font-black text-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-colors">{chapter.number}</div>
                       </div>
                       <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight mb-3">{chapter.title}</h4>
                       <p className="text-xs font-medium text-slate-500 leading-relaxed">{chapter.description}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border-t space-y-2">
                       <button onClick={() => openAiAdvice(chapter)} className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">
                          <Sparkles size={14}/> Visa Krav & Råd
                       </button>
                       <div className="pt-2 border-t border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Kopplade Dokument ({allDocuments.filter(d => d.category === chapter.number).length})</p>
                          <div className="space-y-1">
                             {allDocuments.filter(d => d.category === chapter.number).slice(0, 2).map(d => (
                               <div key={d.id} onClick={() => handleOpenDoc(d)} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 cursor-pointer hover:border-blue-300 transition-all">
                                  <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px]">{d.name}</span>
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${d.status === 'godkänd' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'}`}>{d.status}</span>
                               </div>
                             ))}
                             <button 
                               onClick={() => {
                                 setActiveTab('documents');
                                 setActiveDocSubTab('search');
                                 setSearchQuery(chapter.number);
                               }}
                               className="w-full py-1 text-[9px] font-black text-blue-600 uppercase hover:underline text-center"
                             >
                               Visa alla...
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* DETAILED PROCESS VIEW */}
        {activeTab === 'dashboard' && selectedProcess && currentSelectedProc && (
          <div className="max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-300 h-full">
            <div className="flex justify-between items-center py-4 px-6 bg-white border-b shadow-sm">
               <h2 className="text-3xl font-light text-slate-900">Processkarta - <span className="font-normal">{currentSelectedProc.name}</span></h2>
               <div className="flex gap-2">
                  <button onClick={() => setSelectedProcess(null)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Home size={16} /> HEM
                  </button>
               </div>
            </div>
            <div className="flex items-center px-6 py-4 bg-slate-50 gap-0">
               {['Sälj', 'R&D', 'Inköp', 'Produktion', 'Leverans'].map((stage, i) => (
                 <div key={stage} className="relative flex items-center">
                    <div className={`px-10 py-3 font-black text-[10px] uppercase tracking-[0.2em] relative z-10 transition-all ${stage === 'Sälj' ? 'bg-indigo-900 text-white shadow-xl' : 'bg-slate-200 text-slate-400'}`} 
                         style={{ clipPath: 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)', marginLeft: i === 0 ? '0' : '-15px' }}>
                       {stage}
                    </div>
                 </div>
               ))}
            </div>
            <div className="flex h-[calc(100vh-280px)] px-6 pb-6 gap-6">
               <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] shadow-lg overflow-auto relative custom-scrollbar p-8">
                  {/* Process canvas content */}
                  <div className="min-w-[1000px] grid grid-cols-12 gap-8">
                     {mapNodes.map(node => (
                       <div key={node.id} style={{ gridColumn: `${node.pos} / span 2`, gridRow: node.lane + 1 }} className="h-20 bg-white border-2 border-indigo-900 rounded-[1.5rem] p-4 flex flex-col items-center justify-center shadow-sm">
                          <p className="text-[11px] font-black text-center leading-tight uppercase">{node.name}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
             <header className="flex justify-between items-end mb-10 border-b border-slate-200 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Din Profil</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hantera ditt konto och personliga resurser</p>
               </div>
               <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-3 bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">
                 <LogOut size={16}/> Logga ut
               </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
               <div className="lg:col-span-1 space-y-3">
                  {[
                    { id: 'info', label: 'Allmänt', icon: <UserIcon size={16}/> },
                    { id: 'security', label: 'Säkerhet', icon: <Key size={16}/> },
                    { id: 'tasks', label: 'Mina Ansvar', icon: <UserCheck size={16}/> },
                    { id: 'news', label: 'Produktnyheter', icon: <Newspaper size={16}/> },
                    { id: 'manuals', label: 'Manualer', icon: <Book size={16}/> }
                  ].map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setProfileTab(item.id as any)}
                      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${profileTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border text-slate-500 hover:bg-slate-50 shadow-sm'}`}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
               </div>

               <div className="lg:col-span-3">
                  {profileTab === 'info' && (
                    <Card title="Personuppgifter">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Namn</label>
                             <input className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Titel</label>
                             <input className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600" value={profileForm.title} onChange={(e) => setProfileForm({...profileForm, title: e.target.value})} />
                          </div>
                          <button onClick={handleSaveProfile} className="md:col-span-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">Spara ändringar</button>
                       </div>
                    </Card>
                  )}

                  {profileTab === 'security' && (
                    <Card title="Säkerhetsinställningar">
                       <div className="space-y-6">
                          <p className="text-sm font-medium text-slate-500">Här kan du byta lösenord och hantera tvåfaktorsautentisering.</p>
                          <button className="px-6 py-3 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest">Byt lösenord</button>
                       </div>
                    </Card>
                  )}

                  {profileTab === 'tasks' && (
                    <Card title="Mina Ansvar & Deadlines">
                       <div className="space-y-4">
                          {myIncidents.map(inc => (
                            <div key={inc.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl ${inc.type === 'deviation' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                     <Clock size={20}/>
                                  </div>
                                  <div>
                                     <p className="font-black text-sm uppercase tracking-tight">{inc.title}</p>
                                     <p className="text-[10px] font-black text-red-500 uppercase">Deadline: {inc.deadline}</p>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </Card>
                  )}

                  {profileTab === 'news' && (
                    <Card title="Senaste Produktnyheter">
                       <div className="space-y-6">
                          {productNews.map(news => (
                            <div key={news.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
                               {!news.isRead && <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-xl text-[8px] font-black uppercase">Ny</div>}
                               <h4 className="text-sm font-black uppercase mb-2">{news.title}</h4>
                               <p className="text-xs text-slate-600 leading-relaxed">{news.content}</p>
                            </div>
                          ))}
                       </div>
                    </Card>
                  )}

                  {profileTab === 'manuals' && (
                    <Card title="Användarmanualer">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {manuals.map(man => (
                            <div key={man.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-white transition-all cursor-pointer group flex flex-col justify-between h-32">
                               <div className="flex justify-between items-start">
                                  <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><Book size={18}/></div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase">{man.category}</span>
                               </div>
                               <p className="text-sm font-black uppercase leading-tight pr-4">{man.title}</p>
                            </div>
                          ))}
                       </div>
                    </Card>
                  )}
               </div>
            </div>
          </div>
        )}
      </main>

      {/* AI PANEL RIGHT */}
      <div className={`fixed inset-y-0 right-0 w-[550px] bg-white shadow-2xl transition-transform duration-500 z-[110] border-l border-slate-100 ${aiPanel.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-10 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10 border-b pb-8">
             <h3 className="font-black text-indigo-600 flex items-center gap-3 text-xl uppercase tracking-tighter">
                <Sparkles size={28}/>AI-ANALYS
             </h3>
             <button onClick={() => setAiPanel({...aiPanel, isOpen: false})} className="p-3 hover:bg-slate-100 rounded-2xl border"><X size={24}/></button>
          </div>
          <div className="flex-1 overflow-y-auto font-medium text-sm leading-relaxed text-slate-700 bg-slate-50 p-10 rounded-[3rem] border shadow-inner custom-scrollbar prose prose-slate">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                 <Loader2 className="animate-spin text-indigo-600" size={48}/>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Analyserar...</p>
              </div>
            )}
            <Markdown>{aiPanel.content}</Markdown>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
