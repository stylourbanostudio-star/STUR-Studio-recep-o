import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Markdown from 'react-markdown';
import { Toaster, toast } from 'sonner';
import { sendWelcomeEmail, sendPasswordResetEmail } from './services/emailService';
import { 
  Layout,
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserCircle, 
  Camera,
  Plus, 
  Search, 
  Bell, 
  ChevronRight, 
  ChevronLeft,
  ArrowUpRight, 
  ArrowUpDown,
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  CreditCard, 
  DollarSign,
  FileText, 
  CheckCircle2, 
  Check,
  XCircle,
  X,
  AlertCircle,
  MoreVertical,
  Download,
  Filter,
  MessageSquare,
  Menu,
  Send,
  CheckCheck,
  RefreshCw,
  Sun,
  Moon,
  Star,
  StickyNote,
  Image as ImageIcon,
  Upload,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Wand2,
  Tag,
  Activity,
  UserCheck,
  QrCode,
  ChevronDown,
  History,
  Save,
  LayoutGrid,
  List,
  Megaphone,
  Share2,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Smartphone,
  Cloud,
  Server,
  ArrowRight,
  Info,
  ShoppingCart,
  TrendingUp,
  Key,
  BarChart3 as BarChartIcon,
  DoorOpen,
  HardDrive,
  Printer,
  Sparkles,
  Zap,
  AlertTriangle,
  Sliders,
  SlidersHorizontal
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  endOfWeek,
  isAfter,
  addMinutes
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { io, Socket } from 'socket.io-client';
import { GoogleGenAI } from "@google/genai";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  signInWithEmailAndPassword,
  handleFirestoreError, 
  OperationType,
  messaging,
  getToken,
  onMessage
} from './firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp,
  collectionGroup,
  Timestamp,
  getDocs,
  deleteDoc,
  arrayUnion
} from 'firebase/firestore';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { InteractiveCalendar } from './components/InteractiveCalendar';
import { InstallAppModal } from './components/InstallAppModal';
import { PWAUpdateBanner } from './components/PWAUpdateBanner';
import { usePWA } from './hooks/usePWA';
import { GoogleDriveBackupSettings, AutoBackupConfig } from './components/GoogleDriveBackupSettings';
import { StudentQRScannerModal } from './components/StudentQRScannerModal';
import { StudentDigitalCardModal } from './components/StudentDigitalCardModal';
import { WhatsAppIntegrationSettings, DEFAULT_WHATSAPP_CONFIG, WhatsAppConfig } from './components/WhatsAppIntegrationSettings';
import { SMSIntegrationSettings, DEFAULT_SMS_TEMPLATES } from './components/SMSIntegrationSettings';
import { SimplifiedFinancialWidget } from './components/SimplifiedFinancialWidget';
import { PartnerIntegrationSettings, DEFAULT_PARTNER_CONFIG, PartnerConfig } from './components/PartnerIntegrationSettings';
import { IntegratedCheckInModal } from './components/IntegratedCheckInModal';
import { TurmaCapacityModal } from './components/TurmaCapacityModal';
import { BASE_PLANS_CONFIG, calculateStudentClassUsage, StudentUsageStats } from './utils/planUsage';

const PLANS_CONFIG = BASE_PLANS_CONFIG;

const getTurmaColor = (turma: string) => {
  switch (turma) {
    case 'Turma Manhã': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
    case 'Turma Tarde': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'Turma Noite': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    case 'Turma Sábado': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    default: return 'bg-surface-container-high text-on-surface-variant border-outline';
  }
};

const getModalityColor = (modality: string) => {
  switch (modality) {
    case 'Danças Urbanas': return 'bg-primary/10 text-primary border-primary/20';
    case 'Ballet Moderno': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
    case 'Jazz Contemporâneo': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'Hip Hop': return 'bg-lime-500/10 text-lime-500 border-lime-500/20';
    default: return 'bg-surface-container-high text-on-surface-variant border-outline';
  }
};

const DAYS_OF_WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const MODALITIES_CONFIG: Record<string, string[]> = {
  'Danças Urbanas': [
    'Free Style', 'Hip Hop Free Style', 'Urban Choreography', 'Locking', 'Popping', 'Breaking', 
    'Litefeet', 'KRUMP', 'Waacking', 'Vogue', 'House Dance', 'Dancehall', 
    'Passinho paulista', 'Passinho carioca', 'Lagartixa', 'Charme', 'Stiletto'
  ],
  'Dança a 2': [
    'Zouk Brasileiro', 'Kizomba', 'Samba de Gafieira', 'Samba Funkeado', 'Salsa On1/On2', 
    'Bolero', 'Bachata Sensual', 'Bachata Fusion', 'Forró Universitário', 'Forró Roots', 
    'Soltinho', 'West Coast Swing', 'Tango', 'Rock and Roll'
  ],
  'Ballet': [
    'Clássico Acadêmico', 'Baby Class', 'Ballet Adulto Iniciante', 'Ballet Fit', 
    'Ponta', 'Repertório', 'Neoclássico'
  ],
  'Contemporâneo': [
    'Lyrical Contemporary', 'Experimental', 'Floorwork', 'Release Technique', 
    'Cunningham', 'Graham', 'Limón'
  ],
  'Jazz': [
    'Jazz Musical (Broadway)', 'Lyrical Jazz', 'Modern Jazz', 'Jazz Funk', 
    'Street Jazz', 'Jazz Contemporâneo'
  ],
  'Treino Funcional': [
    'HIIT', 'Mobilidade e Flexibilidade', 'Força e Hipertrofia', 'Resistência Cardiovascular', 
    'Core Training', 'Cross Training', 'Calistenia'
  ],
  'Zumba': [
    'Zumba Gold', 'Zumba Fitness', 'Zumba Kids', 'Zumba Toning', 'Strong Nation'
  ],
  'Yoga': [
    'Hatha Yoga', 'Vinyasa Flow', 'Ashtanga', 'Yin Yoga', 'Yoga para Iniciantes'
  ],
  'Pilates': [
    'Pilates Solo (Mat)', 'Pilates com Acessórios', 'Stott Pilates', 'Pilates Clínico'
  ]
};

// --- Types ---

type Screen = 'dashboard' | 'students' | 'agenda' | 'profile' | 'settings' | 'events' | 'messages' | 'my-profile' | 'financial' | 'ai-planner' | 'analytics' | 'gallery' | 'setup';

interface GalleryItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  modality: string;
  plan: string;
  savedAt: string;
  savedBy: string;
}

interface CartItem {
  id: string;
  title: string;
  date: string;
  time: string;
  price: number;
  type: 'Aula' | 'Evento';
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  type: 'text' | 'payment';
  paymentLink?: string;
  pixPayload?: string;
  timestamp: string;
  read: boolean;
}

interface Note {
  id: string;
  content: string;
  timestamp: string;
  instructor: string;
}

type UserRole = 'Gerente' | 'Recepcionista' | 'Auxiliar de Gerência' | 'Instrutor' | 'Aluno';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  fcmToken?: string;
  password?: string;
  mustChangePassword?: boolean;
  notifications?: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  specialties?: string[];
  schedules?: { day: string; start: string; end: string }[];
  preferredDays?: string[];
}

interface PerformanceRecord {
  date: string;
  modality: string;
  subModalities: string[];
  score: number;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  method: string;
  description: string;
  paymentLink?: string;
  pixPayload?: string;
  studentId?: string;
  studentName?: string;
  type?: 'income' | 'expense';
  category?: string;
  updatedAt?: any;
}

interface Student {
  id: string;
  name: string;
  email: string;
  contact: string;
  phone?: string;
  address: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  document: string; // CPF/CNPJ
  birthDate: string;
  classes: string[];
  turmas: string[];
  subModalities?: string[];
  novasModalidades?: string[];
  status: 'active' | 'inactive';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  joinDate: string;
  attendance: { 
    id: string; 
    date: string; 
    present: boolean; 
    className: string; 
    instructor: string; 
    note?: string;
    partner?: string;
    partnerToken?: string;
    isExtraClass?: boolean;
  }[];
  feedbacks: { id: string; year: number; instructor: string; content: string; date: string; time: string }[];
  performance: PerformanceRecord[];
  payments?: PaymentRecord[];
  messages: Message[];
  notes: Note[];
  isFavorite?: boolean;
  planType: 'Studio' | 'WellHub' | 'GuruPass' | 'TotalPass';
  contractedPlan: string;
  partnerMemberId?: string;
  customClassLimit?: number;
  customWeeklyLimit?: number;
  partnerStatus?: 'active' | 'suspended' | 'pending';
  preferredDays?: string[];
  avatar?: string;
}

export interface ClassEvent {
  id: string;
  title: string;
  instructor: string;
  instructorEmail: string;
  time: string;
  date: Date;
  capacity: number;
  enrolled: number;
  category: string;
  type: 'Aula' | 'Evento' | 'Feriado' | 'Alteração';
  status: 'Confirmado' | 'Pendente' | 'Aviso Enviado' | 'Fechado';
  turma?: string;
  googleEventId?: string;
}

// --- Mock Data ---

const MOCK_USERS: User[] = [];
const MOCK_INSTRUCTORS: User[] = [];
const MOCK_STUDENTS: Student[] = [];
const MOCK_EVENTS: ClassEvent[] = [];
const GROWTH_DATA: { name: string; students: number }[] = [];
const PROGRESS_DATA: { name: string; score: number }[] = [];
const INSTRUCTOR_PERFORMANCE: { name: string; classes: number; attendance: number }[] = [];

// --- Components ---

function ChangePasswordScreen({ user, onPasswordChanged }: { user: User, onPasswordChanged: (pass: string) => Promise<void> }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha os campos de senha');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    try {
      await onPasswordChanged(newPassword);
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-10 bg-surface-container border border-outline rounded-[40px] shadow-2xl relative z-10 glass-panel"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <h1 className="font-headline font-black text-3xl tracking-tighter leading-none mb-2 uppercase">Alterar Senha</h1>
          <p className="text-xs text-on-surface-variant">Para sua segurança, você deve alterar sua senha no primeiro acesso.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Nova Senha</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite sua nova senha"
              className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Confirmar Senha</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua nova senha"
              className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Confirmar Nova Senha'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function LoginScreen({ 
  onGoogleLogin, 
  onEmailLogin, 
  onQuickLogin,
  studioName, 
  studioLogo,
  isInstalled,
  deferredPrompt,
  isIOS,
  onInstallClick
}: { 
  onGoogleLogin: () => void, 
  onEmailLogin: (email: string, pass: string) => Promise<void>, 
  onQuickLogin?: (role: UserRole) => void,
  studioName: string, 
  studioLogo: string | null,
  isInstalled: boolean,
  deferredPrompt: any,
  isIOS: boolean,
  onInstallClick: () => void
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showFirstAccessInfo, setShowFirstAccessInfo] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await onGoogleLogin();
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setIsLoading(true);
    try {
      await onEmailLogin(email, password);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('E-mail ou senha incorretos');
      } else {
        toast.error('Erro ao realizar login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Kinetic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 bg-surface-container border border-outline rounded-[40px] shadow-2xl relative z-10 glass-panel"
      >
        <div className="flex flex-col items-center mb-10">
          {studioLogo ? (
            <div className="w-20 h-20 mb-6 rounded-2xl overflow-hidden border border-outline shadow-xl">
              <img src={studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-20 h-20 mb-6 rounded-2xl overflow-hidden border border-outline shadow-xl bg-white/5">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-primary text-white font-black text-2xl">S</div>';
              }} />
            </div>
          )}
          <h1 className="font-headline font-black text-3xl tracking-tighter leading-none mb-2 uppercase">{studioName}</h1>
          <p className="text-[10px] font-bold tracking-[0.4em] text-primary uppercase">Portal do Instrutor</p>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold">Bem-vindo de volta!</h2>
            <p className="text-xs text-on-surface-variant">Acesse sua conta para gerenciar o estúdio.</p>
          </div>

          <div className="flex p-1 bg-surface-container-low border border-outline rounded-2xl">
            <button 
              onClick={() => setLoginMethod('google')}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                loginMethod === 'google' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-outline/5"
              )}
            >
              Google
            </button>
            <button 
              onClick={() => setLoginMethod('email')}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                loginMethod === 'email' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-outline/5"
              )}
            >
              E-mail
            </button>
          </div>

          {loginMethod === 'google' ? (
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-black py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Entrar com Google
                </>
              )}
            </button>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">E-mail</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Senha</label>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!email) {
                        toast.error('Informe seu e-mail para recuperar a senha');
                        return;
                      }
                      setShowRecoveryModal(true);
                    }}
                    className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          )}

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-outline/20" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ou</span>
            <div className="h-px flex-1 bg-outline/20" />
          </div>

          <button
            type="button"
            onClick={() => onQuickLogin ? onQuickLogin('Gerente') : onEmailLogin('admin@stylourbano.com', '123')}
            className="w-full py-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-2xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles size={16} />
            Entrar como Gerente (Modo Teste)
          </button>

          <div className="p-4 bg-surface-container-low border border-outline rounded-2xl text-center">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest leading-relaxed">
              O acesso é restrito a instrutores e equipe administrativa autorizada.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
            Novo no Stylo? <span onClick={() => setShowFirstAccessInfo(true)} className="text-primary cursor-pointer hover:underline">Primeiro Acesso / Instalação</span>
          </p>
        </div>

        {!isInstalled && (
          <div className="mt-8 pt-8 border-t border-outline/30 text-center">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Acesse mais rápido instalando o App</p>
            <button 
              onClick={onInstallClick}
              className="w-full py-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all animate-pulse shadow-lg shadow-primary/5"
            >
              <Download size={18} />
              Instalar Aplicativo
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showRecoveryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-surface-container border border-outline rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-headline font-black tracking-tight">Recuperar Senha</h2>
                <button onClick={() => setShowRecoveryModal(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <XCircle size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <p className="text-sm text-on-surface-variant">Como você deseja receber as instruções de recuperação para <span className="text-on-surface font-bold">{email}</span>?</p>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => {
                    toast.success(`Link de recuperação enviado para o e-mail ${email}`);
                    setShowRecoveryModal(false);
                  }}
                  className="flex items-center gap-4 p-4 bg-surface-container-low border border-outline rounded-2xl hover:border-primary transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest">E-mail</p>
                    <p className="text-[10px] text-on-surface-variant">Enviar link para o e-mail cadastrado</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    toast.success(`Código de recuperação enviado via SMS`);
                    setShowRecoveryModal(false);
                  }}
                  className="flex items-center gap-4 p-4 bg-surface-container-low border border-outline rounded-2xl hover:border-primary transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest">SMS</p>
                    <p className="text-[10px] text-on-surface-variant">Enviar código para o celular cadastrado</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    toast.success(`Instruções enviadas via WhatsApp`);
                    setShowRecoveryModal(false);
                  }}
                  className="flex items-center gap-4 p-4 bg-surface-container-low border border-outline rounded-2xl hover:border-primary transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest">WhatsApp</p>
                    <p className="text-[10px] text-on-surface-variant">Enviar instruções via WhatsApp</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFirstAccessInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-surface-container border border-outline rounded-[32px] p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-headline font-black tracking-tight">Instalação e Primeiro Acesso</h2>
                <button onClick={() => setShowFirstAccessInfo(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <XCircle size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                <p>Para configurar o sistema pela primeira vez em um novo ambiente:</p>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                    <p><span className="text-on-surface font-bold">Bootstrap do Banco de Dados:</span> O script de instalação cria automaticamente o primeiro usuário <span className="text-primary">Master Admin</span>.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                    <p><span className="text-on-surface font-bold">Configuração Inicial:</span> No primeiro login, o Gerente define as modalidades, horários e planos do estúdio.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                    <p><span className="text-on-surface font-bold">Cadastro de Instrutores:</span> O Gerente então cadastra os demais instrutores, que receberão seus e-mails de acesso.</p>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                  <p className="text-xs italic">"Neste protótipo, o registro de Gerente já está simulado. Use o botão de acesso rápido para visualizar todas as funcionalidades administrativas."</p>
                </div>
              </div>

              <button 
                onClick={() => setShowFirstAccessInfo(false)}
                className="w-full bg-surface-container-high text-on-surface py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-outline/10 transition-all"
              >
                Entendi, fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StudioRoom {
  id: string;
  name: string;
  capacity: number;
}

interface StudioConfig {
  rooms: StudioRoom[];
  storageMode: 'drive' | 'local';
  lastBackupDate?: string;
}

function SetupAssistant({ 
  onComplete,
  onClose
}: { 
  onComplete: (name: string, logo: string | null, color: string, modalities: string[], rooms: StudioRoom[], storageMode: 'drive' | 'local') => void,
  onClose?: () => void
}) {
  const [step, setStep] = useState(1);
  const [studioName, setStudioName] = useState('');
  const [studioLogo, setStudioLogo] = useState<string | null>(null);
  const [studioColor, setStudioColor] = useState('#FF6B00');
  const [storageMode, setStorageMode] = useState<'drive' | 'local'>('drive');
  const [rooms, setRooms] = useState<StudioRoom[]>([{ id: '1', name: 'Sala Principal', capacity: 20 }]);
  const [modalities, setModalities] = useState([
    'Danças Urbanas', 'Free Style', 'Urban Choreography', 'Locking', 'Popping', 'Breaking', 'Litefeet', 'KRUMP', 'Waacking', 'Passinho paulista', 'Lagartixa', 'Charme',
    'Dança a 2', 'Zouk', 'Kizomba', 'Samba', 'Salsa', 'Bolero', 'Bachata', 'Forró', 'Soltinho',
    'Ballet', 'Clássico', 'Baby Class', 'Adulto', 'Fit',
    'Contemporâneo', 'Jazz', 'Treino Funcional', 'Zumba'
  ]);
  const [newModality, setNewModality] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRESET_COLORS = [
    { name: 'Stylo Orange', value: '#FF6B00' },
    { name: 'Electric Blue', value: '#0070FF' },
    { name: 'Neon Green', value: '#39FF14' },
    { name: 'Royal Purple', value: '#7D00FF' },
    { name: 'Crimson Red', value: '#FF003C' },
    { name: 'Cyber Yellow', value: '#FFD300' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudioLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddModality = () => {
    if (newModality.trim() && !modalities.includes(newModality.trim())) {
      setModalities([...modalities, newModality.trim()]);
      setNewModality('');
    }
  };

  const handleRemoveModality = (mod: string) => {
    setModalities(modalities.filter(m => m !== mod));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 relative overflow-hidden">
      {/* Kinetic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl p-10 bg-surface-container border border-outline rounded-[40px] shadow-2xl relative z-10 glass-panel"
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.3)] kinetic-glow">
              <ArrowUpRight className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-headline font-black text-2xl tracking-tighter leading-none">Configuração Inicial</h1>
              <p className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Passo {step} de 5</p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-container-high hover:bg-outline/10 text-on-surface-variant rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-outline"
            >
              Pular / Fechar
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-bold">Qual o nome do seu estúdio?</h2>
                <p className="text-xs text-on-surface-variant">Isso será exibido no topo da plataforma e nos relatórios.</p>
              </div>
              <input 
                type="text" 
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="Ex: Stylo Urbano Studio"
                className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    if (!studioName.trim()) {
                      toast.error('Por favor, informe o nome do estúdio');
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full bg-primary text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Próximo Passo
                  <ChevronRight size={18} />
                </button>
                <button 
                  onClick={() => {
                    const demoRooms = [{ id: '1', name: 'Sala Urban', capacity: 15 }, { id: '2', name: 'Sala Coreo', capacity: 25 }];
                    setStudioName('Stylo Urbano Demo');
                    setStudioColor('#FF6B00');
                    setModalities(['Danças Urbanas', 'Hip Hop', 'Breaking', 'Popping', 'Jazz', 'Ballet']);
                    onComplete('Stylo Urbano Demo', null, '#FF6B00', ['Danças Urbanas', 'Hip Hop', 'Breaking', 'Popping', 'Jazz', 'Ballet'], demoRooms, 'drive');
                    toast.success('Configurado em Modo de Teste!');
                  }}
                  className="w-full bg-surface-container-high text-on-surface-variant py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border border-outline hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 size={14} />
                  Configuração Rápida (Modo de Teste)
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-bold">Gestão de Espaço e Salas</h2>
                <p className="text-xs text-on-surface-variant">Defina quantas salas tem o seu espaço e a capacidade de alunos para cada uma.</p>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {rooms.map((room, idx) => (
                  <div key={room.id} className="p-4 bg-surface-container-low border border-outline rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-primary">Sala {idx + 1}</span>
                      {rooms.length > 1 && (
                        <button onClick={() => setRooms(rooms.filter(r => r.id !== room.id))} className="text-red-500 hover:scale-110 transition-transform">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text"
                        value={room.name}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[idx].name = e.target.value;
                          setRooms(newRooms);
                        }}
                        placeholder="Nome da Sala"
                        className="bg-surface-container border border-outline rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input 
                        type="number"
                        value={room.capacity}
                        onChange={(e) => {
                          const newRooms = [...rooms];
                          newRooms[idx].capacity = parseInt(e.target.value) || 0;
                          setRooms(newRooms);
                        }}
                        placeholder="Capacidade"
                        className="bg-surface-container border border-outline rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setRooms([...rooms, { id: Date.now().toString(), name: '', capacity: 10 }])}
                className="w-full py-4 border-2 border-dashed border-outline rounded-2xl text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar Nova Sala
              </button>

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-surface-container-high text-on-surface py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] border border-outline hover:bg-outline/10 transition-all">Voltar</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-primary text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  Próximo <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-bold">Armazenamento e Arquivos</h2>
                <p className="text-xs text-on-surface-variant">Onde você deseja armazenar e salvar seus arquivos externos (backups, imagens, etc)?</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setStorageMode('drive')}
                  className={cn(
                    "p-6 rounded-3xl border-2 flex items-center gap-6 transition-all text-left group",
                    storageMode === 'drive' ? "border-primary bg-primary/5" : "border-outline hover:border-primary/50"
                  )}
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", storageMode === 'drive' ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant")}>
                    <Cloud size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Google Drive</h4>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Nuvem • Seguro • Automático</p>
                    <p className="text-[9px] text-on-surface-variant/70 mt-1">Sincroniza automaticamente com sua conta Google.</p>
                  </div>
                </button>

                <button 
                  onClick={() => setStorageMode('local')}
                  className={cn(
                    "p-6 rounded-3xl border-2 flex items-center gap-6 transition-all text-left group",
                    storageMode === 'local' ? "border-primary bg-primary/5" : "border-outline hover:border-primary/50"
                  )}
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", storageMode === 'local' ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant")}>
                    <HardDrive size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Armazenamento Externo / Local</h4>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Manual • Direto • Offline</p>
                    <p className="text-[9px] text-on-surface-variant/70 mt-1">Você gerencia seus arquivos e faz backups manuais por download.</p>
                  </div>
                </button>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 bg-surface-container-high text-on-surface py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] border border-outline hover:bg-outline/10 transition-all">Voltar</button>
                <button onClick={() => setStep(4)} className="flex-1 bg-primary text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  Continuar <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-bold">Deseja adicionar um logotipo?</h2>
                <p className="text-xs text-on-surface-variant">Isso dará uma identidade visual única para sua plataforma.</p>
              </div>
              
              <div className="flex flex-col items-center gap-6 py-6">
                {studioLogo ? (
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-primary shadow-2xl">
                      <img src={studioLogo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <button 
                      onClick={() => setStudioLogo(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-3xl border-2 border-dashed border-outline flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <Upload size={32} className="text-on-surface-variant" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Upload</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-surface-container-high text-on-surface py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] border border-outline hover:bg-outline/10 transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex-1 bg-primary text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {studioLogo ? 'Continuar' : 'Pular por enquanto'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-bold">Escolha a cor do seu estúdio</h2>
                <p className="text-xs text-on-surface-variant">Esta cor será aplicada em botões, ícones e destaques do sistema.</p>
              </div>

              <div className="grid grid-cols-3 gap-3 py-4">
                {PRESET_COLORS.map(color => (
                  <button 
                    key={color.value}
                    onClick={() => {
                      setStudioColor(color.value);
                      document.documentElement.style.setProperty('--color-primary', color.value);
                    }}
                    className={cn(
                      "group relative h-16 rounded-2xl border-2 transition-all flex items-center justify-center",
                      studioColor === color.value ? "border-primary shadow-lg scale-105" : "border-outline hover:border-primary/50"
                    )}
                    style={{ backgroundColor: `${color.value}15` }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full shadow-inner"
                      style={{ backgroundColor: color.value }}
                    />
                    {studioColor === color.value && (
                      <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5">
                        <CheckCheck size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Ou escolha uma cor personalizada</label>
                <div className="flex gap-3">
                  <div 
                    className="w-14 h-14 rounded-2xl border border-outline shrink-0"
                    style={{ backgroundColor: studioColor }}
                  />
                  <input 
                    type="color" 
                    value={studioColor}
                    onChange={(e) => {
                      setStudioColor(e.target.value);
                      document.documentElement.style.setProperty('--color-primary', e.target.value);
                    }}
                    className="flex-1 h-14 bg-surface-container-low border border-outline rounded-2xl px-2 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 bg-surface-container-high text-on-surface py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] border border-outline hover:bg-outline/10 transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => setStep(4)}
                  className="flex-1 bg-primary text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Continuar
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-bold">Quais modalidades você oferece?</h2>
                <p className="text-xs text-on-surface-variant">Adicione ou remova as aulas que fazem parte do seu estúdio.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {modalities.map(mod => (
                  <div key={mod} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                    {mod}
                    <button onClick={() => handleRemoveModality(mod)} className="hover:text-red-500 transition-colors">
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newModality}
                  onChange={(e) => setNewModality(e.target.value)}
                  placeholder="Nova modalidade..."
                  className="flex-1 bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddModality()}
                />
                <button 
                  onClick={handleAddModality}
                  className="p-4 bg-surface-container-high border border-outline rounded-2xl text-primary hover:bg-primary/10 transition-all"
                >
                  <Plus size={24} />
                </button>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(3)}
                  className="flex-1 bg-surface-container-high text-on-surface py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] border border-outline hover:bg-outline/10 transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => setStep(5)}
                  className="flex-1 bg-primary text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Continuar
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 text-center"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 size={48} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-headline font-black tracking-tight">Tudo Pronto!</h2>
                  <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
                    O <span className="text-on-surface font-bold">{studioName}</span> foi configurado com sucesso. Agora você pode começar a gerenciar seus alunos e turmas.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-surface-container-low border border-outline rounded-3xl space-y-4 text-left">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Resumo da Configuração</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Estúdio:</span>
                    <span className="font-bold">{studioName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Cor Principal:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: studioColor }} />
                      <span className="font-bold uppercase tracking-widest">{studioColor}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Salas:</span>
                  <span className="font-bold">{rooms.length} salas (Cap. {rooms.reduce((acc, r) => acc + r.capacity, 0)})</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Armazenamento:</span>
                  <span className="font-bold underline uppercase">{storageMode === 'drive' ? 'Google Drive' : 'Local'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Logotipo:</span>
                  <span className="font-bold">{studioLogo ? 'Adicionado' : 'Padrão'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Modalidades:</span>
                  <span className="font-bold">{modalities.length} cadastradas</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onComplete(studioName, studioLogo, studioColor, modalities, rooms, storageMode)}
              className="w-full bg-primary text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,107,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 kinetic-glow"
            >
              Finalizar e Entrar
              <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 flex justify-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div 
            key={i} 
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              step === i ? "w-8 bg-primary" : "w-2 bg-outline/20"
            )} 
          />
        ))}
      </div>
      </motion.div>
    </div>
  );
}

function BottomTab({ 
  currentScreen, 
  setCurrentScreen, 
  currentUser
}: { 
  currentScreen: Screen, 
  setCurrentScreen: (s: Screen) => void,
  currentUser: User
}) {
  const tabs: { id: Screen, label: string, icon: React.ReactNode, roles?: string[] }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard size={18} /> },
    { id: 'students', label: 'Alunos', icon: <Users size={18} />, roles: ['Gerente', 'Recepcionista', 'Instrutor'] },
    { id: 'agenda', label: 'Agenda', icon: <Calendar size={18} /> },
    { id: 'my-profile', label: 'Perfil', icon: <UserCircle size={18} /> },
    { id: 'messages', label: 'Chat', icon: <MessageSquare size={18} /> }
  ];

  const filteredTabs = tabs.filter(tab => !tab.roles || tab.roles.includes(currentUser.role));

  return (
    <nav aria-label="Navegação inferior" className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-surface-container/95 backdrop-blur-md border-t border-outline flex items-center justify-around px-2 z-[60]">
      {filteredTabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setCurrentScreen(tab.id)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-1.5 min-w-[50px] transition-all cursor-pointer active:scale-95",
            currentScreen === tab.id ? "text-primary font-bold" : "text-on-surface-variant/70 hover:text-on-surface"
          )}
        >
          <div className={cn(
            "p-1 rounded-lg transition-all",
            currentScreen === tab.id ? "bg-primary/10 scale-105" : "bg-transparent"
          )}>
            {tab.icon}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

// --- Safety Helpers ---
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage access denied:', e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage access denied:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage access denied:', e);
    }
  }
};

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'Erro desconhecido';
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) { /* not json */ }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6 text-center">
          <div className="max-w-md w-full space-y-6 bg-surface-container p-10 rounded-[40px] border border-outline shadow-2xl glass-panel">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-headline font-black text-on-surface">Ops! Algo deu errado</h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Ocorreu um erro inesperado. Isso pode ser devido a permissões de acesso ou falha na conexão.
            </p>
            <div className="p-4 bg-black/20 rounded-2xl text-left overflow-auto max-h-32">
              <code className="text-[10px] text-red-400 font-mono break-all">{errorMessage}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AnalyticsScreen({ students, payments, events, modalities }: { students: Student[], payments: PaymentRecord[], events: ClassEvent[], modalities: string[] }) {
  const chartColors = ['#FF6B00', '#00D1FF', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];

  const financialEvolutionData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthStr = format(d, 'MMM', { locale: ptBR });
      const monthYearStr = format(d, 'yyyy-MM');
      
      const income = payments
        .filter(p => (p as any).type === 'income' && p.status === 'paid' && p.date.startsWith(monthYearStr))
        .reduce((acc, p) => acc + p.amount, 0);
      
      const expenses = payments
        .filter(p => (p as any).type === 'expense' && p.date.startsWith(monthYearStr))
        .reduce((acc, p) => acc + p.amount, 0);
      
      data.push({ name: monthStr, income, expenses });
    }
    return data;
  }, [payments]);

  const studentGrowthData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthStr = format(d, 'MMM', { locale: ptBR });
      const monthYearStr = format(d, 'yyyy-MM');
      
      const count = students.filter(s => s.joinDate.startsWith(monthYearStr)).length;
      data.push({ name: monthStr, students: count });
    }
    return data;
  }, [students]);

  const modalityDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    students.forEach(s => {
      s.classes.forEach(c => {
        dist[c] = (dist[c] || 0) + 1;
      });
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [students]);

  const overallStats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active').length;
    const totalEnrolled = events.reduce((acc, e) => acc + e.enrolled, 0);
    const totalCapacity = events.reduce((acc, e) => acc + e.capacity, 0);
    const occupancy = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;
    
    const monthlyIncome = payments
      .filter(p => (p as any).type === 'income' && p.status === 'paid' && isSameMonth(new Date(p.date), new Date()))
      .reduce((acc, p) => acc + p.amount, 0);

    return { activeStudents, occupancy, monthlyIncome };
  }, [students, events, payments]);

  return (
    <div className="p-6 lg:p-10 space-y-10 overflow-auto h-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tight uppercase italic">Analytics & Insights</h1>
          <p className="text-on-surface-variant text-sm sm:text-base">Métricas detalhadas para análise de crescimento e performance.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container p-2 rounded-2xl border border-outline shadow-xl glass-panel">
           <div className="flex flex-col items-center px-6 border-r border-outline/30">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ocupação</span>
              <span className="text-2xl font-headline font-black text-primary">{overallStats.occupancy.toFixed(1)}%</span>
           </div>
           <div className="flex flex-col items-center px-6">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Alunos Ativos</span>
              <span className="text-2xl font-headline font-black text-emerald-500">{overallStats.activeStudents}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <ArrowUpRight size={120} />
            </div>
            <h3 className="text-lg font-headline font-black mb-8 uppercase tracking-tight relative z-10">Evolução Financeira (6 meses)</h3>
            <div className="h-80 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialEvolutionData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1C1E', border: '1px solid #44474E', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" name="Receita" />
                  <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpenses)" name="Despesas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <Users size={120} />
            </div>
            <h3 className="text-lg font-headline font-black mb-8 uppercase tracking-tight relative z-10">Novas Matrículas</h3>
            <div className="h-80 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#1A1C1E', border: '1px solid #44474E', borderRadius: '16px' }}
                  />
                  <Bar dataKey="students" fill="#FF6B00" radius={[8, 8, 0, 0]} name="Novos Alunos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel">
          <h3 className="text-lg font-headline font-black mb-8 uppercase tracking-tight text-center">Popularidade de Aulas</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modalityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {modalityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1A1C1E', border: '1px solid #44474E', borderRadius: '16px' }}
                />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel flex flex-col justify-center">
           <h3 className="text-xl font-headline font-black mb-8 uppercase tracking-tight italic">Insights & IA</h3>
           <div className="space-y-6">
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[28px] flex items-center gap-6 group hover:bg-emerald-500/10 transition-colors"
              >
                <div className="w-14 h-14 bg-emerald-500 shadow-lg shadow-emerald-500/20 rounded-2xl flex items-center justify-center text-white">
                  <ArrowUpRight size={28} />
                </div>
                <div>
                  <p className="text-base font-black uppercase tracking-tight text-emerald-500">Crescimento Saudável</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Sua taxa de retenção subiu 12% este mês. Os alunos de Ballet Intermediário são os mais engajados.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-[28px] flex items-center gap-6 group hover:bg-amber-500/10 transition-colors"
              >
                <div className="w-14 h-14 bg-amber-500 shadow-lg shadow-amber-500/20 rounded-2xl flex items-center justify-center text-white">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <p className="text-base font-black uppercase tracking-tight text-amber-500">Otimização de Turmas</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Turmas de Sábado estão com 98% de ocupação. Sugerimos abrir um novo horário às 10:30 para atender a demanda.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-6 bg-primary/5 border border-primary/20 rounded-[28px] flex items-center gap-6 group hover:bg-primary/10 transition-colors"
              >
                <div className="w-14 h-14 bg-primary shadow-lg shadow-primary/20 rounded-2xl flex items-center justify-center text-white">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-base font-black uppercase tracking-tight text-primary">Margem de Lucro</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Seu lucro líquido projetado para o próximo trimestre é de +R$ 5.400,00 se o ritmo atual for mantido.</p>
                </div>
              </motion.div>
           </div>
        </div>
      </div>
    </div>
  );
}

function FinancialDashboard({ 
  payments, 
  onConfirmPayment, 
  onShowQRCode,
  studioName = "STYLO URBANO",
  studioLogo = null,
  currentUser = null
}: { 
  payments: PaymentRecord[], 
  onConfirmPayment?: (id: string) => void,
  onShowQRCode?: (payment: any) => void,
  studioName?: string,
  studioLogo?: string | null,
  currentUser?: User | null
}) {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', description: '', category: 'Aluguel', date: new Date().toISOString().split('T')[0] });

  const filteredPayments = useMemo(() => {
    let list = [...payments];
    
    if (filterType !== 'all') {
      list = list.filter(p => p.type === filterType);
    }

    if (filterPeriod === 'month') {
      const now = new Date();
      list = list.filter(p => p.date && isSameMonth(new Date(p.date + 'T12:00:00'), now));
    } else if (filterPeriod === 'year') {
      const now = new Date();
      list = list.filter(p => p.date && new Date(p.date + 'T12:00:00').getFullYear() === now.getFullYear());
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, filterType, filterPeriod]);

  const stats = useMemo(() => {
    const income = filteredPayments.filter(p => p.type === 'income' && p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
    const expenses = filteredPayments.filter(p => p.type === 'expense').reduce((acc, p) => acc + p.amount, 0);
    const pending = filteredPayments.filter(p => p.type === 'income' && p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
    return { income, expenses, profit: income - expenses, pending };
  }, [filteredPayments]);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = addMonths(new Date(), -i);
      const monthStr = format(d, 'MMM', { locale: ptBR });
      const monthStart = startOfMonth(d);
      const monthEnd = endOfMonth(d);
      
      const mIncome = payments
        .filter(p => p.type === 'income' && p.status === 'paid' && p.date && new Date(p.date + 'T12:00:00') >= monthStart && new Date(p.date + 'T12:00:00') <= monthEnd)
        .reduce((acc, p) => acc + p.amount, 0);
        
      const mExpenses = payments
        .filter(p => p.type === 'expense' && p.date && new Date(p.date + 'T12:00:00') >= monthStart && new Date(p.date + 'T12:00:00') <= monthEnd)
        .reduce((acc, p) => acc + p.amount, 0);

      data.push({ name: monthStr, receita: mIncome, despesa: mExpenses });
    }
    return data;
  }, [payments]);

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      await addDoc(collection(db, 'payments'), {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        type: 'expense',
        status: 'paid',
        timestamp: serverTimestamp()
      });
      toast.success('Despesa registrada com sucesso!');
      setIsAddingExpense(false);
      setNewExpense({ amount: '', description: '', category: 'Aluguel', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  };

  return (
    <div className="space-y-10 pb-20 overflow-auto h-full p-6 lg:p-10">
      {/* Printable Document Header (Only visible when printing) */}
      <div className="print-only print-doc-header print-header-block mb-4">
        <div className="flex items-center gap-4">
          {studioLogo ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-300">
              <img src={studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center font-black text-2xl">
              {studioName.charAt(0) || 'S'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-gray-900 leading-tight">
              {studioName}
            </h1>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Relatório Financeiro & Fluxo de Caixa
            </p>
            <p className="text-[9pt] text-gray-500">
              Filtro: {filterPeriod === 'month' ? 'Mês Vigente' : filterPeriod === 'year' ? 'Ano Vigente' : 'Histórico Total'} • {filterType === 'all' ? 'Todas as Movimentações' : filterType === 'income' ? 'Apenas Receitas' : 'Apenas Despesas'}
            </p>
          </div>
        </div>
        <div className="text-right text-[8.5pt] text-gray-600">
          <p><strong>Emissão:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p><strong>Responsável:</strong> {currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Administração'}</p>
          <p><strong>Total de Registros:</strong> {filteredPayments.length}</p>
        </div>
      </div>

      {/* Printable Metrics Row (Only visible when printing) */}
      <div className="print-only print-metrics-row print-avoid-break">
        <div className="print-metric-box">
          <p className="text-[8pt] text-gray-500 uppercase font-bold">Receita Realizada</p>
          <p className="text-sm font-black print-income-value">R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[7.5pt] text-gray-400">Total pago no período</p>
        </div>
        <div className="print-metric-box">
          <p className="text-[8pt] text-gray-500 uppercase font-bold">Despesas</p>
          <p className="text-sm font-black print-expense-value">R$ {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[7.5pt] text-gray-400">Contas e custos fixos</p>
        </div>
        <div className="print-metric-box">
          <p className="text-[8pt] text-gray-500 uppercase font-bold">Receita Pendente</p>
          <p className="text-sm font-black text-amber-700">R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[7.5pt] text-gray-400">A receber de alunos</p>
        </div>
        <div className="print-metric-box">
          <p className="text-[8pt] text-gray-500 uppercase font-bold">Saldo Líquido</p>
          <p className={`text-sm font-black ${stats.profit >= 0 ? 'print-income-value' : 'print-expense-value'}`}>
            {stats.profit >= 0 ? '+' : '-'} R$ {Math.abs(stats.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[7.5pt] text-gray-400">Resultado após custos</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 no-print">
        <div>
          <h1 className="text-4xl font-headline font-black tracking-tight uppercase mb-2">Financeiro</h1>
          <p className="text-on-surface-variant text-sm flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            Controle total de fluxo de caixa e pagamentos de alunos.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 no-print">
          <button 
            onClick={() => setIsAddingExpense(true)}
            className="flex-1 sm:flex-none bg-surface-container border border-outline text-on-surface px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-surface transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Despesa
          </button>
          <button 
            onClick={() => window.print()}
            className="flex-1 sm:flex-none bg-primary text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 kinetic-glow"
            title="Imprimir Relatório ou Salvar como PDF"
          >
            <Printer size={18} />
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 no-print">
        <SummaryCard 
          title="Receita Realizada" 
          value={`R$ ${stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Total pago no período"
          icon={<ArrowUpRight size={24} />}
          color="bg-emerald-500"
        />
        <SummaryCard 
          title="Despesas" 
          value={`R$ ${stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Contas e gastos fixos"
          icon={<ArrowUpDown size={24} />}
          color="bg-red-500"
        />
        <SummaryCard 
          title="Receita Pendente" 
          value={`R$ ${stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="A receber de alunos"
          icon={<Clock size={24} />}
          color="bg-amber-500"
        />
        <SummaryCard 
          title="Saldo Líquido" 
          value={`R$ ${stats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Lucro real após custos"
          icon={<DollarSign size={24} />}
          color="bg-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        <div className="lg:col-span-2 bg-surface-container rounded-[40px] border border-outline p-8 shadow-2xl glass-panel min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline font-black uppercase tracking-tight flex items-center gap-3">
              <TrendingUp size={20} className="text-primary" />
              Desempenho Semestral
            </h3>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Receita</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Despesa</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface-container-high)', 
                    borderRadius: '20px', 
                    border: '1px solid var(--color-outline)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="receita" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesa" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-container rounded-[40px] border border-outline p-8 shadow-2xl glass-panel no-print">
          <h3 className="font-headline font-black uppercase tracking-tight mb-6 flex items-center gap-3">
            <Filter size={20} className="text-primary" />
            Filtros
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo de Transação</p>
              <div className="grid grid-cols-1 gap-2">
                {(['all', 'income', 'expense'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={cn(
                      "px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-between transition-all border",
                      filterType === t 
                        ? "bg-primary text-white border-primary shadow-lg" 
                        : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/50"
                    )}
                  >
                    <span>{t === 'all' ? 'Tudo' : t === 'income' ? 'Receitas' : 'Despesas'}</span>
                    {filterType === t && <CheckCircle2 size={16} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Período</p>
              <div className="grid grid-cols-1 gap-2">
                {(['month', 'year', 'all'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={cn(
                      "px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-between transition-all border",
                      filterPeriod === p 
                        ? "bg-primary text-white border-primary shadow-lg" 
                        : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/50"
                    )}
                  >
                    <span>{p === 'month' ? 'Este Mês' : p === 'year' ? 'Este Ano' : 'Histórico Total'}</span>
                    {filterPeriod === p && <CheckCircle2 size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container rounded-[48px] border border-outline overflow-hidden shadow-2xl glass-panel print-avoid-break">
        <div className="px-8 py-6 border-b border-outline bg-white/[0.02] flex items-center justify-between">
          <h3 className="font-headline font-black uppercase tracking-tight flex items-center gap-3">
            <History size={20} className="text-primary" />
            Movimentações do Período
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
            {filteredPayments.length} Registros
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Data</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Descrição</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Categoria/Aluno</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Método</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Valor</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right print-hide no-print">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/30">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group print-avoid-break">
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-on-surface">{p.date ? format(new Date(p.date + 'T12:00:00'), 'dd/MM/yyyy') : '--/--/----'}</p>
                    <p className="text-[9px] text-on-surface-variant/60 font-medium uppercase">{p.date ? format(new Date(p.date + 'T12:00:00'), 'EEEE', { locale: ptBR }) : '---'}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-on-surface">{p.description}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <div className={cn(
                         "w-1.5 h-1.5 rounded-full print-hide",
                         p.type === 'income' ? "bg-emerald-500" : "bg-red-500"
                       )} />
                       <span className="text-xs font-medium text-on-surface-variant">
                         {p.studentName || p.category || 'Geral'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 bg-surface-container-low border border-outline rounded-lg text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                      {p.method || 'PIX'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className={cn(
                      "text-sm font-black",
                      p.type === 'income' ? "text-emerald-500 print-income-value" : "text-red-500 print-expense-value"
                    )}>
                      {p.type === 'income' ? '+' : '-'} R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm",
                      p.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 print-tag print-tag-paid" : 
                      p.status === 'pending' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 print-tag print-tag-pending" : 
                      "bg-red-500/10 text-red-500 border border-red-500/20 print-tag"
                    )}>
                      <span className="print-hide">{p.status === 'paid' ? <CheckCheck size={10} /> : p.status === 'pending' ? <Clock size={10} /> : <XCircle size={10} />}</span>
                      {p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Atrasado'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right print-hide no-print">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.status === 'pending' && p.type === 'income' && onShowQRCode && (p.pixPayload || p.paymentLink) && (
                        <button 
                          onClick={() => onShowQRCode(p)}
                          className="p-2 bg-primary text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
                          title="Ver QR Code"
                        >
                          <QrCode size={16} />
                        </button>
                      )}
                      {p.status === 'pending' && p.type === 'income' && onConfirmPayment && (
                        <button 
                          onClick={() => onConfirmPayment(p.id)}
                          className="p-2 bg-emerald-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
                          title="Confirmar Recebimento"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button className="p-2 bg-surface-container-low text-on-surface-variant rounded-xl border border-outline hover:border-primary transition-all">
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="print-only-table">
              <tr className="print-avoid-break">
                <td colSpan={4} className="text-right font-bold uppercase text-[8.5pt]">
                  Totais ({filteredPayments.length} registros):
                </td>
                <td className="text-right font-black text-[9pt]">
                  <span className={stats.profit >= 0 ? "print-income-value" : "print-expense-value"}>
                    {stats.profit >= 0 ? '+' : '-'} R$ {Math.abs(stats.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="text-center text-[8pt] font-bold">
                  <span className="print-tag print-tag-paid">Balanço</span>
                </td>
                <td className="print-hide no-print"></td>
              </tr>
            </tfoot>
          </table>
          
          {filteredPayments.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-surface-container-low rounded-3xl flex items-center justify-center mx-auto mb-4 border border-outline text-on-surface-variant/20">
                <FileText size={32} />
              </div>
              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Nenhuma movimentação encontrada.</p>
            </div>
          )}
        </div>
      </div>

      {/* Printable Document Footer */}
      <div className="print-only print-doc-footer print-footer-block">
        <div>
          <p><strong>{studioName}</strong> • Relatório Gerencial Financeiro</p>
          <p>Controle contábil e administrativo confidencial gerado pelo sistema.</p>
        </div>
        <div className="text-right">
          <p>Documento emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p>Página de Controle Financeiro</p>
        </div>
      </div>

      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 no-print">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingExpense(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container p-8 rounded-[48px] border border-outline shadow-2xl relative z-10 glass-panel"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-xl">
                    <ArrowUpDown size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-black uppercase italic">Nova Despesa</h2>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Saída de Caixa</p>
                  </div>
                </div>
                <button onClick={() => setIsAddingExpense(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Descrição</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Aluguel do Estúdio"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Valor (R$)</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Data</label>
                    <input 
                      type="date" 
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      className="w-full bg-surface-container-low border border-outline rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Categoria</label>
                  <select 
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all appearance-none"
                  >
                    <option value="Aluguel">Aluguel</option>
                    <option value="Energia">Energia / Água</option>
                    <option value="Internet">Internet</option>
                    <option value="Marketing">Marketing / Ads</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAddingExpense(false)}
                    className="flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border border-outline hover:bg-white/5 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleAddExpense}
                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    Registrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon, color }: { title: string, value: string, subtitle: string, icon: React.ReactNode, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-surface-container p-8 rounded-[48px] border border-outline shadow-xl glass-panel relative overflow-hidden group"
    >
      <div className={cn("absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40", color)} />
      
      <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center mb-6 shadow-lg text-white", color)}>
        {icon}
      </div>
      
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-2">{title}</p>
      <h3 className="text-3xl font-headline font-black tracking-tighter mb-1 uppercase">{value}</h3>
      <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase">{subtitle}</p>
    </motion.div>
  );
}

function AiClassPlanner({ currentUser }: { currentUser: User | null }) {
  const [modality, setModality] = useState('');
  const [level, setLevel] = useState('Iniciante');
  const [duration, setDuration] = useState('60 min');
  const [focus, setFocus] = useState('Técnica e Coreografia');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'lesson_plans'), 
      where('instructorId', '==', currentUser.id),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleGeneratePlan = async () => {
    if (!modality) {
      toast.error('Informe a modalidade');
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      toast.error('Chave da API Gemini não configurada');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Você é um coordenador pedagógico de dança especializado no Stylo Urbano Studio. 
      Crie um plano de aula detalhado para uma aula de ${modality}.
      
      Parâmetros da Aula:
      - Nível: ${level}
      - Duração Total: ${duration}
      - Foco Principal: ${focus}
      
      O plano deve ser estruturado e incluir:
      1. Objetivos da Aula (O que os alunos devem aprender)
      2. Aquecimento e Preparação Física (específico para a modalidade)
      3. Técnica e Fundamentos (exercícios práticos)
      4. Aplicação Coreográfica ou Dinâmica de Grupo
      5. Feedback e Relaxamento
      6. Sugestão de Playlist/Músicas (estilo ou faixas específicas)
      
      Use um tom profissional, técnico e inspirador. Formate em Markdown rico com títulos e listas.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      
      const text = response.text;
      setPlan(text || null);
      
      if (text && currentUser) {
        await addDoc(collection(db, 'lesson_plans'), {
          instructorId: currentUser.id,
          instructorName: currentUser.name,
          modality,
          level,
          duration,
          focus,
          content: text,
          createdAt: new Date().toISOString()
        });
      }
      
      toast.success('Plano de aula gerado e salvo!');
    } catch (error) {
      console.error('Erro ao gerar plano com IA:', error);
      toast.error('Falha ao gerar plano com IA');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 overflow-auto h-full">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-headline font-black tracking-tight uppercase">Planejador de Aula IA</h1>
          <p className="text-on-surface-variant text-sm">Crie planos de aula personalizados com inteligência artificial.</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all"
        >
          <History size={16} />
          {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Modalidade</label>
                <input 
                  type="text" 
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  placeholder="Ex: Hip Hop, Jazz, Ballet..."
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Nível</label>
                <select 
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                >
                  <option>Iniciante</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                  <option>Open Level</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Duração</label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                >
                  <option>45 min</option>
                  <option>60 min</option>
                  <option>90 min</option>
                  <option>120 min</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Foco da Aula</label>
                <select 
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                >
                  <option>Técnica e Fundamentos</option>
                  <option>Coreografia</option>
                  <option>Expressão e Performance</option>
                  <option>Condicionamento Físico</option>
                  <option>Improvisação/Freestyle</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="w-full bg-primary text-white py-5 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
              {isGenerating ? 'Gerando Plano...' : 'Gerar Plano com IA'}
            </button>
          </div>

          {showHistory && (
            <div className="bg-surface-container p-6 rounded-[40px] border border-outline space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2">Planos Recentes</h3>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-[10px] text-on-surface-variant p-4 text-center">Nenhum plano gerado ainda.</p>
                ) : (
                  history.map(h => (
                    <button 
                      key={h.id}
                      onClick={() => setPlan(h.content)}
                      className="w-full text-left p-4 bg-surface-container-low border border-outline rounded-2xl hover:border-primary/50 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-primary">{h.modality}</span>
                        <span className="text-[8px] text-on-surface-variant">{format(new Date(h.createdAt), 'dd/MM/yy')}</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant line-clamp-1">{h.level} • {h.duration}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {plan ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-container p-10 rounded-[40px] border border-outline shadow-2xl glass-panel min-h-[600px] flex flex-col"
            >
              <div className="flex justify-between items-center mb-10 border-b border-outline pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-black uppercase tracking-tight">Plano de Aula Detalhado</h2>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Gerado por Stylo IA</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const doc = new jsPDF();
                      doc.setFontSize(22);
                      doc.text('Plano de Aula: ' + modality, 20, 30);
                      doc.setFontSize(12);
                      doc.text(`Nível: ${level} | Duração: ${duration} | Foco: ${focus}`, 20, 40);
                      
                      const splitText = doc.splitTextToSize(plan || '', 170);
                      doc.text(splitText, 20, 60);
                      doc.save(`plano-${modality.toLowerCase()}.pdf`);
                      toast.success('PDF gerado com sucesso!');
                    }}
                    className="p-3 bg-surface-container-low border border-outline rounded-xl hover:text-primary transition-all"
                    title="Baixar PDF"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(plan);
                      toast.success('Copiado para a área de transferência!');
                    }}
                    className="p-3 bg-surface-container-low border border-outline rounded-xl hover:text-primary transition-all"
                    title="Copiar"
                  >
                    <Save size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 prose prose-invert prose-sm max-w-none prose-headings:font-headline prose-headings:uppercase prose-headings:tracking-tight prose-p:text-on-surface-variant prose-li:text-on-surface-variant">
                <Markdown>{plan}</Markdown>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[600px] border-2 border-dashed border-outline rounded-[40px] flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-50">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center">
                <Wand2 size={40} className="text-on-surface-variant" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Aguardando Parâmetros</h3>
                <p className="text-sm text-on-surface-variant max-w-xs mx-auto">Preencha as informações ao lado e clique em gerar para criar seu plano de aula exclusivo.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentPortal({ 
  user, 
  students, 
  events, 
  cart, 
  setCart, 
  onOpenCart,
  onOpenQR 
}: { 
  user: User, 
  students: Student[], 
  events: ClassEvent[], 
  cart: CartItem[], 
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>, 
  onOpenCart: () => void,
  onOpenQR: (data: { url: string; title: string; amount: number }) => void 
}) {
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'messages'>('overview');
  const student = useMemo(() => students.find(s => s.email === user.email), [students, user.email]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!student) return;
    const q = query(
      collection(db, 'students', student.id, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    });
    return () => unsubscribe();
  }, [student]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !student) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: newMessage,
      type: 'text',
      timestamp: new Date().toISOString(),
      read: false
    };
    try {
      await addDoc(collection(db, 'students', student.id, 'messages'), msg);
      setNewMessage('');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const addToCart = (item: CartItem) => {
    if (cart.some(i => i.id === item.id)) {
      toast.info('Item já está no carrinho');
      return;
    }
    setCart(prev => [...prev, item]);
    toast.success('Adicionado ao carrinho!');
  };

  if (!student) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-xl font-headline font-black">Perfil de Aluno não encontrado</h2>
        <p className="text-on-surface-variant text-sm">Seu e-mail não está associado a nenhum cadastro de aluno ativo.</p>
      </div>
    );
  }

  const chartData = useMemo(() => {
    if (student.performance && student.performance.length > 0) {
      return student.performance.map(p => ({ name: p.date, score: p.score }));
    }
    return [];
  }, [student.performance]);

  const studentEvents = useMemo(() => {
    return events.filter(e => 
      e.type === 'Aula' && 
      student.classes.includes(e.title) && 
      isAfter(addMinutes(e.date, 60), new Date())
    ).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 3);
  }, [events, student.classes]);

  return (
    <div className="p-6 lg:p-10 space-y-8 overflow-auto h-full">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-[#FF9E00] flex items-center justify-center text-white text-3xl font-black shadow-xl">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-headline font-black tracking-tight uppercase">Olá, {student.name.split(' ')[0]}!</h1>
            <p className="text-on-surface-variant text-sm">Bem-vindo ao seu portal do aluno.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCardModalOpen(true)}
            className="flex items-center gap-2 px-5 py-4 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 group"
            title="Minha Carteirinha Digital & QR Code"
          >
            <QrCode size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Minha Carteirinha</span>
          </button>
        </div>
          <button 
            onClick={onOpenCart}
            className="relative p-4 bg-surface-container border border-outline rounded-2xl hover:bg-white/5 transition-all group"
          >
          <ShoppingCart size={24} className="group-hover:text-primary transition-colors" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface animate-bounce-short">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-outline overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={16} /> },
          { id: 'payments', label: 'Financeiro', icon: <CreditCard size={16} /> },
          { id: 'messages', label: 'Mensagens', icon: <MessageSquare size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
              activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-headline font-black uppercase tracking-tight">Cursos e Eventos Disponíveis</h3>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Garanta sua vaga</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {events.filter(e => e.type === 'Evento' || (e.type === 'Aula' && !student.classes.includes(e.title))).slice(0, 4).map((event) => (
                    <div key={event.id} className="p-6 bg-surface-container-low border border-outline rounded-3xl space-y-4 hover:border-primary/50 transition-all group">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          {event.type === 'Evento' ? <Megaphone size={20} /> : <Activity size={20} />}
                        </div>
                        <span className="text-lg font-black text-primary">R$ 80,00</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate">{event.title}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                          {format(event.date, "dd 'de' MMMM", { locale: ptBR })} • {event.time}
                        </p>
                      </div>
                      <button 
                        onClick={() => addToCart({
                          id: event.id,
                          title: event.title,
                          date: format(event.date, 'yyyy-MM-dd'),
                          time: event.time,
                          price: 80,
                          type: event.type === 'Evento' ? 'Evento' : 'Aula'
                        })}
                        className="w-full py-3 bg-white/5 hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-outline group-hover:border-primary/50"
                      >
                        Adicionar ao Carrinho
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel">
                <h3 className="text-lg font-headline font-black mb-6 uppercase tracking-tight">Minhas Modalidades</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {student.classes.map((cls, idx) => (
                    <div key={idx} className="p-6 bg-surface-container-low border border-outline rounded-3xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <Activity size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{cls}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">{student.turmas[idx] || 'Turma Geral'}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-on-surface-variant/30" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel">
                <h3 className="text-lg font-headline font-black mb-6 uppercase tracking-tight">Meu Desempenho</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#FF6B00' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#FF6B00" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div 
                onClick={() => setActiveTab('payments')}
                className="bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel cursor-pointer hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-headline font-black uppercase tracking-tight">Status Financeiro</h3>
                   <ChevronRight size={20} className="text-on-surface-variant" />
                </div>
                <div className={cn(
                  "p-6 rounded-3xl border flex flex-col items-center gap-4",
                  student.paymentStatus === 'paid' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"
                )}>
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center",
                    student.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    <CreditCard size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Status da Mensalidade</p>
                    <h4 className={cn(
                      "text-xl font-headline font-black uppercase",
                      student.paymentStatus === 'paid' ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {student.paymentStatus === 'paid' ? 'Em Dia' : 'Pendente'}
                    </h4>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel">
                <h3 className="text-lg font-headline font-black mb-6 uppercase tracking-tight">Próximas Aulas</h3>
                <div className="space-y-4">
                  {studentEvents.length > 0 ? studentEvents.map((event, idx) => (
                    <div key={idx} className="p-4 bg-surface-container-low border border-outline rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {event.time}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{event.title}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                          {isToday(event.date) ? 'Hoje' : format(event.date, 'dd/MM', { locale: ptBR })} • {event.instructor}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-10 text-center opacity-30 border border-dashed border-outline rounded-3xl">
                      <Calendar size={32} className="mx-auto mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma aula agendada</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-surface-container p-8 rounded-[40px] border border-outline shadow-xl glass-panel">
               <h3 className="text-xl font-headline font-black uppercase mb-6">Histórico de Pagamentos</h3>
               <div className="space-y-4">
                  {(student.payments || []).length > 0 ? (
                    (student.payments || []).sort((a, b) => b.date.localeCompare(a.date)).map((payment) => (
                      <div key={payment.id} className="p-6 bg-surface-container-low border border-outline rounded-3xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            payment.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            <DollarSign size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">R$ {payment.amount.toFixed(2)}</p>
                            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{format(new Date(payment.date + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                            payment.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                          {payment.status !== 'paid' && (payment.pixPayload || payment.paymentLink) && (
                            <button 
                              onClick={() => onOpenQR({
                                url: payment.pixPayload || payment.paymentLink || '',
                                title: payment.pixPayload ? 'PIX' : 'Link',
                                amount: payment.amount
                              })}
                              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all border border-primary/20"
                            >
                              <QrCode size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-30">
                      <CreditCard size={48} className="mx-auto mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest">Nenhum pagamento registrado</p>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'messages' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container h-[600px] rounded-[40px] border border-outline shadow-xl glass-panel flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-outline bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black">
                    S
                  </div>
                  <div>
                    <h3 className="text-lg font-headline font-black uppercase">Studio Suporte</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Online</span>
                    </div>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={14} />
                    <input 
                      type="text"
                      placeholder="Pesquisar..."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="bg-surface-container-high border border-outline rounded-xl pl-9 pr-4 py-2 text-[10px] uppercase font-bold tracking-widest outline-none focus:ring-1 focus:ring-primary w-40"
                    />
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" ref={chatScrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                  <MessageSquare size={48} />
                  <p className="text-sm font-black uppercase tracking-widest">Inicie uma conversa com o Studio</p>
                </div>
              ) : (
                messages
                  .filter(m => m.text.toLowerCase().includes(chatSearch.toLowerCase()))
                  .map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "max-w-[80%] space-y-1",
                      msg.senderId === user.id ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-3xl text-sm",
                      msg.senderId === user.id 
                        ? "bg-primary text-white rounded-tr-none" 
                        : "bg-surface-container-high text-on-surface rounded-tl-none"
                    )}>
                      {msg.type === 'payment' ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">
                            <CreditCard size={12} />
                            <span>Link de Pagamento</span>
                          </div>
                          <p>{msg.text}</p>
                          <div className="grid grid-cols-2 gap-2">
                             <a 
                               href={msg.paymentLink}
                               target="_blank"
                               rel="noopener noreferrer"
                               className={cn(
                                 "py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all",
                                 msg.senderId === user.id ? "bg-white text-primary" : "bg-primary text-white"
                               )}
                             >
                               Pagar
                             </a>
                             <button 
                               onClick={() => onOpenQR({
                                 url: msg.pixPayload || msg.paymentLink || '',
                                 title: 'Mensalidade',
                                 amount: parseFloat(msg.text.split('R$ ')[1]) || 0
                               })}
                               className={cn(
                                 "py-2 rounded-xl border flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                 msg.senderId === user.id ? "border-white/30 text-white" : "border-primary/30 text-primary"
                               )}
                             >
                                <QrCode size={12} />
                                QR Code
                             </button>
                          </div>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                    <p className="text-[9px] text-on-surface-variant font-medium px-2">
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-surface-container-low border-t border-outline flex gap-4">
              <input 
                type="text"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-surface-container-high border border-outline rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <div className="rotate-45 -translate-y-0.5">
                  <Megaphone size={24} />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Carteirinha Digital Modal */}
      <StudentDigitalCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        student={student || null}
        studioName="STYLO URBANO"
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedMock = safeStorage.getItem('mockUser') || localStorage.getItem('mockUser');
      return savedMock ? JSON.parse(savedMock) : null;
    } catch {
      return null;
    }
  });
  const [isAuthReady, setIsAuthReady] = useState<boolean>(() => {
    try {
      const savedMock = safeStorage.getItem('mockUser') || localStorage.getItem('mockUser');
      return !!savedMock;
    } catch {
      return false;
    }
  });
  const [studioName, setStudioName] = useState<string>(() => {
    return safeStorage.getItem('studioName') || 'STYLO URBANO';
  });
  const [studioLogo, setStudioLogo] = useState<string | null>(() => {
    return safeStorage.getItem('studioLogo');
  });
  const [studioColor, setStudioColor] = useState<string>(() => {
    return safeStorage.getItem('studioColor') || '#FF6B00';
  });
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    try {
      const saved = safeStorage.getItem('isSetupComplete') ?? localStorage.getItem('isSetupComplete');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [modalities, setModalities] = useState<string[]>(() => {
    const saved = safeStorage.getItem('modalities');
    return saved ? JSON.parse(saved) : [];
  });
  const [turmas, setTurmas] = useState<string[]>(() => {
    const saved = safeStorage.getItem('turmas');
    const list = saved ? JSON.parse(saved) : ['Turma Manhã', 'Turma Tarde', 'Turma Noite'];
    if (!list.includes('Turma Teste')) {
      list.push('Turma Teste');
    }
    return list;
  });
  const [turmaCapacities, setTurmaCapacities] = useState<Record<string, number>>(() => {
    const saved = safeStorage.getItem('turma_capacities');
    return saved ? JSON.parse(saved) : {
      'Turma Manhã': 20,
      'Turma Tarde': 20,
      'Turma Noite': 20,
      'Turma Teste': 15
    };
  });
  const [bankInfo, setBankInfo] = useState<{ bankName: string; pixKey: string; holderName: string }>({
    bankName: '',
    pixKey: '',
    holderName: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    upcomingClasses: { 
      enabled: true, 
      timing: '2', 
      timeUnit: 'hours', 
      channels: { whatsapp: true, push: true, sms: false, email: false },
      requestConfirmation: true 
    },
    paymentDue: { 
      enabled: true, 
      timing: '3', 
      timeUnit: 'days',
      channels: { whatsapp: true, push: true, sms: false, email: true },
      sendTime: '09:00',
      sendOnDueDate: true,
      includePix: true
    },
    promotions: { enabled: false, timing: '0', channels: { sms: false, push: true } },
    smsProvider: {
      enabled: true,
      name: 'Twilio',
      apiKey: '',
      apiSecret: '',
      fromNumber: ''
    },
    smsTemplates: {
      paymentDue: "[STYLU] Ola {aluno}, sua mensalidade de {mes} vence em {data} (R${valor}). Pague via PIX: {link}",
      upcomingClasses: "[STYLU] Ola {aluno}, lembrete da sua aula de {modalidade} hoje as {hora}. Esperamos voce!",
      overduePayment: "[STYLU] Ola {aluno}, identificamos mensalidade de {mes} pendente. Regularize pelo link: {link}",
      promotions: "[STYLU] Ola {aluno}, confira as condicoes especiais de {mes} no Studio: {promocao}"
    },
    templates: {
      upcomingClasses: "Olá {aluno}, lembrando que sua aula de {modalidade} começa às {hora}. Te esperamos no Studio!",
      paymentDue: "Olá {aluno}, sua mensalidade de {mes} está disponível para pagamento. Acesse o link: {link}",
      promotions: "Olá {aluno}, confira nossa nova promoção de {mes}: {promocao}!"
    }
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentQRModalOpen, setIsPaymentQRModalOpen] = useState(false);
  const [selectedPaymentForQR, setSelectedPaymentForQR] = useState<{ url: string; title: string; amount: number } | null>(null);
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados para atualização do sistema (Desktop)
  const [appVersion, setAppVersion] = useState(() => {
    return localStorage.getItem('app_version') || '1.1.0';
  });
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [isUpdateDownloading, setIsUpdateDownloading] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [rooms, setRooms] = useState<StudioRoom[]>(() => {
    const saved = safeStorage.getItem('studio_rooms');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Sala 1', capacity: 20 }];
  });
  const [storageMode, setStorageMode] = useState<'drive' | 'local'>(() => {
    return (safeStorage.getItem('storage_mode') as 'drive' | 'local') || 'drive';
  });
  const [autoBackupSettings, setAutoBackupSettings] = useState<AutoBackupConfig>(() => {
    const saved = safeStorage.getItem("auto_backup_settings");
    return saved ? JSON.parse(saved) : {
      enabled: true,
      frequency: "daily",
      time: "23:00",
      notifyOnFailure: true,
      channels: { push: true, email: true },
      alertEmail: "stylourbanostudio@gmail.com",
      folderName: "Stylo Urbano - Backups"
    };
  });
  const [lastBackupStatus, setLastBackupStatus] = useState<"success" | "failure" | null>(null);
  const [lastBackupError, setLastBackupError] = useState<string | null>(null);
  
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return safeStorage.getItem('last_backup_date');
  });

  const [partnerConfig, setPartnerConfig] = useState<PartnerConfig>(() => {
    const saved = safeStorage.getItem('partner_config');
    return saved ? JSON.parse(saved) : DEFAULT_PARTNER_CONFIG;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = safeStorage.getItem('shopping_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; title: string; text: string; time: string; read: boolean }[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = safeStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'dark';
  });
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (currentUser?.email) {
      setIsGoogleConnected(safeStorage.getItem(`google_calendar_connected_${currentUser.email}`) === 'true');
    }
  }, [currentUser]);

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    const saved = safeStorage.getItem('gallery');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    safeStorage.setItem('gallery', JSON.stringify(gallery));
  }, [gallery]);

  const handleSaveToGallery = (student: Student) => {
    const newItem: GalleryItem = {
      id: crypto.randomUUID(),
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      studentAvatar: student.avatar,
      modality: student.classes?.[0] || 'N/A',
      plan: student.contractedPlan || 'N/A',
      savedAt: new Date().toISOString(),
      savedBy: currentUser?.name || 'Sistema'
    };
    setGallery(prev => [newItem, ...prev]);
    toast.success('Aluno salvo na galeria com sucesso!');
  };
  const {
    isInstalled: isPWAInstalled,
    isInstallable,
    isIOS: isPWAIOS,
    isOnline,
    needRefresh,
    isCheckingUpdate: isPWACheckingUpdate,
    appVersion: pwaVersion,
    install: triggerPWAInstall,
    checkForUpdates: pwaCheckForUpdates,
    applyUpdate: pwaApplyUpdate,
    dismissUpdate: pwaDismissUpdate
  } = usePWA();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const effectiveIsInstalled = isInstalled || isPWAInstalled;
  const effectiveIsIOS = isIOS || isPWAIOS;

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      toast.success('Stylo Urbano instalado com sucesso no seu dispositivo!');
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        const installed = await triggerPWAInstall();
        if (installed) {
          setShowInstallModal(false);
          return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstalled(true);
          setShowInstallModal(false);
          toast.success('Aplicativo instalado com sucesso!');
        }
      } catch (err) {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleSyncCalendar = useCallback(async () => {
    if (!currentUser?.email) return;
    
    setIsSyncing(true);
    try {
      // 1. PUSH local events TO Google
      const syncEvents = currentUser.role === 'Gerente' 
        ? events 
        : events.filter(e => e.instructorEmail === currentUser.email);
      
      const pushResponse = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          events: syncEvents
        })
      });

      if (pushResponse.ok) {
        const result = await pushResponse.json();
        if (result.status === 'success' && result.results) {
          // Update local events with Google IDs
          for (const res of result.results) {
            if (res.googleEventId) {
              const eventRef = doc(db, 'events', res.id);
              await updateDoc(eventRef, { googleEventId: res.googleEventId });
            }
          }
        }
      }

      // 2. PULL Google events TO App
      const pullResponse = await fetch('/api/calendar/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });

      if (pullResponse.ok) {
        const importResult = await pullResponse.json();
        if (importResult.status === 'success' && importResult.events) {
          const importedEvents = importResult.events;
          let newItemsCount = 0;

          for (const impEvent of importedEvents) {
            const exists = events.find(e => e.googleEventId === impEvent.googleEventId);
            if (!exists) {
              await addDoc(collection(db, 'events'), {
                ...impEvent,
                date: new Date(impEvent.date + 'T12:00:00'),
                createdAt: serverTimestamp()
              });
              newItemsCount++;
            }
          }
          if (newItemsCount > 0) {
            toast.success(`${newItemsCount} novos eventos importados do Google!`);
          }
        }
      }

      toast.success('Sincronização bidirecional concluída!');
    } catch (error) {
      console.error("Error syncing calendar:", error);
      toast.error("Erro na sincronização com Google Calendar.");
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, events]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsGoogleConnected(true);
        if (currentUser?.email) {
          safeStorage.setItem(`google_calendar_connected_${currentUser.email}`, 'true');
          // Trigger initial sync
          handleSyncCalendar();
        }
        toast.success('Google conectado com sucesso!');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentUser]);

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Erro de configuração.");
        return;
      }

      window.open(data.url, 'google_oauth', 'width=600,height=700');
    } catch (error) {
      console.error("Error connecting to Google:", error);
      toast.error("Erro ao conectar com o Google.");
    }
  };

  const handleUpdateAutoBackupSettings = async (newSettings: AutoBackupConfig) => {
    setAutoBackupSettings(newSettings);
    safeStorage.setItem("auto_backup_settings", JSON.stringify(newSettings));
    try {
      await updateDoc(doc(db, "config", "studio"), {
        autoBackup: newSettings,
        updatedAt: serverTimestamp()
      });
      toast.success("Configurações de backup automático salvas!");
    } catch (error) {
      console.error("Error updating auto-backup config:", error);
      toast.error("Erro ao salvar configurações de backup no banco de dados.");
    }
  };

  const handleSaveToDrive = async () => {
    if (!isGoogleConnected) {
      handleConnectGoogle();
      return;
    }
    if (!currentUser?.email) return;

    setIsSavingToDrive(true);
    try {
      const backupData = {
        users,
        students,
        events,
        modalities,
        rooms,
        bankInfo,
        notificationSettings,
        autoBackupSettings,
        timestamp: new Date().toISOString(),
        version: "1.2",
        exportedBy: currentUser.name
      };

      const response = await fetch("/api/backup/auto-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          backupData,
          alertSettings: {
            notifyOnFailure: autoBackupSettings.notifyOnFailure,
            alertEmail: autoBackupSettings.alertEmail || currentUser.email,
            channels: autoBackupSettings.channels
          }
        })
      });

      const result = await response.json();
      if (response.ok && result.status === "success") {
        const now = new Date().toISOString();
        setLastBackupDate(now);
        setLastBackupStatus("success");
        setLastBackupError(null);
        safeStorage.setItem("last_backup_date", now);
        toast.success("Backup salvo com sucesso no Google Drive!");
      } else {
        throw new Error(result.error || result.details || "Erro ao salvar no Google Drive");
      }
    } catch (error: any) {
      console.error("Error saving to Drive:", error);
      setLastBackupStatus("failure");
      setLastBackupError(error?.message || "Falha na sincronização");
      toast.error(`Falha no Backup: ${error?.message || "Verifique sua conexão com o Google Drive"}`);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'studio'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.name) setStudioName(data.name);
        if (data.logo) setStudioLogo(data.logo);
        if (data.color) setStudioColor(data.color);
        if (data.modalities) setModalities(data.modalities);
        if (data.turmas) setTurmas(data.turmas);
        if (data.turmaCapacities) {
          setTurmaCapacities(data.turmaCapacities);
          safeStorage.setItem('turma_capacities', JSON.stringify(data.turmaCapacities));
        }
        if (data.bankInfo) setBankInfo(data.bankInfo);
        if (data.notificationSettings) setNotificationSettings(data.notificationSettings);
        if (data.autoBackup) setAutoBackupSettings(data.autoBackup);
        if (data.lastBackupStatus) setLastBackupStatus(data.lastBackupStatus);
        if (data.lastBackupError) setLastBackupError(data.lastBackupError);
        if (data.partnerConfig) {
          setPartnerConfig(data.partnerConfig);
          safeStorage.setItem('partner_config', JSON.stringify(data.partnerConfig));
        }
        if (data.isSetupComplete !== undefined) {
          setIsSetupComplete(data.isSetupComplete);
          safeStorage.setItem('isSetupComplete', String(data.isSetupComplete));
          try {
            localStorage.setItem('isSetupComplete', String(data.isSetupComplete));
          } catch (e) {
            console.warn(e);
          }
        }
      }
    }, (error) => {
      if (auth.currentUser) {
        console.error("Error listening to studio config:", error);
      }
    });
    return () => unsubscribe();
  }, []);

  const lastMessageId = useRef<string | null>(null);
  const lastEventId = useRef<string | null>(null);

  useEffect(() => {
    (window as any).openPaymentModal = (studentId: string) => {
      setTargetStudentId(studentId);
      setIsPaymentModalOpen(true);
    };
    return () => { delete (window as any).openPaymentModal; };
  }, []);

  const downloadQRCode = (canvasId: string, title: string) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR-Code-${title.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('QR Code baixado com sucesso!');
    }
  };

  const handleSendPaymentLink = async () => {
    if (!targetStudentId || !paymentAmount || !currentUser) return;

    const amount = parseFloat(paymentAmount.replace(',', '.'));
    if (isNaN(amount)) {
      toast.error('Valor inválido');
      return;
    }

    const paymentLink = `https://checkout.exemplo.com/pay?amount=${amount}&desc=${encodeURIComponent(paymentDescription)}&ref=${targetStudentId}`;
    let pixPayload = "";

    if (bankInfo?.pixKey) {
      pixPayload = generatePixPayload(
        bankInfo.pixKey,
        bankInfo.holderName || "Studio",
        "SAO PAULO",
        amount,
        paymentDescription || "Mensalidade/Aula"
      );
    }
    
    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: `Link de pagamento gerado: R$ ${amount.toFixed(2)} - ${paymentDescription || 'Mensalidade/Aula'}`,
      type: 'payment',
      paymentLink,
      pixPayload,
      timestamp: new Date().toISOString(),
      read: false
    };

    try {
      const paymentRef = await addDoc(collection(db, 'payments'), {
        studentId: targetStudentId,
        studentName: students.find(s => s.id === targetStudentId)?.name || 'N/A',
        amount: amount,
        description: paymentDescription || 'Mensalidade/Aula',
        status: 'pending',
        type: 'income',
        method: 'Link de Pagamento',
        paymentLink,
        pixPayload,
        date: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp()
      });

      await addDoc(collection(db, 'students', targetStudentId, 'messages'), {
        ...newMessage,
        paymentId: paymentRef.id
      });
      
      toast.success('Link de pagamento enviado!');
      setIsPaymentModalOpen(false);
      
      // Open QR Code Modal
      setSelectedPaymentForQR({
        url: pixPayload || paymentLink,
        title: paymentDescription || 'Mensalidade/Aula',
        amount: amount
      });
      setIsPaymentQRModalOpen(true);
      
      setPaymentAmount('');
      setPaymentDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment || payment.type !== 'income') return;

    try {
      const paymentRef = doc(db, 'payments', paymentId);
      await updateDoc(paymentRef, {
        status: 'paid',
        updatedAt: serverTimestamp()
      });

      if (payment.studentId) {
        const studentRef = doc(db, 'students', payment.studentId);
        await updateDoc(studentRef, {
          paymentStatus: 'paid',
          updatedAt: serverTimestamp()
        });
      }

      toast.success('Pagamento confirmado!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'payments');
    }
  };

  const handleShowQRCode = (payment: any) => {
    setSelectedPaymentForQR({
      url: payment.pixPayload || payment.paymentLink || '',
      title: payment.description || 'Pagamento',
      amount: payment.amount || 0
    });
    setIsPaymentQRModalOpen(true);
  };

  // Notification for global messages
  useEffect(() => {
    if (!currentUser || !auth.currentUser) return;

    const q = query(
      collection(db, 'global_messages'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const msg = change.doc.data() as Message;
          // Don't notify the sender
          if (msg.senderId !== currentUser.id) {
            const notificationId = `global-${change.doc.id}`;
            // Use functional update to avoid dependency on notifications array
            setNotifications(prev => {
              if (prev.some(n => n.id === notificationId)) return prev;
              
              toast.info(`Novo aviso de ${msg.senderName}`, {
                description: msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text,
              });

              return [{
                id: notificationId,
                title: `Novo Aviso: ${msg.senderName}`,
                text: msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text,
                time: 'Agora',
                read: false
              }, ...prev];
            });
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'global_messages');
    });

    return () => unsubscribe();
  }, [currentUser?.id, auth.currentUser?.uid]);

  // Notification for instructors about upcoming classes (24h and 1h reminders)
  useEffect(() => {
    if (currentUser?.role !== 'Instrutor' || events.length === 0) return;

    const checkClasses = () => {
      const now = new Date();
      const in24Hours = addDays(now, 1);

      events.forEach(event => {
        if (event.instructorEmail !== currentUser.email || event.type !== 'Aula') return;

        const eventDate = new Date(event.date);
        const diffMs = eventDate.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // 24h Reminder
        if (diffMinutes > 0 && diffMinutes <= 1440) {
          const id24h = `class-24h-${event.id}`;
          if (!notifications.some(n => n.id === id24h)) {
            const text = `Você tem uma aula de ${event.title} às ${event.time} amanhã.`;
            setNotifications(prev => [{
              id: id24h,
              title: 'Aula Próxima',
              text,
              time: format(now, 'HH:mm'),
              read: false
            }, ...prev]);
            
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification('Aula Próxima', { body: text });
            }
          }
        }

        // 1h Reminder (as requested)
        if (diffMinutes >= 55 && diffMinutes <= 65) {
          const id1h = `reminder-1h-${event.id}`;
          if (!notifications.some(n => n.id === id1h)) {
            const text = `Sua aula "${event.title}" começa em 1 hora (${event.time}). Alunos matriculados: ${event.enrolled || 0}.`;
            setNotifications(prev => [{
              id: id1h,
              title: 'Lembrete de Aula',
              text,
              time: format(now, 'HH:mm'),
              read: false
            }, ...prev]);
            
            toast.info('Lembrete de Aula', {
              description: text,
              duration: 10000,
            });

            if ("Notification" in window && Notification.permission === "granted") {
              new Notification('Lembrete de Aula', { body: text });
            }
          }
        }
      });
    };

    checkClasses();
    const interval = setInterval(checkClasses, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser, events, notifications]);

  // Auth Listener
  useEffect(() => {
    // No mock data seeding. Application starts clean.
  }, []);

  // Notificação de atualização bem-sucedida ao carregar a página pela primeira vez na nova versão
  useEffect(() => {
    const isUpdated = localStorage.getItem('app_version') === '1.2.0';
    const alreadyNotified = localStorage.getItem('v120_notified') === 'true';
    if (isUpdated && !alreadyNotified) {
      localStorage.setItem('v120_notified', 'true');
      toast.success('Aplicativo atualizado com sucesso!', {
        description: 'Você está utilizando a versão de sistema mais recente (v1.2.0). Aproveite os novos planos!',
        duration: 8000
      });
    }
  }, []);

  // Verificar atualizações automaticamente após login bem sucedido no Desktop
  useEffect(() => {
    if (!currentUser) return;

    // Verificar se é Desktop (viewport >= 1024px)
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    // Verificar se já buscou atualizações nesta sessão para não repetir seguidamente
    const alreadyChecked = sessionStorage.getItem('update_checked') === 'true';
    if (alreadyChecked) return;

    // Se já está na versão 1.2.0, não tem do que atualizar (está atualizado)
    const currentVer = localStorage.getItem('app_version') || '1.1.0';
    if (currentVer === '1.2.0') return;

    // Iniciar a procura automática com um elegante tempo de delay pós-carga (ex: 2.5s)
    const timer = setTimeout(() => {
      sessionStorage.setItem('update_checked', 'true');
      setIsCheckingForUpdates(true);

      // Simula uma requisição com atraso de rede suave da busca de atualizações
      setTimeout(() => {
        setIsCheckingForUpdates(false);
        setIsUpdateConfirmOpen(true);
        toast.info('Nova atualização de sistema disponível!', {
          description: 'A versão v1.2.0 foi identificada na nuvem.',
          duration: 4000
        });
      }, 2000);
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentUser]);

  // Efeito para download e finalização da instalação simulada
  useEffect(() => {
    if (!isUpdateDownloading) return;

    const interval = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Grava sucesso na máquina do usuário
          localStorage.setItem('app_version', '1.2.0');
          setAppVersion('1.2.0');
          
          setTimeout(() => {
            setIsUpdateDownloading(false);
            window.location.reload();
          }, 1500);

          return 100;
        }
        
        // Simulação de velocidade aleatória de internet
        const increment = Math.round(Math.random() * 15) + 8;
        return Math.min(prev + increment, 100);
      });
    }, 450); // cerca de 3 a 5 segundos totais

    return () => clearInterval(interval);
  }, [isUpdateDownloading]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'users', 'connection-test'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();

    const safetyTimer = setTimeout(() => {
      setIsAuthReady(true);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Check for mock session first if no firebase user
      if (!firebaseUser) {
        const mockUserStr = safeStorage.getItem('mockUser') || localStorage.getItem('mockUser');
        if (mockUserStr) {
          try {
            setCurrentUser(JSON.parse(mockUserStr));
          } catch (e) {
            console.warn("Invalid mockUser in storage", e);
          }
          setIsAuthReady(true);
          return;
        }
      }

      if (firebaseUser) {
        try {
          // Request Notification Permission
          if (messaging) {
            try {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                const token = await getToken(messaging, {
                  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
                });
                if (token) {
                  await updateDoc(doc(db, 'users', firebaseUser.uid), { fcmToken: token });
                }
              }
            } catch (err) {
              console.error('Error getting FCM token:', err);
            }
          }

          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const isAdminEmail = ['stylourbanostudio@gmail.com', 'khally.sul@gmail.com'].includes(firebaseUser.email || '');
            
            if (isAdminEmail && userData.role !== 'Gerente') {
              const updatedUser = { ...userData, role: 'Gerente' as UserRole };
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'Gerente' });
              setCurrentUser(updatedUser);
            } else {
              setCurrentUser(userData);
            }

            if (userData.role === 'Aluno' || (isAdminEmail && userData.role !== 'Gerente')) {
              setSelectedStudentId(userData.id);
            }
            if (userData.mustChangePassword) {
              setCurrentScreen('my-profile');
              toast.info('Por favor, altere sua senha padrão para continuar.');
            }
          } else {
            // Bootstrap Admin or Default User
            const role: UserRole = ['stylourbanostudio@gmail.com', 'khally.sul@gmail.com'].includes(firebaseUser.email || '') ? 'Gerente' : 'Aluno';
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role,
              avatar: firebaseUser.photoURL || undefined,
              notifications: {
                email: true,
                push: true,
                marketing: false
              }
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            
            if (role === 'Aluno') {
              const studentDoc = await getDoc(doc(db, 'students', firebaseUser.uid));
              if (!studentDoc.exists()) {
                const newStudent: Student = {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || 'Aluno',
                  email: firebaseUser.email || '',
                  contact: '',
                  address: '',
                  document: '',
                  birthDate: '',
                  classes: ['Danças Urbanas'],
                  turmas: ['Turma Noite'],
                  status: 'active',
                  paymentStatus: 'pending',
                  joinDate: new Date().toISOString(),
                  planType: 'Studio',
                  contractedPlan: 'Mensal',
                  avatar: firebaseUser.photoURL || undefined,
                  attendance: [],
                  performance: [],
                  feedbacks: [],
                  notes: [],
                  messages: []
                };
                await setDoc(doc(db, 'students', firebaseUser.uid), newStudent);
              }
              setSelectedStudentId(firebaseUser.uid);
            }
            
            setCurrentUser(newUser);
          }
        } catch (error) {
          console.warn("Error fetching user profile (using offline fallback):", error);
          const isAdminEmail = ['stylourbanostudio@gmail.com', 'khally.sul@gmail.com'].includes(firebaseUser.email || '');
          const role: UserRole = isAdminEmail ? 'Gerente' : 'Aluno';
          const fallbackUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || (isAdminEmail ? 'Administrador' : 'Aluno'),
            email: firebaseUser.email || '',
            role,
            avatar: firebaseUser.photoURL || undefined,
            notifications: {
              email: true,
              push: true,
              marketing: false
            }
          };
          setCurrentUser(fallbackUser);
          if (fallbackUser.role === 'Aluno' || isAdminEmail) {
            setSelectedStudentId(fallbackUser.id);
          }
        }
      } else {
        const mockUserStr = safeStorage.getItem('mockUser') || localStorage.getItem('mockUser');
        if (mockUserStr) {
          try {
            setCurrentUser(JSON.parse(mockUserStr));
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setIsAuthReady(true);
    });
    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribes: (() => void)[] = [];

    try {
      const isStaff = currentUser.role !== 'Aluno';

      // Listen to Students
      const studentsQuery = isStaff 
        ? collection(db, 'students')
        : query(collection(db, 'students'), where('id', '==', currentUser.id));

      unsubscribes.push(onSnapshot(studentsQuery, (snapshot) => {
        const studentsList = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          attendance: [],
          performance: [],
          feedbacks: [],
          notes: [],
          messages: []
        } as Student));
        setStudents(studentsList);
        if (studentsList.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studentsList[0].id);
        }
      }, (error) => {
        console.warn("Students listener error:", error);
        // Only throw if it's a critical error for the current user's role
        if (isStaff && (currentUser.role === 'Gerente' || currentUser.role === 'Recepcionista')) {
          handleFirestoreError(error, OperationType.GET, 'students');
        }
      }));

      // Listen to Users
      unsubscribes.push(onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => doc.data() as User));
      }, (error) => console.warn("Users listener error:", error)));

      // Subcollections Listeners (Collection Group) - Role-aware filtering

      const setupCollectionGroupListener = (collectionName: string, setter: (map: Record<string, any[]>) => void) => {
        // If Aluno, we should ideally filter by studentId, but collectionGroup rules might still block
        // For now, we only listen if Staff, or we'd need to change the query to a collection query per student
        if (!isStaff && collectionName === 'notes') return; // Alunos can't see notes

        const q = isStaff 
          ? collectionGroup(db, collectionName)
          : query(collectionGroup(db, collectionName), where('studentId', '==', currentUser.id));

        unsubscribes.push(onSnapshot(q, (snapshot) => {
          const map: Record<string, any[]> = {};
          snapshot.docs.forEach(doc => {
            const studentId = doc.ref.parent.parent?.id || (doc.data() as any).studentId;
            if (studentId) {
              if (!map[studentId]) map[studentId] = [];
              map[studentId].push({ id: doc.id, ...doc.data() });
            }
          });
          setter(map);
        }, (error) => {
          console.warn(`${collectionName} listener error:`, error);
        }));
      };

      setupCollectionGroupListener('attendance', (map) => {
        setStudents(prev => prev.map(s => ({
          ...s,
          attendance: (map[s.id] || []).sort((a, b) => b.date.localeCompare(a.date))
        })));
      });

      setupCollectionGroupListener('performance', (map) => {
        setStudents(prev => prev.map(s => ({
          ...s,
          performance: (map[s.id] || []).sort((a, b) => b.date.localeCompare(a.date))
        })));
      });

      setupCollectionGroupListener('feedbacks', (map) => {
        setStudents(prev => prev.map(s => ({
          ...s,
          feedbacks: (map[s.id] || []).sort((a, b) => b.date.localeCompare(a.date))
        })));
      });

      setupCollectionGroupListener('notes', (map) => {
        setStudents(prev => prev.map(s => ({
          ...s,
          notes: (map[s.id] || []).sort((a, b) => b.date.localeCompare(a.date))
        })));
      });

      // Messages needs special handling for notifications
      const msgQuery = isStaff 
        ? collectionGroup(db, 'messages')
        : query(collectionGroup(db, 'messages'), where('studentId', '==', currentUser.id));

      unsubscribes.push(onSnapshot(msgQuery, (snapshot) => {
        const map: Record<string, any[]> = {};
        snapshot.docs.forEach(doc => {
          const studentId = doc.ref.parent.parent?.id || (doc.data() as any).studentId;
          if (studentId) {
            if (!map[studentId]) map[studentId] = [];
            const data = doc.data();
            map[studentId].push({ id: doc.id, ...data });

            if (isStaff && data.sender === 'student' && !data.read) {
              if (lastMessageId.current !== doc.id) {
                lastMessageId.current = doc.id;
                if (Notification.permission === 'granted') {
                  new Notification('Nova Mensagem de Aluno', { body: data.text, icon: '/logo.png' });
                }
              }
            }
          }
        });
        setStudents(prev => prev.map(s => ({
          ...s,
          messages: (map[s.id] || []).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        })));
      }, (error) => console.warn("Messages listener error:", error)));

      // Listen to Events
      unsubscribes.push(onSnapshot(collection(db, 'events'), (snapshot) => {
        const eventsList = snapshot.docs.map(doc => {
          const data = doc.data();
          const event = {
            id: doc.id,
            ...data,
            date: data.date.toDate()
          } as ClassEvent;

          if (isStaff && (event.type === 'Alteração' || event.type === 'Feriado')) {
            if (lastEventId.current !== doc.id) {
              lastEventId.current = doc.id;
              if (Notification.permission === 'granted') {
                new Notification('Alteração na Agenda', { body: `${event.title} - ${event.time}`, icon: '/logo.png' });
              }
            }
          }
          return event;
        });
        setEvents(eventsList);
      }, (error) => console.warn("Events listener error:", error)));

      // Listen to Payments
      const paymentsQuery = isStaff
        ? query(collection(db, 'payments'), orderBy('date', 'desc'))
        : query(collection(db, 'payments'), where('studentId', '==', currentUser.id), orderBy('date', 'desc'));

      unsubscribes.push(onSnapshot(paymentsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord));
        setPayments(data);
      }, (error) => {
        console.warn("Payments listener error:", error);
        if (isStaff && (currentUser.role === 'Gerente' || currentUser.role === 'Recepcionista')) {
          handleFirestoreError(error, OperationType.LIST, 'payments');
        }
      }));

    } catch (e) {
      console.error("Error setting up listeners:", e);
    }

    // Foreground FCM listener
    let unsubFCM: (() => void) | undefined;
    if (messaging) {
      unsubFCM = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'Notificação', {
            body: payload.notification?.body,
            icon: '/logo.png'
          });
        }
      });
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
      if (unsubFCM) unsubFCM();
    };
  }, [currentUser]);

  // Seed Data if empty
  useEffect(() => {
    if (!currentUser || !isAuthReady) return;

    const seedData = async () => {
      try {
        const studentsSnap = await getDocs(collection(db, 'students'));
        const usersSnap = await getDocs(collection(db, 'users'));
        const eventsSnap = await getDocs(collection(db, 'events'));

        // Only seed if the database is completely empty (except for the current user)
        if (studentsSnap.empty && usersSnap.size <= 1 && eventsSnap.empty) {
          // We no longer auto-seed mock data to ensure a clean installation.
          // The user can use the "Generate Test Data" buttons in Settings if needed.
          console.log('Clean installation detected. No mock data seeded.');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'seeding');
      }
    };
    
    seedData();
  }, [currentUser, isAuthReady]);

  useEffect(() => {
    safeStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', studioColor);
  }, [studioColor]);

  useEffect(() => {
    safeStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    safeStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeStorage.setItem('turmas', JSON.stringify(turmas));
  }, [turmas]);

  useEffect(() => {
    safeStorage.setItem('modalities', JSON.stringify(modalities));
  }, [modalities]);

  useEffect(() => {
    safeStorage.setItem('bankInfo', JSON.stringify(bankInfo));
  }, [bankInfo]);

  useEffect(() => {
    if (showNotifications && notifications.some(n => !n.read)) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [showNotifications, notifications]);

  useEffect(() => {
    safeStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    safeStorage.setItem('shopping_cart', JSON.stringify(cart));
  }, [cart]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (currentUser?.mustChangePassword && currentScreen !== 'my-profile') {
      setCurrentScreen('my-profile');
      toast.info('Por favor, altere sua senha padrão para continuar.');
    }
  }, [currentUser, currentScreen]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error('Erro ao entrar com Google');
    }
  };

  const handleQuickLogin = (role: UserRole = 'Gerente') => {
    const demoUser: User = {
      id: role === 'Gerente' ? 'demo-gerente-id' : 'demo-instrutor-id',
      name: role === 'Gerente' ? 'Gerente Demonstração' : 'Instrutor Demonstração',
      email: role === 'Gerente' ? 'admin@stylourbano.com' : 'instrutor@stylourbano.com',
      role: role,
      notifications: { email: true, push: true, marketing: false },
      password: '123'
    };
    setCurrentUser(demoUser);
    setIsAuthReady(true);
    safeStorage.setItem('mockUser', JSON.stringify(demoUser));
    localStorage.setItem('mockUser', JSON.stringify(demoUser));
    const isDone = (safeStorage.getItem('isSetupComplete') ?? localStorage.getItem('isSetupComplete')) === 'true';
    setIsSetupComplete(isDone);
    setCurrentScreen(isDone ? 'dashboard' : 'setup');
    toast.success(`Acesso rápido realizado como ${role}!`);
  };

  const handleEmailLogin = async (emailOrLogin: string, pass: string) => {
    try {
      // Try real Firebase Auth first
      await signInWithEmailAndPassword(auth, emailOrLogin, pass);
    } catch (error: any) {
      console.log('Firebase Auth failed, trying Firestore fallback...', error.code);
      
      // Fallback: Check Firestore users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', emailOrLogin));
      const querySnapshot = await getDocs(q);
      
      let userData: User | null = null;
      
      if (!querySnapshot.empty) {
        userData = querySnapshot.docs[0].data() as User;
      } else {
        // Try searching by name if email didn't match (as requested: "podendo criar um nome de login")
        const q2 = query(usersRef, where('name', '==', emailOrLogin));
        const querySnapshot2 = await getDocs(q2);
        if (!querySnapshot2.empty) {
          userData = querySnapshot2.docs[0].data() as User;
        }
      }

      if (userData && userData.password === pass) {
        // Success! Manually set current user
        setCurrentUser(userData);
        setIsAuthReady(true);
        // Persist mock session
        localStorage.setItem('mockUser', JSON.stringify(userData));
        safeStorage.setItem('mockUser', JSON.stringify(userData));
        return;
      }

      // Quick fallback for demo accounts
      const lower = emailOrLogin.trim().toLowerCase();
      if (lower === 'admin' || lower === 'gerente' || lower === 'admin@stylourbano.com' || lower === 'teste') {
        const demoUser: User = {
          id: 'demo-gerente-id',
          name: 'Gerente Administrativo',
          email: 'admin@stylourbano.com',
          role: 'Gerente',
          notifications: { email: true, push: true, marketing: false },
          password: pass || '123'
        };
        setCurrentUser(demoUser);
        setIsAuthReady(true);
        safeStorage.setItem('mockUser', JSON.stringify(demoUser));
        localStorage.setItem('mockUser', JSON.stringify(demoUser));
        const isDone = (safeStorage.getItem('isSetupComplete') ?? localStorage.getItem('isSetupComplete')) === 'true';
        setIsSetupComplete(isDone);
        setCurrentScreen(isDone ? 'dashboard' : 'setup');
        toast.success('Login de teste realizado com sucesso!');
        return;
      }

      // If both failed, throw the original error
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('E-mail ou senha incorretos');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('E-mail inválido');
      } else {
        toast.error('Erro ao entrar com e-mail e senha');
      }
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('mockUser');
      safeStorage.removeItem('mockUser');
      setCurrentUser(null);
      setCurrentScreen('dashboard');
      toast.info('Sessão encerrada.');
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      users,
      students,
      events,
      modalities,
      rooms,
      bankInfo,
      notificationSettings,
      timestamp: new Date().toISOString(),
      version: '1.1'
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-estudio-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup exportado localmente!');
  };

  const handleCheckIn = async (
    studentId: string, 
    className: string, 
    metadata?: { partnerToken?: string; isExtraClass?: boolean; allowExceeded?: boolean }
  ) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const targetStudent = students.find(s => s.id === studentId);

      // Check plan limits if this is a standard check-in (not explicitly allowed or extra)
      if (targetStudent && !metadata?.allowExceeded && !metadata?.isExtraClass) {
        const usage = calculateStudentClassUsage(targetStudent);
        if (usage.isExceeded) {
          toast.error(`Limite do plano atingido (${usage.monthlyClasses}/${usage.monthlyLimit} aulas). Confirme com aula extra/avulsa.`);
          return;
        }
      }

      const isPartner = targetStudent && targetStudent.planType !== 'Studio';
      const newAttendanceRecord = {
        id: `a${Date.now()}`,
        date: today,
        present: true,
        className,
        instructor: currentUser?.name || 'Sistema',
        partner: isPartner ? targetStudent.planType : undefined,
        partnerToken: metadata?.partnerToken || (isPartner ? targetStudent.partnerMemberId : undefined),
        isExtraClass: metadata?.isExtraClass || false
      };
      const attendanceRef = collection(db, 'students', studentId, 'attendance');
      await addDoc(attendanceRef, newAttendanceRecord);

      // Optimistically update state so Dashboard updates in real time
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            attendance: [newAttendanceRecord, ...(s.attendance || [])]
          };
        }
        return s;
      }));

      if (isPartner) {
        toast.success(`Check-in ${targetStudent.planType} validado e registrado com sucesso!`);
      } else if (metadata?.isExtraClass) {
        toast.success('Aula extra / reposição registrada com sucesso!');
      } else {
        toast.success('Check-in realizado com sucesso!');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `students/${studentId}/attendance`);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success('Aluno excluído com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
    }
  };

  const selectedStudent = useMemo(() => 
    students.find(s => s.id === selectedStudentId) || null
  , [students, selectedStudentId]);

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      const { id, attendance, performance, feedbacks, notes, messages, ...data } = updatedStudent;
      await updateDoc(doc(db, 'students', id), data as any);
      toast.success('Dados do aluno atualizados!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${updatedStudent.id}`);
    }
  };

  const handleAddExpense = async (expenseData: { amount: number; description: string; category: string; date: string }) => {
    try {
      await addDoc(collection(db, 'payments'), {
        ...expenseData,
        amount: Number(expenseData.amount),
        type: 'expense',
        status: 'paid',
        timestamp: serverTimestamp()
      });
      toast.success('Despesa registrada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  };

  if (!isAuthReady && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" theme={theme} richColors />
        <LoginScreen 
          onGoogleLogin={handleLogin} 
          onEmailLogin={handleEmailLogin} 
          onQuickLogin={handleQuickLogin}
          studioName={studioName} 
          studioLogo={studioLogo}
          isInstalled={isInstalled}
          deferredPrompt={deferredPrompt}
          isIOS={isIOS}
          onInstallClick={handleInstallClick}
        />
        <PWAUpdateBanner
          needRefresh={needRefresh}
          isOnline={isOnline}
          onApplyUpdate={pwaApplyUpdate}
          onDismiss={pwaDismissUpdate}
          appVersion={pwaVersion}
        />
        <InstallAppModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          isInstalled={effectiveIsInstalled}
          deferredPrompt={deferredPrompt}
          onInstallNative={handleInstallClick}
          isIOS={effectiveIsIOS}
          studioName={studioName}
          studioLogo={studioLogo}
          onCheckForUpdates={pwaCheckForUpdates}
          isCheckingUpdate={isPWACheckingUpdate || isCheckingForUpdates}
          onApplyUpdate={pwaApplyUpdate}
          needRefresh={needRefresh}
          appVersion={pwaVersion}
        />
      </>
    );
  }

  if (currentUser.mustChangePassword) {
    return (
      <>
        <Toaster position="top-right" theme={theme} richColors />
        <ChangePasswordScreen 
          user={currentUser} 
          onPasswordChanged={async (newPassword) => {
            try {
              await updateDoc(doc(db, 'users', currentUser.id), {
                password: newPassword,
                mustChangePassword: false
              });
              setCurrentUser({ ...currentUser, password: newPassword, mustChangePassword: false });
              toast.success('Senha alterada com sucesso!');
            } catch (error) {
              console.error("Error updating password:", error);
              toast.error("Erro ao atualizar senha no servidor.");
            }
          }} 
        />
      </>
    );
  }

  const handleCompleteSetup = async (name: string, logo: string | null, color: string, mods: string[], roomsList: StudioRoom[], mode: 'drive' | 'local') => {
    setStudioName(name);
    setStudioLogo(logo);
    setStudioColor(color);
    setModalities(mods);
    setRooms(roomsList);
    setStorageMode(mode);
    setIsSetupComplete(true);
    
    try {
      await setDoc(doc(db, 'config', 'studio'), {
        name,
        logo,
        color,
        modalities: mods,
        rooms: roomsList,
        storageMode: mode,
        isSetupComplete: true,
        updatedAt: serverTimestamp()
      });
      toast.success('Configuração salva na nuvem!');
    } catch (error) {
      console.error("Error saving studio config:", error);
      toast.error('Erro ao salvar configuração na nuvem, mas salva localmente.');
    }

    safeStorage.setItem('studioName', name);
    if (logo) safeStorage.setItem('studioLogo', logo);
    safeStorage.setItem('studioColor', color);
    safeStorage.setItem('modalities', JSON.stringify(mods));
    safeStorage.setItem('studio_rooms', JSON.stringify(roomsList));
    safeStorage.setItem('storage_mode', mode);
    safeStorage.setItem('isSetupComplete', 'true');
    try {
      localStorage.setItem('isSetupComplete', 'true');
    } catch (e) {
      console.warn(e);
    }
    setCurrentScreen('dashboard');
  };

  if (currentUser && !isSetupComplete) {
    return (
      <>
        <Toaster position="top-right" theme={theme} richColors />
        <SetupAssistant 
          onComplete={handleCompleteSetup}
          onClose={() => {
            setIsSetupComplete(true);
            safeStorage.setItem('isSetupComplete', 'true');
            try {
              localStorage.setItem('isSetupComplete', 'true');
            } catch (e) {
              console.warn(e);
            }
            setCurrentScreen('dashboard');
          }}
        />
      </>
    );
  }

  const handleUpdateTurmas = async (newTurmas: string[]) => {
    setTurmas(newTurmas);
    try {
      await updateDoc(doc(db, 'config', 'studio'), { turmas: newTurmas });
    } catch (error) {
      console.error("Error updating turmas:", error);
      toast.error("Erro ao salvar turmas.");
    }
  };

  const handleUpdateTurmaCapacities = async (newCapacities: Record<string, number>) => {
    setTurmaCapacities(newCapacities);
    safeStorage.setItem('turma_capacities', JSON.stringify(newCapacities));
    try {
      await updateDoc(doc(db, 'config', 'studio'), { 
        turmaCapacities: newCapacities,
        updatedAt: serverTimestamp() 
      });
      toast.success("Capacidades das turmas atualizadas com sucesso!");
    } catch (error) {
      console.error("Error updating turma capacities:", error);
      toast.error("Erro ao salvar capacidades no banco.");
    }
  };

  const handleUpdateBankInfo = async (info: { bankName: string; pixKey: string; holderName: string }) => {
    setBankInfo(info);
    try {
      await updateDoc(doc(db, 'config', 'studio'), { bankInfo: info });
      toast.success("Dados bancários atualizados!");
    } catch (error) {
      console.error("Error updating bank info:", error);
      toast.error("Erro ao salvar dados bancários.");
    }
  };

  const handleUpdateNotificationSettings = async (settings: any) => {
    setNotificationSettings(settings);
    try {
      await updateDoc(doc(db, 'config', 'studio'), { notificationSettings: settings });
      toast.success("Configurações de notificações atualizadas!");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Erro ao salvar configurações de notificações.");
    }
  };

  const handleUpdatePartnerConfig = async (newConfig: PartnerConfig) => {
    setPartnerConfig(newConfig);
    safeStorage.setItem('partner_config', JSON.stringify(newConfig));
    try {
      await updateDoc(doc(db, 'config', 'studio'), {
        partnerConfig: newConfig,
        updatedAt: serverTimestamp()
      });
      toast.success("Configurações dos parceiros salvas!");
    } catch (error) {
      console.error("Error updating partner config:", error);
      toast.error("Erro ao salvar parceiros.");
    }
  };

  const [firstName, ...rest] = studioName.split(' ');
  const lastName = rest.join(' ');

  return (
    <div className="flex h-screen bg-surface text-on-surface font-body selection:bg-primary selection:text-white overflow-hidden relative">
      <Toaster position="top-right" theme={theme} richColors />

      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-surface-container border-l border-outline shadow-2xl flex flex-col glass-panel"
            >
              <div className="p-8 border-b border-outline flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-headline font-black uppercase tracking-tight">Meu Carrinho</h2>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{cart.length} Itens Selecionados</p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-on-surface-variant"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                {cart.length > 0 ? cart.map((item) => (
                  <div key={item.id} className="p-4 bg-surface-container-low border border-outline rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        {item.type === 'Evento' ? <Megaphone size={20} /> : <Activity size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                          {format(new Date(item.date), 'dd/MM')} • {item.time}
                        </p>
                        <p className="text-xs font-black text-primary mt-1">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                      className="p-2 text-on-surface-variant/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                    <ShoppingCart size={64} />
                    <p className="text-sm font-bold uppercase tracking-widest">Seu carrinho está vazio</p>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-outline bg-surface-container-high/50 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-headline font-black">
                    R$ {cart.reduce((sum, item) => sum + item.price, 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  Finalizar Compra
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Kinetic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute -bottom-48 left-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[50] w-72 bg-surface-container border-r border-outline flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 h-full",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              {studioLogo ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline shadow-lg">
                  <img src={studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-outline shadow-lg bg-white/5">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-primary text-white font-black">S</div>';
                  }} />
                </div>
              )}
              <div>
                <h1 className="font-headline font-black text-xl tracking-tighter leading-none uppercase">{firstName}</h1>
                {lastName && <p className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">{lastName}</p>}
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-surface-container-high rounded-lg lg:hidden"
            >
              <XCircle size={20} className="text-on-surface-variant" />
            </button>
          </div>

          <nav className="space-y-2">
            <SidebarLink 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={currentScreen === 'dashboard'} 
              onClick={() => { setCurrentScreen('dashboard'); setIsSidebarOpen(false); }} 
            />
            {['Gerente', 'Recepcionista', 'Instrutor'].includes(currentUser.role) && (
              <SidebarLink 
                icon={<Users size={20} />} 
                label="Alunos" 
                active={currentScreen === 'students'} 
                onClick={() => { setCurrentScreen('students'); setIsSidebarOpen(false); }} 
              />
            )}
            <SidebarLink 
              icon={<Calendar size={20} />} 
              label="Agenda" 
              active={currentScreen === 'agenda'} 
              onClick={() => { setCurrentScreen('agenda'); setIsSidebarOpen(false); }} 
            />
            {['Gerente', 'Instrutor'].includes(currentUser.role) && (
              <SidebarLink 
                icon={<Wand2 size={20} />} 
                label="Planejador IA" 
                active={currentScreen === 'ai-planner'} 
                onClick={() => { setCurrentScreen('ai-planner'); setIsSidebarOpen(false); }} 
              />
            )}
            <SidebarLink 
              icon={<MessageSquare size={20} />} 
              label="Mensagens" 
              active={currentScreen === 'messages'} 
              onClick={() => { setCurrentScreen('messages'); setIsSidebarOpen(false); }} 
            />
            <SidebarLink 
              icon={<UserCircle size={20} />} 
              label="Meu Perfil" 
              active={currentScreen === 'my-profile'} 
              onClick={() => { setCurrentScreen('my-profile'); setIsSidebarOpen(false); }} 
            />

            {['Gerente', 'Recepcionista'].includes(currentUser.role) && (
              <div className="pt-6 mt-6 border-t border-outline/30 space-y-1">
                <div className="px-4 mb-2 flex items-center gap-2">
                  <ShieldCheck size={12} className="text-primary/50" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">Administrativo</p>
                </div>
                <SidebarLink 
                  icon={<Star size={20} />} 
                  label="Eventos" 
                  active={currentScreen === 'events'} 
                  onClick={() => { setCurrentScreen('events'); setIsSidebarOpen(false); }} 
                />
                <SidebarLink 
                  icon={<DollarSign size={20} />} 
                  label="Financeiro" 
                  active={currentScreen === 'financial'} 
                  onClick={() => { setCurrentScreen('financial'); setIsSidebarOpen(false); }} 
                />
                {currentUser.role === 'Gerente' && (
                  <SidebarLink 
                    icon={<BarChartIcon size={20} />} 
                    label="Analytics" 
                    active={currentScreen === 'analytics'} 
                    onClick={() => { setCurrentScreen('analytics'); setIsSidebarOpen(false); }} 
                  />
                )}
                {currentUser.role === 'Gerente' && (
                  <SidebarLink 
                    icon={<Layout size={20} />} 
                    label="Galeria" 
                    active={currentScreen === 'gallery'} 
                    onClick={() => { setCurrentScreen('gallery'); setIsSidebarOpen(false); }} 
                  />
                )}
                <SidebarLink 
                  icon={<Settings size={20} />} 
                  label="Configurações" 
                  active={currentScreen === 'settings'} 
                  onClick={() => { setCurrentScreen('settings'); setIsSidebarOpen(false); }} 
                />
              </div>
            )}
            {currentUser.role === 'Aluno' && (
              <SidebarLink 
                icon={<Activity size={20} />} 
                label="Meu Desempenho" 
                active={currentScreen === 'profile'} 
                onClick={() => { setCurrentScreen('profile'); setIsSidebarOpen(false); }} 
              />
            )}
          </nav>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 border-t border-outline bg-surface-container/50 space-y-3">
          {/* Theme Option inside Menu */}
          <div className="p-2.5 sm:p-3 bg-surface-container-high/60 rounded-2xl border border-outline/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Aparência</p>
                <p className="text-[10px] text-on-surface-variant">
                  {theme === 'light' ? 'Modo Claro' : 'Modo Escuro'}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={toggleTheme}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-primary text-white hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title={theme === 'light' ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
            >
              {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
              <span>{theme === 'light' ? 'Escuro' : 'Claro'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-primary/30" />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-[#FF9E00]" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold truncate">{currentUser.name}</p>
              <p className="text-[9px] sm:text-[10px] text-on-surface-variant uppercase tracking-widest">{currentUser.role}</p>
            </div>
          </div>
          {/* PWA Install Button */}
          {!effectiveIsInstalled && (
            <button 
              onClick={handleInstallClick}
              className="w-full py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all cursor-pointer"
            >
              <Download size={15} />
              <span>Instalar Aplicativo</span>
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-red-500 hover:bg-red-500/5 transition-all border border-transparent hover:border-red-500/20"
          >
            Sair do Sistema
          </button>
          <div className="text-center pt-1 flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              className="text-[9px] font-mono text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest cursor-pointer flex items-center gap-1"
            >
              <span>Estúdio Urbano {pwaVersion}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            </button>
            {needRefresh && (
              <button
                type="button"
                onClick={() => pwaApplyUpdate()}
                className="text-[9px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={9} className="animate-spin" /> Atualização Pronta
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 pb-14 lg:pb-0">
        {/* Header */}
        <header className="h-14 sm:h-16 lg:h-20 border-b border-outline flex items-center justify-between px-3 sm:px-6 lg:px-10 glass-panel sticky top-0 z-40">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 sm:p-2 hover:bg-white/5 rounded-xl lg:hidden text-on-surface-variant transition-colors active:scale-95 cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <button
              id="header-install-app-btn"
              onClick={handleInstallClick}
              className="p-1.5 sm:p-2 lg:px-3 lg:py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl border border-primary/30 transition-all text-xs font-bold hidden sm:flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              title="Instalar Aplicativo (PWA)"
            >
              <Download size={15} />
              <span className="hidden md:inline font-bold uppercase tracking-wider text-[10px]">
                {effectiveIsInstalled ? 'App Instalado' : 'Instalar App'}
              </span>
            </button>

            {needRefresh && (
              <button
                id="header-update-badge-btn"
                type="button"
                onClick={() => pwaApplyUpdate()}
                className="p-1.5 sm:p-2 lg:px-3 lg:py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-wider rounded-xl transition-all text-[10px] flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer animate-pulse"
                title="Nova versão pronta! Clique para atualizar agora"
              >
                <RefreshCw size={13} className="animate-spin" />
                <span className="hidden md:inline">Atualizar</span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-full border border-outline w-48 md:w-64 lg:w-96">
              <Search size={16} className="text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-transparent border-none focus:ring-0 text-xs sm:text-sm w-full text-on-surface placeholder:text-on-surface-variant/50 outline-none"
              />
            </div>
          </div>

          {/* Central Logo - Adjusted height for mobile to never collide with buttons */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            {studioLogo ? (
              <img src={studioLogo} alt="Studio Logo" className="h-7 sm:h-10 lg:h-16 max-w-[120px] sm:max-w-none w-auto object-contain drop-shadow-md" />
            ) : (
              <img src="/logo.png" alt="Studio Logo" className="h-7 sm:h-10 lg:h-16 max-w-[120px] sm:max-w-none w-auto object-contain drop-shadow-md" onError={(e) => (e.currentTarget.style.display = 'none')} />
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-5">
            {/* 1 Single compact theme button */}
            <button 
              onClick={toggleTheme}
              className="p-1.5 sm:p-2.5 bg-white/5 rounded-xl border border-outline hover:bg-white/10 transition-all text-on-surface-variant hover:text-primary active:scale-95 cursor-pointer"
              title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {['Gerente', 'Recepcionista'].includes(currentUser.role) && (
              <button 
                onClick={() => setCurrentScreen('settings')}
                className="p-1.5 sm:p-2.5 bg-white/5 rounded-xl border border-outline hover:bg-white/10 transition-all text-on-surface-variant hover:text-primary hidden sm:flex active:scale-95 cursor-pointer"
                title="Configurações"
              >
                <Settings size={16} />
              </button>
            )}

            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 hover:bg-white/5 rounded-xl text-on-surface-variant transition-colors active:scale-95 cursor-pointer"
              title="Notificações"
            >
              <Bell size={16} className="sm:w-[18px] sm:h-[18px]" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-primary text-white text-[8px] font-black rounded-full border border-surface flex items-center justify-center shadow-lg">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-72 sm:w-80 bg-surface-container border border-outline rounded-3xl shadow-2xl p-4 sm:p-6 glass-panel z-50"
                  >
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-3">Notificações</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar text-left">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <NotificationItem key={notif.id} title={notif.title} text={notif.text} time={notif.time} />
                        ))
                      ) : (
                        <p className="text-[10px] text-on-surface-variant text-center py-4">Nenhuma notificação.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={() => setIsRegistering(true)}
              className="bg-primary text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1.5 hover:scale-105 transition-transform active:scale-95 shadow-sm kinetic-glow cursor-pointer"
              title="Novo Cadastro de Aluno"
            >
              <Plus size={15} />
              <span className="hidden xs:inline">Novo</span>
              <span className="hidden sm:inline">Cadastro</span>
            </button>
          </div>
        </header>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-14 custom-scrollbar bg-surface/30">
          <div className="max-w-[2000px] mx-auto w-full space-y-6 lg:space-y-12">
            {!isSetupComplete && currentUser?.role === 'Gerente' && currentScreen !== 'setup' && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Assistente de Configuração do Estúdio</p>
                    <p className="text-[11px] text-on-surface-variant">Personalize o logotipo, salas e modalidades a qualquer momento.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setCurrentScreen('setup')}
                    className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                  >
                    Abrir Assistente
                  </button>
                  <button
                    onClick={() => {
                      setIsSetupComplete(true);
                      safeStorage.setItem('isSetupComplete', 'true');
                    }}
                    className="px-3 py-1.5 bg-surface-container hover:bg-outline/10 text-on-surface-variant rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-outline"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
            {currentScreen === 'gallery' && (
              <motion.div
                key="gallery-wrapper"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <GalleryScreen 
                  items={gallery} 
                  onRemove={(id) => setGallery(prev => prev.filter(item => item.id !== id))}
                />
              </motion.div>
            )}
            {currentScreen === 'dashboard' && (
              <motion.div
                key="dashboard-viewport"
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full min-h-full"
              >
                {currentUser?.role === 'Aluno' ? (
                  <StudentPortal 
                    key="student-portal" 
                    user={currentUser} 
                    students={students} 
                    events={events} 
                    cart={cart}
                    setCart={setCart}
                    onOpenCart={() => setIsCartOpen(true)}
                    onOpenQR={(data) => {
                      setSelectedPaymentForQR(data);
                      setIsPaymentQRModalOpen(true);
                    }}
                  />
                ) : (
                  <DashboardScreen 
                    key="dashboard" 
                    students={students} 
                    onCheckIn={handleCheckIn}
                    userRole={currentUser?.role}
                    payments={payments}
                    events={events}
                    currentUser={currentUser}
                    studioName={studioName}
                    studioLogo={studioLogo}
                    bankInfo={bankInfo}
                    whatsAppConfig={(notificationSettings as any)?.whatsAppConfig || DEFAULT_WHATSAPP_CONFIG}
                    turmas={turmas}
                    turmaCapacities={turmaCapacities}
                    onUpdateTurmaCapacities={handleUpdateTurmaCapacities}
                    onNavigateToFinancial={() => setCurrentScreen('financial')}
                    onNavigateToWhatsApp={() => setCurrentScreen('settings')}
                    onUpdateStudent={handleUpdateStudent}
                    onConfirmPayment={handleConfirmPayment}
                    onAddExpense={handleAddExpense}
                    onAddTestOverdueStudent={() => {
                      const overdueTestStudent: Student = {
                        id: `test-overdue-${Date.now()}`,
                        name: 'Camila Fernandes (Teste)',
                        email: 'camila.fernandes@exemplo.com',
                        contact: '(11) 98765-4321',
                        phone: '(11) 98765-4321',
                        address: 'Rua Augusta, 500',
                        document: '123.456.789-00',
                        classes: ['Danças Urbanas', 'Jazz Funk'],
                        turmas: ['Noite - Avançado'],
                        status: 'active',
                        paymentStatus: 'overdue',
                        birthDate: '1998-04-12',
                        joinDate: format(new Date(), 'yyyy-MM-dd'),
                        attendance: [],
                        feedbacks: [],
                        performance: [],
                        messages: [],
                        notes: [],
                        isFavorite: false,
                        planType: 'Studio',
                        contractedPlan: 'One'
                      };
                      setStudents(prev => [overdueTestStudent, ...prev]);
                      toast.success('Aluno de teste com mensalidade em atraso adicionado para demonstração!');
                    }}
                  />
                )}
              </motion.div>
            )}
            {currentScreen === 'students' && (
              <motion.div
                key="students-wrapper"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <StudentsScreen 
                  key="students" 
                  students={students} 
                  setStudents={setStudents}
                  modalities={modalities}
                  turmas={turmas}
                  onUpdateTurmas={handleUpdateTurmas}
                  currentUser={currentUser}
                  onDeleteStudent={handleDeleteStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onSaveToGallery={handleSaveToGallery}
                  onOpenPaymentModal={(studentId) => {
                    setTargetStudentId(studentId);
                    setIsPaymentModalOpen(true);
                  }}
                  onSelectStudent={(id) => {
                    setSelectedStudentId(id);
                    setCurrentScreen('profile');
                  }} 
                />
              </motion.div>
            )}
            {currentScreen === 'agenda' && (
              <motion.div
                key="agenda-wrapper"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <AgendaScreen 
                  key="agenda" 
                  events={events} 
                  setEvents={setEvents} 
                  students={students}
                  currentUser={currentUser}
                  turmas={turmas}
                  onAddNotification={(title, text) => {
                    const newNotif = { id: Date.now().toString(), title, text, time: 'Agora', read: false };
                    setNotifications(prev => [newNotif, ...prev]);
                  }}
                  isGoogleConnected={isGoogleConnected}
                  setIsGoogleConnected={setIsGoogleConnected}
                  handleConnectGoogle={handleConnectGoogle}
                  handleSyncCalendar={handleSyncCalendar}
                  isSyncing={isSyncing}
                  studioName={studioName}
                  studioLogo={studioLogo}
                />
              </motion.div>
            )}
            {currentScreen === 'profile' && (
              <motion.div
                key="profile-wrapper"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ProfileScreen 
                  student={selectedStudent} 
                  onUpdateStudent={handleUpdateStudent}
                  currentUser={currentUser}
                  modalities={modalities}
                  turmas={turmas}
                  onOpenPaymentModal={(studentId) => {
                    setTargetStudentId(studentId);
                    setIsPaymentModalOpen(true);
                  }}
                  onOpenQR={(data) => {
                    setSelectedPaymentForQR(data);
                    setIsPaymentQRModalOpen(true);
                  }}
                  key="profile" 
                />
              </motion.div>
            )}
            {currentScreen === 'my-profile' && (
              <motion.div
                key="my-profile-wrapper"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <MyProfileScreen 
                  key="my-profile" 
                  user={currentUser} 
                  onUpdateUser={(updated) => setCurrentUser(updated)}
                  onLogout={handleLogout}
                />
              </motion.div>
            )}
            {currentScreen === 'settings' && (
              <SettingsScreen 
                key="settings" 
                users={users} 
                setUsers={setUsers}
                students={students}
                setStudents={setStudents}
                events={events}
                setEvents={setEvents}
                modalities={modalities}
                setModalities={async (newMods) => {
                  setModalities(newMods);
                  safeStorage.setItem('modalities', JSON.stringify(newMods));
                  try {
                    await updateDoc(doc(db, 'config', 'studio'), {
                      modalities: newMods,
                      updatedAt: serverTimestamp()
                    });
                  } catch (error) {
                    console.error("Error updating modalities in Firestore:", error);
                  }
                }}
                studioLogo={studioLogo}
                setStudioLogo={async (newLogo) => {
                  setStudioLogo(newLogo);
                  if (newLogo) {
                    safeStorage.setItem('studioLogo', newLogo);
                  } else {
                    safeStorage.removeItem('studioLogo');
                  }
                  try {
                    await updateDoc(doc(db, 'config', 'studio'), {
                      logo: newLogo,
                      updatedAt: serverTimestamp()
                    });
                  } catch (error) {
                    console.error("Error updating logo in Firestore:", error);
                  }
                }}
                onResetSetup={() => {
                  setIsSetupComplete(false);
                  safeStorage.setItem('isSetupComplete', 'false');
                  try {
                    localStorage.setItem('isSetupComplete', 'false');
                  } catch (e) {
                    console.warn(e);
                  }
                  setCurrentScreen('setup');
                  toast.info('Assistente de configuração aberto.');
                }}
                handleSaveToDrive={handleSaveToDrive}
                isSavingToDrive={isSavingToDrive}
                onLogout={handleLogout}
                bankInfo={bankInfo}
                onUpdateBankInfo={handleUpdateBankInfo}
                notificationSettings={notificationSettings}
                onUpdateNotificationSettings={handleUpdateNotificationSettings}
                rooms={rooms}
                onUpdateRooms={async (newRooms) => {
                  setRooms(newRooms);
                  safeStorage.setItem('studio_rooms', JSON.stringify(newRooms));
                  try {
                    await updateDoc(doc(db, 'config', 'studio'), {
                      rooms: newRooms,
                      updatedAt: serverTimestamp()
                    });
                    toast.success('Estrutura de salas atualizada!');
                  } catch (e) {
                    console.error("Error updating rooms:", e);
                  }
                }}
                storageMode={storageMode}
                onUpdateStorageMode={async (mode) => {
                  setStorageMode(mode);
                  safeStorage.setItem('storage_mode', mode);
                  try {
                    await updateDoc(doc(db, 'config', 'studio'), {
                      storageMode: mode,
                      updatedAt: serverTimestamp()
                    });
                    toast.success(`Modo de armazenamento: ${mode === 'drive' ? 'Google Drive' : 'Local'}`);
                  } catch (e) {
                    console.error("Error updating storage mode:", e);
                  }
                }}
                lastBackupDate={lastBackupDate}
                onPerformBackup={async () => {
                  const now = new Date().toISOString();
                  setLastBackupDate(now);
                  safeStorage.setItem('last_backup_date', now);
                  
                  if (storageMode === 'drive') {
                    await handleSaveToDrive();
                  } else {
                    // Just manual export
                    handleExportBackup();
                    toast.success('Backup realizado localmente!');
                  }

                  try {
                    await updateDoc(doc(db, 'config', 'studio'), {
                      lastBackupDate: now,
                      updatedAt: serverTimestamp()
                    });
                  } catch (e) { console.error("Error logging backup date:", e); }
                }}
                isGoogleConnected={isGoogleConnected}
                googleEmail={currentUser?.email}
                onConnectGoogle={handleConnectGoogle}
                autoBackupSettings={autoBackupSettings}
                onUpdateAutoBackupSettings={handleUpdateAutoBackupSettings}
                lastBackupStatus={lastBackupStatus}
                lastBackupError={lastBackupError}
                currentUserEmail={currentUser?.email || "stylourbanostudio@gmail.com"}
                studioName={studioName}
                partnerConfig={partnerConfig}
                onUpdatePartnerConfig={handleUpdatePartnerConfig}
                onCheckIn={handleCheckIn}
              />
            )}
            {currentScreen === 'events' && <EventsScreen key="events" />}
            {currentScreen === 'financial' && (
              <FinancialDashboard 
                key="financial" 
                payments={payments} 
                onConfirmPayment={handleConfirmPayment}
                onShowQRCode={handleShowQRCode}
                studioName={studioName}
                studioLogo={studioLogo}
                currentUser={currentUser}
              />
            )}
            {currentScreen === 'analytics' && <AnalyticsScreen key="analytics" students={students} payments={payments} events={events} modalities={modalities} />}
            {currentScreen === 'ai-planner' && <AiClassPlanner key="ai-planner" currentUser={currentUser} />}
            {currentScreen === 'messages' && (
              <MessagesScreen 
                key="messages"
                currentUser={currentUser!}
              />
            )}
            {currentScreen === 'setup' && (
              <motion.div 
                key="setup"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full"
              >
                <SetupAssistant 
                  onComplete={handleCompleteSetup}
                  onClose={() => setCurrentScreen('dashboard')}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isRegistering && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegistering(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl relative z-10 glass-panel"
            >
              <h2 className="text-2xl font-headline font-black mb-6">Novo Cadastro</h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setCurrentScreen('students');
                    setIsRegistering(false);
                    toast.success('Redirecionando para cadastro de aluno...');
                  }}
                  className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-3xl border border-outline hover:border-primary/50 transition-all group"
                >
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <Users size={24} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">Aluno</span>
                </button>
                <button 
                  onClick={() => {
                    setCurrentScreen('settings');
                    setIsRegistering(false);
                    toast.success('Redirecionando para cadastro de equipe...');
                  }}
                  className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-3xl border border-outline hover:border-primary/50 transition-all group"
                >
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <UserCircle size={24} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">Equipe</span>
                </button>
              </div>
              <button 
                onClick={() => setIsRegistering(false)}
                className="w-full mt-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest border border-outline hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Link Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl relative z-10 glass-panel"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-headline font-black">Enviar Pagamento</h2>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Função Administrativa (Gerente)</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Valor (R$)</label>
                  <input 
                    type="text" 
                    placeholder="0,00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-lg font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Descrição</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Mensalidade Abril"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border border-outline hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSendPaymentLink}
                    disabled={!paymentAmount}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    Enviar Link
                  </button>
                </div>

                {bankInfo?.pixKey && paymentAmount && (
                  <div className="pt-6 border-t border-outline/30 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ou pague via PIX agora:</p>
                    <div className="p-4 bg-white rounded-3xl shadow-inner">
                      <QRCodeCanvas 
                        value={generatePixPayload(
                          bankInfo.pixKey, 
                          bankInfo.holderName || 'Studio', 
                          'SAO PAULO', 
                          parseFloat(paymentAmount.replace(',', '.')) || 0, 
                          paymentDescription
                        )} 
                        size={180}
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold">{bankInfo.bankName}</p>
                      <p className="text-[10px] text-on-surface-variant break-all select-all cursor-pointer" onClick={() => {
                        navigator.clipboard.writeText(bankInfo.pixKey);
                        toast.success('Chave PIX copiada!');
                      }}>
                        Chave: {bankInfo.pixKey}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment QR Code Modal */}
      <AnimatePresence>
        {isPaymentQRModalOpen && selectedPaymentForQR && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentQRModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl relative z-10 glass-panel flex flex-col items-center"
            >
              <div className="w-full flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-headline font-black uppercase tracking-tight">QR Code Pagamento</h3>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">{selectedPaymentForQR.title}</p>
                </div>
                <button 
                  onClick={() => setIsPaymentQRModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-[32px] shadow-inner mb-6 relative group">
                <QRCodeCanvas 
                  id="payment-qr-canvas"
                  value={selectedPaymentForQR.url} 
                  size={240}
                  level="H"
                  includeMargin={true}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-[2px] rounded-[32px]">
                   <div className="bg-primary text-white p-3 rounded-full shadow-lg">
                      <QrCode size={32} />
                   </div>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Valor do Pagamento</p>
                  <p className="text-2xl font-headline font-black text-primary">R$ {selectedPaymentForQR.amount.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      if (selectedPaymentForQR.url) {
                        navigator.clipboard.writeText(selectedPaymentForQR.url);
                        toast.success('Código copiado!');
                      }
                    }}
                    className="flex-1 py-4 bg-surface-container border border-outline rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} />
                    Copiar
                  </button>
                  <button 
                    onClick={() => downloadQRCode('payment-qr-canvas', selectedPaymentForQR.title)}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Download size={14} />
                    Baixar
                  </button>
                </div>
                
                <p className="text-[9px] text-center text-on-surface-variant/60 font-medium px-4">
                  Aponte a câmera do seu celular para o QR Code ou use o link para completar o pagamento.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Overlays de Atualização de Sistema (Desktop) */}
      <AnimatePresence>
        {isCheckingForUpdates && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-surface-container border border-outline rounded-[32px] p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center font-body"
            >
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center animate-spin">
                <RefreshCw size={32} />
              </div>
              <div>
                <h3 className="text-lg font-headline font-black uppercase tracking-tight">Verificando Atualizações</h3>
                <p className="text-xs text-on-surface-variant font-semibold tracking-widest uppercase mt-2">Buscando novas versões na nuvem...</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUpdateConfirmOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsUpdateConfirmOpen(false);
                toast.info('Atualização adiada. Você pode atualizar mais tarde.');
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-xl bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl z-10 space-y-6 text-left font-body"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-primary to-[#FF9E00] text-white rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <RefreshCw size={28} className="animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black uppercase tracking-widest">Nova Atualização Disponível</span>
                    <h3 className="text-2xl font-headline font-black uppercase tracking-tight mt-1">Estúdio Urbano v1.2.0</h3>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsUpdateConfirmOpen(false);
                    toast.info('Atualização adiada. Você pode atualizar mais tarde.');
                  }}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-on-surface-variant"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 p-5 bg-surface-container-low border border-outline rounded-3xl">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>O que há de novo na v1.2.0:</span>
                </div>
                
                <ul className="space-y-3 text-xs text-on-surface-variant sm:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <div>
                      <strong className="text-on-surface font-black">Novos Planos da Escola:</strong> Suporte integrado aos novos formatos de contratação (Starter, One/One2, Six/Six2, Loyalty/Loyalty2, Family, Today Dance).
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <div>
                      <strong className="text-on-surface font-black">Performance e Velocidade:</strong> Carregamento de agendas e frequência de alunos até 40% mais rápido.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <div>
                      <strong className="text-on-surface font-black">Salgados e Pagamentos:</strong> Geração instantânea de chaves dinâmicas e QR codes para mensalidades.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <div>
                      <strong className="text-on-surface font-black">Correções de Cache:</strong> Sincronização offline robusta para sistemas com conexões de banda limitada.
                    </div>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-on-surface-variant text-center border-t border-outline/30 pt-4 font-bold uppercase tracking-wide">
                Deseja instalar as atualizações de sistema e reiniciar agora ou continuar depois?
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={() => {
                    setIsUpdateConfirmOpen(false);
                    // Começa download simulado extremamente visual
                    setIsUpdateDownloading(true);
                    setUpdateProgress(0);
                  }}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>Atualizar Agora</span>
                </button>
                <button 
                  onClick={() => {
                    setIsUpdateConfirmOpen(false);
                    toast.info('Atualização agendada para depois.', {
                      description: 'O sistema solicitará novamente na próxima inicialização.'
                    });
                  }}
                  className="flex-1 py-4 border border-outline rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 active:scale-[0.98] transition-all"
                >
                  Continuar Depois
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUpdateDownloading && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl z-10 text-center space-y-6 font-body"
            >
              <div className="w-20 h-20 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center relative">
                <RefreshCw size={40} className="animate-spin text-primary" style={{ animationDuration: '3s' }} />
                <span className="absolute text-xs font-black">{updateProgress}%</span>
              </div>
              
              <div>
                <h3 className="text-xl font-headline font-black uppercase tracking-tight">Atualizando Aplicativo</h3>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Não feche a página ou desligue o dispositivo</p>
              </div>

              {/* Barra de progresso */}
              <div className="w-full h-2 bg-surface-container-low border border-outline rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-[#FF9E00] rounded-full"
                  style={{ width: `${updateProgress}%` }}
                  transition={{ ease: "easeInOut" }}
                />
              </div>

              {/* Status do progresso */}
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest min-h-[1.5rem]">
                {updateProgress < 25 && "Definindo novos pacotes de planos..."}
                {updateProgress >= 25 && updateProgress < 50 && "Otimizando consultas de banco de dados..."}
                {updateProgress >= 50 && updateProgress < 80 && "Limpando caches anteriores do navegador..."}
                {updateProgress >= 80 && updateProgress < 100 && "Instalando módulos de controle de acesso..."}
                {updateProgress === 100 && "Instalação concluída! Reiniciando..."}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PWAUpdateBanner
        needRefresh={needRefresh}
        isOnline={isOnline}
        onApplyUpdate={pwaApplyUpdate}
        onDismiss={pwaDismissUpdate}
        appVersion={pwaVersion}
      />

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isInstalled={effectiveIsInstalled}
        deferredPrompt={deferredPrompt}
        onInstallNative={handleInstallClick}
        isIOS={effectiveIsIOS}
        studioName={studioName}
        studioLogo={studioLogo}
        onCheckForUpdates={pwaCheckForUpdates}
        isCheckingUpdate={isPWACheckingUpdate || isCheckingForUpdates}
        onApplyUpdate={pwaApplyUpdate}
        needRefresh={needRefresh}
        appVersion={pwaVersion}
      />
      <BottomTab 
        currentScreen={currentScreen} 
        setCurrentScreen={setCurrentScreen} 
        currentUser={currentUser} 
      />
    </div>
  );
}

function NotificationItem({ title, text, time }: { title: string, text: string, time: string }) {
  return (
    <div className="space-y-1 border-b border-outline pb-3 last:border-0 last:pb-0">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-primary">{title}</h4>
        <span className="text-[10px] text-on-surface-variant">{time}</span>
      </div>
      <p className="text-[10px] text-on-surface-variant leading-tight">{text}</p>
    </div>
  );
}

// --- Screen Components ---

function CheckInWidget({ 
  students, 
  onCheckIn, 
  onOpenScanner,
  turmas,
  turmaCapacities: propCapacities,
  onUpdateTurmaCapacities,
  onUpdateStudent
}: { 
  students: Student[], 
  onCheckIn: (id: string, className: string, metadata?: any) => Promise<void> | void,
  onOpenScanner?: () => void,
  turmas?: string[],
  turmaCapacities?: Record<string, number>,
  onUpdateTurmaCapacities?: (newCapacities: Record<string, number>) => Promise<void> | void,
  onUpdateStudent?: (student: Student) => Promise<void> | void
}) {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('Danças Urbanas');
  const [filterMode, setFilterMode] = useState<'all' | 'partner' | 'studio' | 'WellHub' | 'GuruPass' | 'TotalPass'>('all');
  const [selectedTurmaFilter, setSelectedTurmaFilter] = useState<string>('all');
  const [turmaFilterInput, setTurmaFilterInput] = useState('');
  const [appliedTurmaFilter, setAppliedTurmaFilter] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [removingTurmaKey, setRemovingTurmaKey] = useState<string | null>(null);
  const [removedTurmaKeys, setRemovedTurmaKeys] = useState<Set<string>>(new Set());

  // Synchronize removedTurmaKeys with external students prop updates
  useEffect(() => {
    if (removedTurmaKeys.size === 0) return;
    setRemovedTurmaKeys(prev => {
      let changed = false;
      const next = new Set(prev);
      students.forEach(s => {
        const currentTurmas = new Set(s.turmas || []);
        prev.forEach(key => {
          if (key.startsWith(`${s.id}-`)) {
            const turma = key.slice(`${s.id}-`.length);
            if (!currentTurmas.has(turma)) {
              next.delete(key);
              changed = true;
            }
          }
        });
      });
      return changed ? next : prev;
    });
  }, [students, removedTurmaKeys]);

  const effectiveStudents = useMemo(() => {
    if (removedTurmaKeys.size === 0) return students;
    return students.map(s => {
      const activeTurmas = (s.turmas || []).filter(t => !removedTurmaKeys.has(`${s.id}-${t}`));
      if (activeTurmas.length === (s.turmas || []).length) return s;
      return { ...s, turmas: activeTurmas };
    });
  }, [students, removedTurmaKeys]);

  const [capacities, setCapacities] = useState<Record<string, number>>(() => {
    if (propCapacities && Object.keys(propCapacities).length > 0) return propCapacities;
    const saved = safeStorage.getItem('turma_capacities');
    return saved ? JSON.parse(saved) : {
      'Turma Manhã': 20,
      'Turma Tarde': 20,
      'Turma Noite': 20,
      'Turma Teste': 15
    };
  });

  useEffect(() => {
    if (propCapacities && Object.keys(propCapacities).length > 0) {
      setCapacities(propCapacities);
    }
  }, [propCapacities]);

  const handleSaveCapacities = async (newCaps: Record<string, number>) => {
    setCapacities(newCaps);
    safeStorage.setItem('turma_capacities', JSON.stringify(newCaps));
    if (onUpdateTurmaCapacities) {
      await onUpdateTurmaCapacities(newCaps);
    } else {
      toast.success("Capacidades salvas com sucesso!");
    }
  };

  const handleRemoveTurmaFromStudent = async (e: React.MouseEvent, student: Student, turmaToRemove: string) => {
    e.preventDefault();
    e.stopPropagation();

    const key = `${student.id}-${turmaToRemove}`;
    setRemovingTurmaKey(key);
    // Optimistically trigger immediate exit animation
    setRemovedTurmaKeys(prev => new Set(prev).add(key));

    const updatedTurmas = (student.turmas || []).filter(item => item !== turmaToRemove);
    const updatedStudent: Student = {
      ...student,
      turmas: updatedTurmas
    };

    try {
      if (onUpdateStudent) {
        await onUpdateStudent(updatedStudent);
      } else {
        const { id, attendance, performance, feedbacks, notes, messages, ...data } = updatedStudent;
        await updateDoc(doc(db, 'students', id), data as any);
      }
      toast.success(`Aluno(a) "${student.name}" removido(a) da ${turmaToRemove}!`);
    } catch (error) {
      console.error("Erro ao remover aluno da turma:", error);
      toast.error(`Não foi possível remover o aluno da turma.`);
      setRemovedTurmaKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } finally {
      setRemovingTurmaKey(null);
    }
  };

  const handleApplyTurmaFilter = () => {
    setAppliedTurmaFilter(turmaFilterInput.trim());
  };

  const handleClearTurmaFilter = () => {
    setTurmaFilterInput('');
    setAppliedTurmaFilter('');
  };

  const availableTurmas = useMemo(() => {
    const set = new Set<string>();
    if (turmas && turmas.length > 0) {
      turmas.forEach(t => {
        if (t && t.trim()) set.add(t.trim());
      });
    }
    effectiveStudents.forEach(s => {
      (s.turmas || []).forEach(t => {
        if (t && t.trim()) set.add(t.trim());
      });
    });
    if (set.size === 0) {
      ['Turma Manhã', 'Turma Tarde', 'Turma Noite'].forEach(t => set.add(t));
    }
    return Array.from(set).sort();
  }, [effectiveStudents, turmas]);

  const turmaStats = useMemo(() => {
    return availableTurmas.map(turmaName => {
      const enrolled = effectiveStudents.filter(s => (s.turmas || []).some(t => t.toLowerCase() === turmaName.toLowerCase())).length;
      const capacity = capacities[turmaName] !== undefined ? capacities[turmaName] : 20;
      const occupancyRate = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
      const remaining = capacity - enrolled;
      const isCritical = occupancyRate >= 90;
      const isFull = occupancyRate >= 100;

      return {
        name: turmaName,
        enrolled,
        capacity,
        occupancyRate,
        remaining,
        isCritical,
        isFull
      };
    });
  }, [availableTurmas, effectiveStudents, capacities]);

  const criticalTurmas = useMemo(() => {
    return turmaStats.filter(t => t.isCritical);
  }, [turmaStats]);

  const hasAnyCriticalTurma = criticalTurmas.length > 0;

  const activeCriticalTurma = useMemo(() => {
    if (selectedTurmaFilter !== 'all') {
      return criticalTurmas.find(t => t.name.toLowerCase() === selectedTurmaFilter.toLowerCase());
    }
    if (appliedTurmaFilter.trim()) {
      return criticalTurmas.find(t => t.name.toLowerCase().includes(appliedTurmaFilter.trim().toLowerCase()));
    }
    return null;
  }, [selectedTurmaFilter, appliedTurmaFilter, criticalTurmas]);

  const filtered = useMemo(() => {
    const rawTerm = search.trim();
    const isSearching = Boolean(rawTerm);
    const cleanTermLower = rawTerm.toLowerCase();
    const normalizedTerm = cleanTermLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const termDigits = rawTerm.replace(/\D/g, "");

    const turmaQuery = appliedTurmaFilter.trim().toLowerCase();
    const isFilteringTurmaByInput = Boolean(turmaQuery);
    const isFilteringTurmaByChip = selectedTurmaFilter !== 'all';

    return effectiveStudents
      .filter(s => {
        // Filter by plan type
        if (filterMode === 'partner' && s.planType === 'Studio') return false;
        if (filterMode === 'studio' && s.planType !== 'Studio') return false;
        if (['WellHub', 'GuruPass', 'TotalPass'].includes(filterMode) && s.planType !== filterMode) return false;

        // Filter specifically by turma name from input
        if (isFilteringTurmaByInput) {
          const inTurmaInput = (s.turmas || []).some(t => t.toLowerCase().includes(turmaQuery));
          if (!inTurmaInput) return false;
        }

        // Filter by selected quick chip turma
        if (isFilteringTurmaByChip) {
          const inTurma = (s.turmas || []).some(t => t.toLowerCase() === selectedTurmaFilter.toLowerCase());
          if (!inTurma) return false;
        }

        // Instant filter by Name or CPF
        if (isSearching) {
          const studentName = (s.name || '').toLowerCase();
          const studentNameNorm = studentName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const studentDoc = (s.document || '').toLowerCase();
          const docDigits = (s.document || '').replace(/\D/g, "");

          // 1. Matches Name (case and accent insensitive)
          const matchesName = studentName.includes(cleanTermLower) || studentNameNorm.includes(normalizedTerm);

          // 2. Matches CPF: formatted string OR unformatted digits (e.g. 123456 or 123.456)
          const matchesDoc = Boolean(
            (studentDoc && studentDoc.includes(cleanTermLower)) ||
            (termDigits.length >= 1 && docDigits.includes(termDigits))
          );

          // 3. Fallback matches: email, partner ID, class, turma
          const matchesEmail = (s.email || '').toLowerCase().includes(cleanTermLower);
          const matchesPartnerId = (s.partnerMemberId || '').toLowerCase().includes(cleanTermLower);
          const matchesTurma = (s.turmas || []).some(t => t.toLowerCase().includes(cleanTermLower));
          const matchesClass = (s.classes || []).some(c => c.toLowerCase().includes(cleanTermLower));

          if (!matchesName && !matchesDoc && !matchesEmail && !matchesPartnerId && !matchesTurma && !matchesClass) {
            return false;
          }
        }

        return true;
      })
      .slice(0, isSearching ? 50 : 35);
  }, [students, search, filterMode, selectedTurmaFilter, appliedTurmaFilter]);

  const recentCheckIns = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return students
      .flatMap(s => (s.attendance || [])
        .filter(a => a.date === today && a.present)
        .map(a => ({ ...a, studentName: s.name, planType: s.planType, avatar: s.avatar }))
      )
      .slice(0, 5);
  }, [students]);

  const showResults = true;

  return (
    <div id="CheckInWidget" className="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline space-y-6 kinetic-glow h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
            <UserCheck size={20} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-headline font-bold">Check-in de Presença</h3>
            <p className="text-[9px] sm:text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
              QR Code • Studio & Planos Parceiros
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            type="button"
            onClick={() => setIsCapacityModalOpen(true)}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm active:scale-95",
              hasAnyCriticalTurma
                ? "bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500 hover:text-black ring-2 ring-amber-500/30"
                : "bg-surface-container-low border-outline text-on-surface-variant hover:text-on-surface hover:bg-white/5"
            )}
            title="Configurar capacidade máxima de cada turma"
          >
            <SlidersHorizontal size={15} />
            <span className="hidden xs:inline">Capacidades</span>
            {hasAnyCriticalTurma && (
              <span className="flex items-center gap-1 text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full font-black">
                <AlertTriangle size={10} />
                {criticalTurmas.length}
              </span>
            )}
          </button>
          <button 
            onClick={onOpenScanner}
            className="p-2.5 bg-primary/10 border border-primary/30 rounded-xl text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 shadow-md active:scale-95 group"
            title="Escanear QR Code com Câmera"
          >
            <Camera size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold sm:hidden">Escanear</span>
          </button>
        </div>
      </div>

      {/* Prominent Scan Action Button */}
      <button
        onClick={onOpenScanner}
        className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-primary via-[#FF8800] to-primary bg-[length:200%_auto] hover:bg-right text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(255,107,0,0.25)] flex items-center justify-center gap-3 group border border-white/20"
      >
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
          <QrCode size={16} />
        </div>
        <span>Abrir Scanner de QR Code</span>
      </button>

      {/* Alerta Visual de Lotação Crítica (≥ 90% de ocupação) */}
      {hasAnyCriticalTurma && (
        <div 
          id="TurmaCapacityAlertBanner"
          className="rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-red-500/15 p-4 shadow-lg shadow-amber-500/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-headline font-black text-amber-400 uppercase tracking-wide">
                    Alerta de Lotação Crítica (≥ 90% de ocupação)
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {criticalTurmas.length} {criticalTurmas.length === 1 ? 'turma em risco' : 'turmas em risco'}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  {criticalTurmas.length === 1 
                    ? 'Uma turma atingiu ou ultrapassou a capacidade máxima recomendada.' 
                    : 'Atenção às turmas com capacidade quase esgotada para evitar superlotação nas salas.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCapacityModalOpen(true)}
              className="self-start sm:self-auto px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
              title="Ajustar capacidade máxima das turmas"
            >
              <SlidersHorizontal size={13} />
              <span>Gerenciar Capacidades</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {criticalTurmas.map(t => (
              <div 
                key={t.name}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                  t.isFull 
                    ? "bg-red-500/15 border-red-500/50 text-red-200" 
                    : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-on-surface truncate">{t.name}</span>
                    <span className={cn(
                      "text-[9px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider",
                      t.isFull ? "bg-red-500 text-white animate-pulse" : "bg-amber-500 text-black"
                    )}>
                      {t.occupancyRate}% {t.isFull ? '• LOTADA' : '• CRÍTICO'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden border border-outline/40">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          t.isFull ? "bg-red-500" : "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(100, t.occupancyRate)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant font-bold shrink-0">
                      {t.enrolled}/{t.capacity} ({t.remaining <= 0 ? '0 vagas' : `${t.remaining} rest.`})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTurmaFilter(t.name);
                    setAppliedTurmaFilter('');
                  }}
                  className="px-2.5 py-1.5 bg-surface-container hover:bg-white/10 text-[10px] font-bold rounded-lg border border-outline text-on-surface hover:text-primary transition-colors shrink-0"
                  title={`Filtrar alunos da turma ${t.name}`}
                >
                  Filtrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 flex-1">
        {/* Class Event Selector for Check-in */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Aula / Modalidade do Registro
            </label>
            <span className="text-[9px] font-black uppercase text-primary">Ao Vivo</span>
          </div>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all"
          >
            <option value="Danças Urbanas">Danças Urbanas</option>
            <option value="Hip Hop">Hip Hop</option>
            <option value="Ballet">Ballet</option>
            <option value="Jazz">Jazz</option>
            <option value="Contemporâneo">Contemporâneo</option>
            <option value="Dança a 2">Dança a 2</option>
            <option value="Treino Funcional">Treino Funcional</option>
            <option value="Zumba">Zumba</option>
            <option value="Yoga">Yoga</option>
            <option value="Pilates">Pilates</option>
          </select>
        </div>

        {/* Filtro Específico por Nome da Turma (Campo de Texto + Botão de Filtro) */}
        <div className="space-y-2 p-3.5 bg-surface-container-low/80 rounded-2xl border border-outline">
          <div className="flex items-center justify-between px-0.5">
            <label htmlFor="turma-filter-input" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <Filter size={12} className="text-primary" />
              Filtrar por Nome da Turma
            </label>
            {appliedTurmaFilter && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                Turma: "{appliedTurmaFilter}"
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="turma-filter-input"
                type="text"
                placeholder="Digitar nome da turma..."
                value={turmaFilterInput}
                onChange={(e) => setTurmaFilterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyTurmaFilter();
                  }
                }}
                className="w-full bg-surface-container border border-outline rounded-xl px-3.5 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50"
              />
              {turmaFilterInput && (
                <button
                  type="button"
                  onClick={() => setTurmaFilterInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  title="Limpar texto digitado"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              id="turma-filter-btn"
              onClick={handleApplyTurmaFilter}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
              title="Aplicar filtro por turma"
            >
              <Filter size={14} />
              <span>Filtrar</span>
            </button>
            {appliedTurmaFilter && (
              <button
                type="button"
                onClick={handleClearTurmaFilter}
                className="px-3 py-2.5 bg-surface-container hover:bg-white/10 border border-outline text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                title="Limpar filtro de turma"
              >
                <X size={14} />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtro Rápido por Turma Matriculada */}
        <div className="space-y-2 p-3.5 bg-surface-container-low/60 rounded-2xl border border-outline/70">
          <div className="flex items-center justify-between px-0.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <Users size={12} className="text-primary" />
              Turmas: Alunos Matriculados & Capacidade Total
            </label>
            {selectedTurmaFilter !== 'all' && (
              <button 
                type="button"
                onClick={() => setSelectedTurmaFilter('all')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <X size={11} /> Limpar
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTurmaFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 transition-all flex items-center gap-1.5 shadow-sm",
                selectedTurmaFilter === 'all'
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/40"
              )}
            >
              <span>Todas</span>
              <span className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded-md font-bold",
                selectedTurmaFilter === 'all' ? "bg-white/20 text-white" : "bg-surface-container-high text-on-surface-variant"
              )}>
                {students.length} alunos
              </span>
            </button>
            {availableTurmas.map(turmaName => {
              const stats = turmaStats.find(ts => ts.name.toLowerCase() === turmaName.toLowerCase());
              const count = stats?.enrolled ?? students.filter(s => (s.turmas || []).some(t => t.toLowerCase() === turmaName.toLowerCase())).length;
              const cap = stats?.capacity ?? (capacities[turmaName] || 20);
              const occRate = stats?.occupancyRate ?? Math.round((count / cap) * 100);
              const isCrit = occRate >= 90;
              const isFull = occRate >= 100;
              const isSelected = selectedTurmaFilter.toLowerCase() === turmaName.toLowerCase();
              return (
                <button
                  key={turmaName}
                  type="button"
                  onClick={() => setSelectedTurmaFilter(isSelected ? 'all' : turmaName)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 transition-all flex items-center gap-2 shadow-sm",
                    isSelected
                      ? isCrit
                        ? "bg-amber-500 text-black border-amber-400 shadow-md ring-2 ring-amber-400 font-black"
                        : "bg-primary text-white border-primary shadow-sm ring-1 ring-primary"
                      : isCrit
                        ? isFull
                          ? "bg-red-500/20 text-red-200 border-red-500/60 ring-1 ring-red-500/40 hover:bg-red-500/30"
                          : "bg-amber-500/20 text-amber-200 border-amber-500/60 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                        : cn("hover:opacity-80", getTurmaColor(turmaName))
                  )}
                  title={`Filtrar alunos da ${turmaName} • ${count} matriculados de ${cap} vagas totais (${occRate}% ocupação)`}
                >
                  {isCrit ? (
                    <AlertTriangle size={13} className={isFull ? "text-red-400 animate-pulse shrink-0" : "text-amber-400 shrink-0"} />
                  ) : (
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isSelected ? "bg-white" : "bg-current")} />
                  )}
                  <span className="font-semibold">{turmaName}</span>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border transition-colors flex items-center gap-1",
                    isSelected 
                      ? isCrit ? "bg-black/20 text-black border-black/30 font-black" : "bg-white/20 text-white border-white/30" 
                      : isCrit
                        ? isFull ? "bg-red-500 text-white border-red-600" : "bg-amber-500 text-black border-amber-600"
                        : "bg-surface-container-high/90 text-on-surface border-outline/60"
                  )}>
                    <span>{count}</span>
                    <span className="opacity-70 font-normal">/</span>
                    <span>{cap}</span>
                    <span className="text-[8px] font-normal opacity-75 ml-0.5">vagas</span>
                  </span>
                  {isCrit ? (
                    <span className={cn(
                      "text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider",
                      isSelected ? "bg-black text-white" : isFull ? "bg-red-600 text-white animate-pulse" : "bg-amber-600 text-white"
                    )}>
                      {occRate}%
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono opacity-75 font-semibold">
                      {occRate}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de Pesquisa Instantânea por Nome ou CPF */}
        <div id="checkin-search-container" className="space-y-2 p-3.5 bg-surface-container-low/90 rounded-2xl border border-outline shadow-sm">
          <div className="flex items-center justify-between px-0.5 flex-wrap gap-2">
            <label htmlFor="checkin-search-input" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <Search size={13} className="text-primary" />
              <span>Pesquisar Aluno (Nome ou CPF)</span>
              <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                Filtro Instantâneo
              </span>
            </label>
            <div className="flex flex-wrap gap-1 text-[9px] font-bold">
              <button 
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded transition-all ${filterMode === 'all' ? 'bg-primary text-white font-black shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
              >
                Todos
              </button>
              <button 
                type="button"
                onClick={() => setFilterMode('studio')}
                className={`px-2 py-0.5 rounded transition-all ${filterMode === 'studio' ? 'bg-primary text-white font-black shadow-sm' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
              >
                Studio
              </button>
              <button 
                type="button"
                onClick={() => setFilterMode('partner')}
                className={`px-2 py-0.5 rounded transition-all ${filterMode === 'partner' ? 'bg-amber-500 text-white font-black shadow-sm' : 'text-amber-500 hover:bg-amber-500/10'}`}
              >
                Parceiros
              </button>
              <button 
                type="button"
                onClick={() => setFilterMode('WellHub')}
                className={`px-2 py-0.5 rounded transition-all ${filterMode === 'WellHub' ? 'bg-red-500 text-white font-black shadow-sm' : 'text-on-surface-variant hover:text-red-400 hover:bg-white/5'}`}
              >
                Wellhub
              </button>
              <button 
                type="button"
                onClick={() => setFilterMode('GuruPass')}
                className={`px-2 py-0.5 rounded transition-all ${filterMode === 'GuruPass' ? 'bg-indigo-500 text-white font-black shadow-sm' : 'text-on-surface-variant hover:text-indigo-400 hover:bg-white/5'}`}
              >
                GuruPass
              </button>
              <button 
                type="button"
                onClick={() => setFilterMode('TotalPass')}
                className={`px-2 py-0.5 rounded transition-all ${filterMode === 'TotalPass' ? 'bg-orange-500 text-white font-black shadow-sm' : 'text-on-surface-variant hover:text-orange-400 hover:bg-white/5'}`}
              >
                TotalPass
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={18} className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
              search ? "text-primary" : "text-on-surface-variant"
            )} />
            <input 
              id="checkin-search-input"
              type="text"
              placeholder={
                selectedTurmaFilter !== 'all'
                  ? `Filtrar aluno na ${selectedTurmaFilter} por nome ou CPF...`
                  : "Digite o nome ou CPF para filtrar instantaneamente (ex: Maria ou 123.456)..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border border-outline rounded-2xl pl-12 pr-28 py-3.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Limpar pesquisa"
                  aria-label="Limpar pesquisa"
                >
                  <X size={15} />
                </button>
              )}
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-surface-container-high border border-outline text-on-surface-variant select-none">
                {filtered.length} {filtered.length === 1 ? 'aluno' : 'alunos'}
              </span>
            </div>
          </div>
        </div>

        {/* Contextual Warning if Selected Turma is Critical (≥ 90%) */}
        {activeCriticalTurma && (
          <div className={cn(
            "p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in duration-200",
            activeCriticalTurma.isFull
              ? "bg-red-500/15 border-red-500/50 text-red-300"
              : "bg-amber-500/15 border-amber-500/50 text-amber-300"
          )}>
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle size={18} className="shrink-0 text-amber-400 animate-bounce" />
              <div className="min-w-0">
                <p className="font-bold truncate text-on-surface">
                  A turma <span className="text-amber-400 underline">{activeCriticalTurma.name}</span> está com <span className="text-amber-400 font-black">{activeCriticalTurma.occupancyRate}% de ocupação</span> ({activeCriticalTurma.enrolled}/{activeCriticalTurma.capacity} vagas).
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  {activeCriticalTurma.remaining <= 0
                    ? 'Capacidade máxima atingida ou excedida. Não há novas vagas disponíveis para esta turma.'
                    : `Restam apenas ${activeCriticalTurma.remaining} vaga(s) disponível(is) para novos alunos.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCapacityModalOpen(true)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-on-surface border border-white/20 shrink-0 transition-colors"
            >
              Ajustar Vagas
            </button>
          </div>
        )}

        {/* Results List */}
        {showResults && filtered.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1 text-on-surface-variant font-medium flex-wrap gap-2">
              <span className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-on-surface">
                  {appliedTurmaFilter 
                    ? `Turma "${appliedTurmaFilter}":` 
                    : selectedTurmaFilter !== 'all' 
                      ? `Matriculados na ${selectedTurmaFilter}:` 
                      : search.trim()
                        ? 'Alunos encontrados:'
                        : 'Alunos listados:'}
                </span>
                <span className="font-bold text-primary">{filtered.length} {filtered.length === 1 ? 'aluno' : 'alunos'}</span>
                {search.trim() && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold flex items-center gap-1">
                    <Search size={10} />
                    <span>Filtro: "{search}"</span>
                  </span>
                )}
                {selectedTurmaFilter !== 'all' && (() => {
                  const stats = turmaStats.find(ts => ts.name.toLowerCase() === selectedTurmaFilter.toLowerCase());
                  if (!stats) return null;
                  return (
                    <span className={cn(
                      "text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5",
                      stats.isCritical
                        ? stats.isFull ? "bg-red-500/20 text-red-300 border-red-500/50" : "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-surface-container-high text-on-surface-variant border-outline"
                    )}>
                      {stats.isCritical && <AlertTriangle size={11} className={stats.isFull ? "text-red-400" : "text-amber-400"} />}
                      <span>Lotação: <strong>{stats.enrolled} matriculados</strong> / <strong>{stats.capacity} vagas totais</strong> ({stats.occupancyRate}%)</span>
                    </span>
                  );
                })()}
              </span>
              {(appliedTurmaFilter || selectedTurmaFilter !== 'all') && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  Filtro de Turma Ativo
                </span>
              )}
            </div>

            <div className="bg-surface-container-low border border-outline rounded-2xl overflow-hidden divide-y divide-outline shadow-xl max-h-80 overflow-y-auto custom-scrollbar">
              <AnimatePresence initial={false}>
                {filtered.map(student => {
                  const usage = calculateStudentClassUsage(student);
                  const isPartner = student.planType !== 'Studio';
                  const searchDigits = search.trim().replace(/\D/g, '');
                  const studentDocDigits = (student.document || '').replace(/\D/g, '');
                  const isCpfMatch = searchDigits.length >= 2 && studentDocDigits.includes(searchDigits);

                  return (
                    <motion.div 
                      key={student.id} 
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.98,
                        y: -8,
                        height: 0,
                        paddingTop: 0,
                        paddingBottom: 0,
                        borderTopWidth: 0,
                        overflow: "hidden",
                        transition: {
                          opacity: { duration: 0.25, ease: "easeOut" },
                          scale: { duration: 0.25, ease: "easeOut" },
                          height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                          paddingTop: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                          paddingBottom: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                          borderTopWidth: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                          y: { duration: 0.25, ease: "easeOut" }
                        }
                      }}
                      transition={{
                        duration: 0.25,
                        layout: { duration: 0.32, ease: [0.4, 0, 0.2, 1] }
                      }}
                      className="p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-on-surface truncate">{student.name}</p>
                          {student.partnerMemberId && (
                            <span className="text-[9px] font-mono text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded border border-outline">
                              ID: {student.partnerMemberId}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            student.planType === 'Studio' 
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : student.planType === 'WellHub'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : student.planType === 'GuruPass'
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  : student.planType === 'TotalPass'
                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {student.planType}
                          </span>

                          {/* Class usage counter */}
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            usage.isExceeded
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : usage.monthlyClasses >= usage.monthlyLimit - 1
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {usage.monthlyClasses}/{usage.monthlyLimit} aulas ({usage.weeklyClasses}/{usage.weeklyLimit}/sem)
                          </span>
                          
                          {/* Turmas Badges with smooth fade-out and layout adjust on removal */}
                          <div className="flex flex-wrap gap-1 items-center">
                            <AnimatePresence initial={false}>
                              {(student.turmas && student.turmas.length > 0) ? (
                                student.turmas.map((t) => {
                                  const stats = turmaStats.find(ts => ts.name.toLowerCase() === t.toLowerCase());
                                  const enrolledCount = stats?.enrolled ?? effectiveStudents.filter(s => (s.turmas || []).some(item => item.toLowerCase() === t.toLowerCase())).length;
                                  const maxCap = stats?.capacity ?? (capacities[t] || 20);
                                  const isTCrit = maxCap > 0 && (enrolledCount / maxCap) >= 0.9;
                                  const isTFull = maxCap > 0 && enrolledCount >= maxCap;
                                  const isRemovingThis = removingTurmaKey === `${student.id}-${t}`;
                                  return (
                                    <motion.span 
                                      key={t}
                                      layout
                                      initial={{ opacity: 0, scale: 0.85 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ 
                                        opacity: 0, 
                                        scale: 0.72,
                                        maxWidth: 0,
                                        paddingLeft: 0,
                                        paddingRight: 0,
                                        marginLeft: 0,
                                        marginRight: 0,
                                        borderWidth: 0,
                                        filter: "blur(2px)",
                                        transition: {
                                          opacity: { duration: 0.28, ease: "easeOut" },
                                          scale: { duration: 0.28, ease: "easeOut" },
                                          maxWidth: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                                          paddingLeft: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                                          paddingRight: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                                          marginLeft: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                                          marginRight: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                                          borderWidth: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
                                        }
                                      }}
                                      transition={{ 
                                        duration: 0.25,
                                        layout: { duration: 0.32, ease: [0.4, 0, 0.2, 1] }
                                      }}
                                      className={cn(
                                        "text-[9px] pl-2 pr-1 py-0.5 rounded-full border font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors overflow-hidden whitespace-nowrap",
                                        getTurmaColor(t),
                                        isTCrit && (isTFull ? "ring-1 ring-red-500/80 bg-red-500/10" : "ring-1 ring-amber-500/80 bg-amber-500/10")
                                      )}
                                      title={`Turma ${t}: ${enrolledCount} alunos matriculados de ${maxCap} vagas totais`}
                                    >
                                      {isTCrit ? (
                                        <AlertTriangle size={10} className={isTFull ? "text-red-400 animate-pulse shrink-0" : "text-amber-400 shrink-0"} />
                                      ) : (
                                        <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                                      )}
                                      <span className="shrink-0">{t}</span>
                                      <span className="text-[8px] font-mono font-black opacity-90 px-1 py-0.2 rounded bg-black/15 dark:bg-white/10 shrink-0">
                                        {enrolledCount}/{maxCap} vagas
                                      </span>
                                      <button
                                        type="button"
                                        disabled={isRemovingThis}
                                        onClick={(e) => handleRemoveTurmaFromStudent(e, student, t)}
                                        className={cn(
                                          "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all cursor-pointer ml-0.5 shrink-0",
                                          "bg-black/10 dark:bg-white/15 hover:bg-red-500 hover:text-white text-current",
                                          "focus:outline-none focus:ring-1 focus:ring-red-400 active:scale-90",
                                          isRemovingThis && "opacity-50 pointer-events-none animate-spin"
                                        )}
                                        title={`Remover ${student.name} da turma ${t}`}
                                        aria-label={`Remover ${student.name} da turma ${t}`}
                                      >
                                        <X size={9} strokeWidth={2.5} />
                                      </button>
                                    </motion.span>
                                  );
                                })
                              ) : null}
                            </AnimatePresence>
                            {(!student.turmas || student.turmas.length === 0) && (
                              <motion.span 
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[10px] text-on-surface-variant/60 italic"
                              >
                                Sem turma
                              </motion.span>
                            )}
                          </div>

                          <motion.span 
                            layout
                            transition={{ layout: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } }}
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1",
                              isCpfMatch
                                ? "bg-primary/20 text-primary border-primary/40 font-bold ring-1 ring-primary/30"
                                : "text-on-surface-variant bg-surface-container/60 border-outline/50"
                            )}
                          >
                            <span className="opacity-70">CPF:</span>
                            <span className="font-medium">{student.document || '---'}</span>
                          </motion.span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isPartner ? (
                          <button 
                            onClick={() => setSelectedStudentForModal(student)}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                            title="Validar check-in integrado de parceiro"
                          >
                            <Zap size={13} />
                            <span>Validar</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              if (usage.isExceeded) {
                                setSelectedStudentForModal(student);
                              } else {
                                onCheckIn(student.id, selectedClass);
                                setSearch('');
                              }
                            }}
                            className={cn(
                              "px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-1.5",
                              usage.isExceeded
                                ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white"
                                : "bg-primary text-white"
                            )}
                          >
                            <CheckCircle2 size={13} />
                            <span>{usage.isExceeded ? 'Limite (Extra)' : 'Check-in'}</span>
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForModal(student)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-white/5 rounded-xl border border-outline transition-colors"
                          title="Detalhes do plano e controle integrado"
                        >
                          <Sliders size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {showResults && filtered.length === 0 && (
          <div className="p-8 text-center bg-surface-container-low border border-outline rounded-2xl border-dashed space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant border border-outline">
              <Search size={18} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-on-surface">
                Nenhum aluno encontrado
              </p>
              <p className="text-xs text-on-surface-variant">
                {search ? (
                  <>Nenhum aluno corresponde à pesquisa por <strong>"{search}"</strong> (nome ou CPF).</>
                ) : (
                  <>Nenhum aluno encontrado {appliedTurmaFilter ? ` na turma "${appliedTurmaFilter}"` : ''}{selectedTurmaFilter !== 'all' ? ` na "${selectedTurmaFilter}"` : ''}.</>
                )}
              </p>
            </div>
            {(selectedTurmaFilter !== 'all' || search || appliedTurmaFilter || filterMode !== 'all') && (
              <button 
                type="button"
                onClick={() => {
                  setSelectedTurmaFilter('all');
                  setSearch('');
                  setFilterMode('all');
                  handleClearTurmaFilter();
                }}
                className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <X size={13} />
                <span>Limpar filtros de busca</span>
              </button>
            )}
          </div>
        )}

        {recentCheckIns.length > 0 && (
          <div className="pt-2 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1 flex items-center justify-between">
              <span>Check-ins Recentes (Hoje)</span>
              <span className="text-primary font-black">{recentCheckIns.length} alunos</span>
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {recentCheckIns.map((ci, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-surface-container-low border border-outline rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border border-primary/20">
                      {ci.studentName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-on-surface truncate">{ci.studentName}</p>
                      <p className="text-[9px] text-on-surface-variant uppercase tracking-widest truncate">{ci.className}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0 ml-2">
                    {ci.planType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-outline/60 flex items-center justify-between text-[10px] text-on-surface-variant">
        <span>Validação com áudio e leitura óptica</span>
        <button 
          onClick={onOpenScanner}
          className="text-primary hover:underline font-bold"
        >
          Abrir Câmera
        </button>
      </div>

      {selectedStudentForModal && (
        <IntegratedCheckInModal
          isOpen={Boolean(selectedStudentForModal)}
          onClose={() => setSelectedStudentForModal(null)}
          student={selectedStudentForModal}
          onConfirmCheckIn={async (studentId, className, metadata) => {
            await onCheckIn(studentId, className, metadata);
            setSelectedStudentForModal(null);
            setSearch('');
          }}
          selectedClass={selectedClass}
        />
      )}

      {/* Modal de Configuração de Capacidades das Turmas */}
      <TurmaCapacityModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        turmas={availableTurmas}
        students={students}
        capacities={capacities}
        onSave={handleSaveCapacities}
        getTurmaColor={getTurmaColor}
      />
    </div>
  );
}
function GalleryScreen({ items, onRemove }: { items: GalleryItem[], onRemove: (id: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-headline font-black tracking-tight mb-2 uppercase">Galeria de Talentos</h2>
          <p className="text-sm sm:text-base text-on-surface-variant">Representação visual dos destaques e novos talentos do estúdio.</p>
        </div>
        
        <div className="bg-surface-container-low px-6 py-3 rounded-2xl border border-outline flex items-center gap-3">
          <Layout size={20} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {items.length} {items.length === 1 ? 'Cartão' : 'Cartões'} na Galeria
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed border-outline rounded-[48px] bg-white/[0.02] backdrop-blur-sm">
          <div className="w-20 h-20 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-6 text-on-surface-variant/20 border border-outline">
            <Layout size={40} />
          </div>
          <h3 className="text-xl font-headline font-bold uppercase tracking-tight mb-2">Sua galeria está vazia</h3>
          <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
            Salve alunos na tela de Gestão de Alunos para exibi-los aqui com uma representação visual premium.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <div className="bg-surface-container-high rounded-[40px] border border-outline overflow-hidden shadow-2xl kinetic-glow transform transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/10">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    {item.studentAvatar ? (
                      <img src={item.studentAvatar} alt={item.studentName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-container/20 flex items-center justify-center text-primary font-black text-5xl opacity-40">
                        {item.studentName.charAt(0)}
                      </div>
                    )}
                    
                    {/* Gradient Overlays */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-surface-container-high via-surface-container-high/60 to-transparent" />
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Content */}
                    <div className="absolute inset-x-6 bottom-8 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-primary text-white text-[8px] font-black rounded-lg uppercase tracking-widest shadow-lg">
                          {item.modality}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl font-headline font-black text-white leading-none uppercase tracking-tighter drop-shadow-lg">
                        {item.studentName}
                      </h3>
                      
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2.5 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[8px] font-bold text-white/80 uppercase tracking-widest">
                          {item.plan}
                        </span>
                      </div>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="w-10 h-10 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                        title="Remover da Galeria"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-surface-container flex items-center justify-between border-t border-outline/30">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                        By {item.savedBy.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                      {item.savedAt ? format(new Date(item.savedAt), 'dd/MM/yy') : '--/--/--'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

function DashboardScreen({ 
  students, 
  onCheckIn, 
  userRole, 
  payments, 
  events,
  currentUser,
  studioName = "STYLO URBANO",
  studioLogo = null,
  bankInfo,
  whatsAppConfig,
  turmas,
  turmaCapacities,
  onUpdateTurmaCapacities,
  onNavigateToFinancial,
  onNavigateToWhatsApp,
  onUpdateStudent,
  onConfirmPayment,
  onAddTestOverdueStudent,
  onAddExpense
}: { 
  students: Student[], 
  onCheckIn: (id: string, className: string) => Promise<void> | void, 
  userRole?: UserRole, 
  payments: PaymentRecord[], 
  events: ClassEvent[],
  currentUser?: User | null,
  studioName?: string,
  studioLogo?: string | null,
  bankInfo?: { bankName: string; pixKey: string; holderName: string },
  whatsAppConfig?: WhatsAppConfig,
  turmas?: string[],
  turmaCapacities?: Record<string, number>,
  onUpdateTurmaCapacities?: (newCapacities: Record<string, number>) => Promise<void> | void,
  onNavigateToFinancial?: () => void,
  onNavigateToWhatsApp?: () => void,
  onUpdateStudent?: (student: Student) => Promise<void> | void,
  onConfirmPayment?: (paymentId: string) => Promise<void> | void,
  onAddTestOverdueStudent?: () => void,
  onAddExpense?: (expense: { amount: number; description: string; category: string; date: string }) => Promise<void> | void
}) {
  const [turmaSearch, setTurmaSearch] = useState('');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [isQRScannerModalOpen, setIsQRScannerModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardStudent, setSelectedCardStudent] = useState<Student | null>(null);
  
  const turmaDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    
    students.forEach(s => {
      s.turmas.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    
    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    
    if (!turmaSearch.trim()) return data;
    
    return data.filter(t => 
      t.name.toLowerCase().includes(turmaSearch.toLowerCase())
    );
  }, [students, turmaSearch]);

  const checkInsToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return students.reduce((acc, s) => {
      return acc + (s.attendance || []).filter(a => a.date === today && a.present).length;
    }, 0);
  }, [students]);

  const stats = useMemo(() => {
    const income = payments.filter(p => (p as any).type === 'income' && p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
    return {
      income: `R$ ${(income / 1000).toFixed(1)}k`,
      trend: "Dados Reais"
    };
  }, [payments]);

  const checkInGoal = 20;
  const checkInPercentage = Math.min((checkInsToday / checkInGoal) * 100, 100);

  const realGrowthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(name => ({ name, students: 0 }));
    
    students.forEach(s => {
      if (s.joinDate) {
        const date = new Date(s.joinDate);
        if (!isNaN(date.getTime())) {
          const monthIndex = date.getMonth();
          for (let i = monthIndex; i < 12; i++) {
            data[i].students++;
          }
        }
      }
    });
    
    return data.slice(0, new Date().getMonth() + 1);
  }, [students]);

  const COLORS = ['#0EA5E9', '#F59E0B', '#6366F1', '#10B981'];

  const realInstructorPerformance = useMemo(() => {
    const perf: Record<string, { classes: number, attendance: number, totalSlots: number, enrolled: number }> = {};
    
    events.filter(e => e.type === 'Aula').forEach(e => {
      if (!perf[e.instructor]) {
        perf[e.instructor] = { classes: 0, attendance: 0, totalSlots: 0, enrolled: 0 };
      }
      perf[e.instructor].classes++;
      perf[e.instructor].totalSlots += e.capacity || 1;
      perf[e.instructor].enrolled += e.enrolled || 0;
    });
    
    return Object.entries(perf).map(([name, data]) => ({
      name,
      classes: data.classes,
      attendance: data.totalSlots > 0 ? Math.round((data.enrolled / data.totalSlots) * 100) : 0
    }));
  }, [events]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-headline font-black tracking-tight mb-2 uppercase">Visão Geral</h2>
          <p className="text-sm sm:text-base text-on-surface-variant">Métricas e performance do Stylo Urbano Studio.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
          {/* Direct QR Scanner Trigger */}
          <button
            onClick={() => setIsQRScannerModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-gradient-to-r from-primary to-[#FF8800] text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,107,0,0.3)] kinetic-glow cursor-pointer"
          >
            <Camera size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Escanear</span>
            <span>QR Code</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2 bg-surface-container-low p-1 rounded-xl border border-outline">
            <button 
              onClick={() => setTimeRange('today')}
              className={cn(
                "px-2.5 sm:px-4 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer",
                timeRange === 'today' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              Hoje
            </button>
            <button 
              onClick={() => setTimeRange('week')}
              className={cn(
                "px-2.5 sm:px-4 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer",
                timeRange === 'week' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              Semana
            </button>
            <button 
              onClick={() => setTimeRange('month')}
              className={cn(
                "px-2.5 sm:px-4 py-1 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer",
                timeRange === 'month' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Alunos Ativos" value={students.filter(s => s.status === 'active').length.toString()} trend="+4% esse mês" />
        <StatCard label="Presença Média" value="88%" trend="+2% essa semana" />
        <StatCard label="Aulas Hoje" value={events.filter(e => e.type === 'Aula').length.toString()} trend="Capacidade 85%" />
        {userRole === 'Gerente' && (
          <StatCard label="Faturamento" value={stats.income} trend={stats.trend} />
        )}
      </div>

      {/* Dashboard Financeiro Simplificado & Cobrança Rápida via WhatsApp */}
      {(userRole !== 'Aluno') && (
        <SimplifiedFinancialWidget
          students={students}
          payments={payments}
          bankInfo={bankInfo}
          whatsAppConfig={whatsAppConfig}
          studioName={studioName}
          onNavigateToFinancial={onNavigateToFinancial}
          onNavigateToWhatsApp={onNavigateToWhatsApp}
          onUpdateStudent={onUpdateStudent}
          onConfirmPayment={onConfirmPayment}
          onAddTestOverdueStudent={onAddTestOverdueStudent}
          onAddExpense={onAddExpense}
        />
      )}

      {/* Check-in Widget & Quick Validation */}
      {['Gerente', 'Recepcionista', 'Instrutor'].includes(userRole || '') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CheckInWidget 
              students={students} 
              onCheckIn={onCheckIn} 
              onOpenScanner={() => setIsQRScannerModalOpen(true)}
              turmas={turmas}
              turmaCapacities={turmaCapacities}
              onUpdateTurmaCapacities={onUpdateTurmaCapacities}
              onUpdateStudent={onUpdateStudent}
            />
          </div>
          <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-6 kinetic-glow flex flex-col justify-center text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2 border border-primary/20">
              <Camera size={30} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-headline font-bold">Validação Rápida</h3>
            <p className="text-xs text-on-surface-variant">
              Utilize o scanner por câmera para validar instantaneamente a entrada de alunos do Studio, WellHub, GuruPass e TotalPass.
            </p>
            
            <button
              onClick={() => setIsQRScannerModalOpen(true)}
              className="w-full py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,107,0,0.3)] flex items-center justify-center gap-2"
            >
              <Camera size={16} />
              <span>Abrir Câmera & Scanner</span>
            </button>

            <div className="pt-4 border-t border-outline/50">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                <span>Check-ins Hoje</span>
                <span className="text-primary font-black">{checkInsToday} alunos</span>
              </div>
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${checkInPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface-container p-8 rounded-3xl border border-outline space-y-6 kinetic-glow">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-headline font-bold">Crescimento de Alunos</h3>
            <Filter size={18} className="text-on-surface-variant" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realGrowthData}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#FF6B00' }}
                />
                <Area type="monotone" dataKey="students" stroke="#FF6B00" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Widget */}
        <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-6 kinetic-glow">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-headline font-bold">Distribuição por Turma</h3>
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Filtrar turmas..."
                value={turmaSearch}
                onChange={(e) => setTurmaSearch(e.target.value)}
                className="bg-surface-container-low border border-outline rounded-full pl-9 pr-4 py-1.5 text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-primary outline-none transition-all w-32 focus:w-48"
              />
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={turmaDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {turmaDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {turmaDistribution.map((t, i) => (
              <div key={t.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t.name}</span>
                <span className="text-xs font-black ml-auto">{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student Progress Chart */}
      <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-6 kinetic-glow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-headline font-bold">Progresso dos Alunos</h3>
            <p className="text-xs text-on-surface-variant">Média de evolução técnica dos alunos ao longo do semestre.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Score Médio</span>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={PROGRESS_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121212', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#FF6B00' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#FF6B00" 
                strokeWidth={4} 
                dot={{ fill: '#FF6B00', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Instructor Performance Widget */}
      <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-8 kinetic-glow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-headline font-bold">Performance dos Instrutores</h3>
            <p className="text-xs text-on-surface-variant">Métricas de engajamento e aulas ministradas no mês.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Taxa de Presença</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {realInstructorPerformance.length > 0 ? realInstructorPerformance.map((instructor) => (
            <div key={instructor.name} className="bg-surface-container-low p-6 rounded-2xl border border-outline hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary font-black border border-outline group-hover:scale-110 transition-transform">
                  {instructor.name.charAt(0)}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Aulas</p>
                  <p className="text-xl font-headline font-black">{instructor.classes}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold">{instructor.name}</p>
                  <p className="text-xs font-black text-primary">{instructor.attendance}%</p>
                </div>
                <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${instructor.attendance}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-primary shadow-[0_0_10px_rgba(255,107,0,0.5)]"
                  />
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-10 text-center opacity-30 border border-dashed border-outline rounded-3xl">
              <Users size={32} className="mx-auto mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum dado de instrutor disponível</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      <StudentQRScannerModal
        isOpen={isQRScannerModalOpen}
        onClose={() => setIsQRScannerModalOpen(false)}
        students={students}
        onCheckIn={onCheckIn}
        currentUser={currentUser}
      />

      {/* Student Digital ID Card Modal */}
      <StudentDigitalCardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setSelectedCardStudent(null);
        }}
        student={selectedCardStudent}
        studioName={studioName}
        studioLogo={studioLogo}
      />
    </motion.div>
  );
}
function StudentsScreen({ 
  students, 
  setStudents, 
  onSelectStudent, 
  modalities,
  turmas,
  onUpdateTurmas,
  onOpenPaymentModal,
  currentUser,
  onDeleteStudent,
  onUpdateStudent,
  onSaveToGallery
}: { 
  students: Student[], 
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>, 
  onSelectStudent: (id: string) => void, 
  modalities: string[],
  turmas: string[],
  onUpdateTurmas: (newTurmas: string[]) => void,
  onOpenPaymentModal: (id: string) => void,
  currentUser: User | null,
  onDeleteStudent: (id: string) => void,
  onUpdateStudent: (s: Student) => void,
  onSaveToGallery: (s: Student) => void
}) {
  const [activeTab, setActiveTab] = useState<'list' | 'attendance'>(currentUser?.role === 'Instrutor' ? 'attendance' : 'list');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilters, setModalityFilters] = useState<string[]>([]);
  const [turmaFilter, setTurmaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activityStartDate, setActivityStartDate] = useState('');
  const [activityEndDate, setActivityEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Custom Confirmation Modal State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardStudent, setSelectedCardStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Attendance State
  const [attendanceClass, setAttendanceClass] = useState('');
  const [attendanceInstructor, setAttendanceInstructor] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({});
  const [attendanceListFilter, setAttendanceListFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [attendanceHistoryFilter, setAttendanceHistoryFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const fullClassHistory = useMemo(() => {
    if (!attendanceClass) return [];
    
    const history: { studentName: string, date: string, present: boolean, instructor: string }[] = [];
    
    students.forEach(student => {
      if (student.classes.includes(attendanceClass)) {
        student.attendance.forEach(record => {
          if (record.className === attendanceClass) {
            history.push({
              studentName: student.name,
              date: record.date,
              present: record.present,
              instructor: record.instructor || ''
            });
          }
        });
      }
    });
    
    return history
      .filter(record => {
        const searchLower = attendanceSearchTerm.toLowerCase();
        const matchesSearch = !attendanceSearchTerm || 
          record.studentName.toLowerCase().includes(searchLower) ||
          record.instructor.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;

        if (attendanceHistoryFilter === 'all') return true;
        return attendanceHistoryFilter === 'present' ? record.present : !record.present;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.studentName.localeCompare(b.studentName));
  }, [attendanceClass, students, attendanceHistoryFilter, attendanceSearchTerm]);

  useEffect(() => {
    if (attendanceClass) {
      setAttendanceSearchTerm('');
      const initialData: Record<string, boolean> = {};
      students.forEach(s => {
        if (s.classes.includes(attendanceClass)) {
          const existing = s.attendance.find(a => a.date === attendanceDate && a.className === attendanceClass);
          initialData[s.id] = existing ? existing.present : true;
          if (existing && existing.instructor) {
            setAttendanceInstructor(existing.instructor);
          }
        }
      });
      setAttendanceData(initialData);
    }
  }, [attendanceClass, attendanceDate, students]);

  const handleSaveAttendance = () => {
    if (!attendanceClass) {
      toast.error('Selecione uma modalidade');
      return;
    }

    if (!attendanceInstructor) {
      toast.error('Informe o instrutor responsável');
      return;
    }

    setStudents(prev => prev.map(student => {
      if (student.classes.includes(attendanceClass)) {
        const isPresent = attendanceData[student.id] ?? true;
        const otherAttendance = student.attendance.filter(a => !(a.date === attendanceDate && a.className === attendanceClass));
        return {
          ...student,
          attendance: [
            ...otherAttendance, 
            { 
              id: `a${Date.now()}-${student.id}`,
              date: attendanceDate, 
              present: isPresent, 
              className: attendanceClass, 
              instructor: attendanceInstructor 
            }
          ]
        };
      }
      return student;
    }));

    toast.success('Chamada salva!', {
      description: `Frequência de ${attendanceClass} com ${attendanceInstructor} registrada.`
    });
  };
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    birthDate: '',
    document: '',
    paymentStatus: 'paid',
    status: 'active',
    address: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    planType: 'Studio',
    contractedPlan: 'Mensal',
    joinDate: format(new Date(), 'yyyy-MM-dd'),
    avatar: undefined as string | undefined,
    preferredDays: [] as string[],
    partnerMemberId: '',
    customClassLimit: undefined as number | undefined,
    customWeeklyLimit: undefined as number | undefined
  });
  const [formClasses, setFormClasses] = useState<string[]>([]);
  const [formTurmas, setFormTurmas] = useState<string[]>([]);
  const [formSubModalities, setFormSubModalities] = useState<string[]>([]);
  const [expandedModalities, setExpandedModalities] = useState<string[]>([]);
  const [formNovasModalidades, setFormNovasModalidades] = useState<string[]>([]);
  const [showModalitiesDropdown, setShowModalitiesDropdown] = useState(false);
  const [modalitySearch, setModalitySearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalitiesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalitiesDropdownRef.current && !modalitiesDropdownRef.current.contains(event.target as Node)) {
        setShowModalitiesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateField = (field: string, value: any) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (!value.trim()) error = 'O nome é obrigatório';
        else if (value.trim().length < 3) error = 'O nome deve ter no mínimo 3 caracteres';
        break;
      case 'contact':
        const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
        if (!value.trim()) error = 'O telefone é obrigatório';
        else if (!phoneRegex.test(value.replace(/\D/g, ''))) error = 'Formato de telefone inválido';
        break;
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!value.trim()) error = 'O e-mail é obrigatório';
        else if (!emailRegex.test(value)) error = 'Formato de e-mail inválido';
        break;
      case 'birthDate':
        if (!value) error = 'A data de nascimento é obrigatória';
        break;
      case 'document':
        const cleanDoc = value.replace(/\D/g, '');
        if (!value.trim()) error = 'O CPF/CNPJ é obrigatório';
        else if (cleanDoc.length !== 11 && cleanDoc.length !== 14) error = 'Documento inválido (CPF ou CNPJ)';
        break;
      case 'street':
        if (!value.trim()) error = 'O logradouro é obrigatório';
        break;
      case 'neighborhood':
        if (!value.trim()) error = 'O bairro é obrigatório';
        break;
      case 'city':
        if (!value.trim()) error = 'A cidade é obrigatória';
        break;
      case 'state':
        if (!value.trim()) error = 'O estado é obrigatório';
        break;
      case 'zipCode':
        if (!value.trim()) error = 'O CEP é obrigatório';
        else if (value.replace(/\D/g, '').length !== 8) error = 'CEP deve ter 8 dígitos';
        break;
      case 'number':
        if (!value.trim()) error = 'O número é obrigatório';
        break;
      case 'classes':
        if (value.length === 0) error = 'Pelo menos uma modalidade é necessária';
        break;
      case 'turmas':
        if (value.length === 0) error = 'Pelo menos uma turma é necessária';
        break;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      return newErrors;
    });

    return !error;
  };

  const validateForm = () => {
    const fields = ['name', 'contact', 'email', 'birthDate', 'document', 'street', 'number', 'neighborhood', 'city', 'state', 'zipCode'];
    let isValid = true;
    fields.forEach(field => {
      if (!validateField(field, (formData as any)[field])) isValid = false;
    });
    if (!validateField('classes', formClasses)) isValid = false;
    if (!validateField('turmas', formTurmas)) isValid = false;
    return isValid;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSave = async () => {
    if (validateForm()) {
      try {
        if (editingStudentId) {
          const existingStudent = students.find(s => s.id === editingStudentId);
          if (existingStudent) {
            const formattedAddress = `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}, ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.zipCode}`;
            
            const updatedStudent: Student = {
              ...existingStudent,
              name: formData.name,
              email: formData.email,
              contact: formData.contact,
              address: formattedAddress,
              street: formData.street,
              number: formData.number,
              complement: formData.complement,
              neighborhood: formData.neighborhood,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              document: formData.document,
              birthDate: formData.birthDate,
              classes: formClasses,
              turmas: formTurmas,
              subModalities: formSubModalities,
              novasModalidades: formNovasModalidades,
              status: formData.status as any,
              paymentStatus: formData.paymentStatus as any,
              planType: formData.planType as any,
              contractedPlan: formData.contractedPlan as any,
              partnerMemberId: formData.partnerMemberId || undefined,
              customClassLimit: formData.customClassLimit || undefined,
              customWeeklyLimit: formData.customWeeklyLimit || undefined,
              joinDate: formData.joinDate,
              avatar: formData.avatar,
              preferredDays: formData.preferredDays
            };
            await updateDoc(doc(db, 'students', editingStudentId), updatedStudent as any);
            onUpdateStudent(updatedStudent);
            setEditingStudentId(null);
            toast.success('Cadastro atualizado!');
          }
        } else {
          const formattedAddress = `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}, ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.zipCode}`;

          const newStudent: Student = {
            id: `s${Date.now()}`,
            name: formData.name,
            email: formData.email,
            contact: formData.contact,
            phone: formData.contact, // Using contact as phone
            address: formattedAddress,
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            document: formData.document,
            birthDate: formData.birthDate,
            classes: formClasses,
            turmas: formTurmas,
            subModalities: formSubModalities,
            novasModalidades: formNovasModalidades,
            status: formData.status as any,
            paymentStatus: formData.paymentStatus as any,
            planType: formData.planType as any,
            contractedPlan: formData.contractedPlan as any,
            partnerMemberId: formData.partnerMemberId || undefined,
            customClassLimit: formData.customClassLimit || undefined,
            customWeeklyLimit: formData.customWeeklyLimit || undefined,
            joinDate: formData.joinDate,
            attendance: [],
            feedbacks: [],
            performance: [],
            messages: [],
            notes: [],
            isFavorite: false,
            avatar: formData.avatar,
            preferredDays: formData.preferredDays
          };

          await setDoc(doc(db, 'students', newStudent.id), newStudent);
          setStudents(prev => [newStudent, ...prev]);
          
          // Create a User document for the student so they can login
          const newUser: User = {
            id: newStudent.id,
            name: newStudent.name,
            email: newStudent.email,
            phone: newStudent.contact,
            role: 'Aluno',
            avatar: newStudent.avatar,
            preferredDays: newStudent.preferredDays,
            password: 'Vemdançar',
            mustChangePassword: true
          };
          await setDoc(doc(db, 'users', newUser.id), newUser);
          
          // Send welcome email to student
          await sendWelcomeEmail({
            to: newStudent.email,
            name: newStudent.name,
            role: 'Aluno',
            login: newStudent.email,
            password: 'Vemdançar',
            phone: newStudent.contact
          });

          toast.success('Cadastro realizado e e-mail enviado!', { 
            description: `${formData.name} foi adicionado(a) com sucesso.` 
          });
        }
        
        setFormData({
          name: '',
          contact: '',
          email: '',
          birthDate: '',
          document: '',
          paymentStatus: 'paid',
          status: 'active',
          address: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: '',
          planType: 'Studio',
          contractedPlan: 'Mensal',
          joinDate: format(new Date(), 'yyyy-MM-dd'),
          avatar: undefined,
          preferredDays: [],
          partnerMemberId: '',
          customClassLimit: undefined,
          customWeeklyLimit: undefined
        });
        setFormClasses([]);
        setFormTurmas([]);
        setFormSubModalities([]);
        setFormNovasModalidades([]);
        setErrors({});
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'students');
      }
    } else {
      toast.error('Erro no cadastro', { 
        description: 'Por favor, corrija os campos destacados.' 
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingStudentId(student.id);
    setFormData({
      name: student.name,
      contact: student.contact,
      email: student.email,
      birthDate: student.birthDate,
      document: student.document,
      paymentStatus: student.paymentStatus,
      status: student.status,
      address: student.address || '',
      street: student.street || '',
      number: student.number || '',
      complement: student.complement || '',
      neighborhood: student.neighborhood || '',
      city: student.city || '',
      state: student.state || '',
      zipCode: student.zipCode || '',
      planType: student.planType || 'Studio',
      contractedPlan: student.contractedPlan || 'Mensal',
      partnerMemberId: student.partnerMemberId || '',
      customClassLimit: student.customClassLimit,
      customWeeklyLimit: student.customWeeklyLimit,
      joinDate: student.joinDate || format(new Date(), 'yyyy-MM-dd'),
      avatar: student.avatar,
      preferredDays: student.preferredDays || []
    });
    setFormClasses(student.classes);
    setFormTurmas(student.turmas);
    setFormSubModalities(student.subModalities || []);
    setFormNovasModalidades(student.novasModalidades || []);
    setErrors({});
    
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [newTurmaName, setNewTurmaName] = useState('');
  const [showAddTurma, setShowAddTurma] = useState(false);

  const handleAddTurma = () => {
    if (!newTurmaName.trim()) return;
    if (turmas.includes(newTurmaName.trim())) {
      toast.error('Esta turma já existe');
      return;
    }
    onUpdateTurmas([...turmas, newTurmaName.trim()]);
    setNewTurmaName('');
    setShowAddTurma(false);
    toast.success('Nova turma adicionada!');
  };

  const handleRemoveTurma = (turma: string) => {
    onUpdateTurmas(turmas.filter(t => t !== turma));
    toast.success('Turma removida');
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      
      // Advanced search parsing
      if (searchLower.includes(':')) {
        const parts = searchLower.split(' ');
        return parts.every(part => {
          if (part.includes(':')) {
            const [key, value] = part.split(':');
            if (!value) return true;
            
            switch (key) {
              case 'nome':
                return student.name.toLowerCase().includes(value);
              case 'email':
                return student.email.toLowerCase().includes(value);
              case 'doc':
              case 'cpf':
                const cleanValue = value.replace(/\D/g, '');
                const cleanDoc = student.document.replace(/\D/g, '');
                return student.document.toLowerCase().includes(value) || (cleanValue && cleanDoc.includes(cleanValue));
              case 'tel':
              case 'contato':
                return student.contact.toLowerCase().includes(value);
              case 'status':
                return student.status.toLowerCase() === value;
              case 'pagamento':
                return student.paymentStatus.toLowerCase() === value;
              case 'modalidade':
                return student.classes.some(c => c.toLowerCase().includes(value)) ||
                       (student.novasModalidades && student.novasModalidades.some(c => c.toLowerCase().includes(value)));
              case 'turma':
                return student.turmas.some(t => t.toLowerCase().includes(value));
              case 'plano':
                return student.planType.toLowerCase().includes(value);
              case 'desde':
                return student.joinDate >= value;
              case 'ate':
                return student.joinDate <= value;
              case 'atividade_desde':
                const lastActSince = student.messages.length > 0 
                  ? student.messages[0].timestamp.split('T')[0] 
                  : '';
                return lastActSince && lastActSince >= value;
              case 'atividade_ate':
                const lastActUntil = student.messages.length > 0 
                  ? student.messages[0].timestamp.split('T')[0] 
                  : '';
                return lastActUntil && lastActUntil <= value;
              default:
                return true;
            }
          }
          const cleanPart = part.replace(/\D/g, '');
          const cleanDoc = student.document.replace(/\D/g, '');
          
          return student.name.toLowerCase().includes(part) ||
                 student.email.toLowerCase().includes(part) ||
                 student.document.toLowerCase().includes(part) ||
                 (cleanPart && cleanDoc.includes(cleanPart)) ||
                 student.contact.toLowerCase().includes(part);
        });
      }

      const cleanSearch = searchLower.replace(/\D/g, '');
      const cleanDoc = student.document.replace(/\D/g, '');

      const matchesSearch = !searchTerm || 
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.document.toLowerCase().includes(searchLower) ||
        (cleanSearch && cleanDoc.includes(cleanSearch)) ||
        student.contact.toLowerCase().includes(searchLower) ||
        student.planType.toLowerCase().includes(searchLower) ||
        (student.novasModalidades && student.novasModalidades.some(c => c.toLowerCase().includes(searchLower)));
      
      const matchesModality = modalityFilters.length === 0 || 
        student.classes.some(c => modalityFilters.includes(c)) ||
        (student.novasModalidades && student.novasModalidades.some(c => modalityFilters.includes(c)));
        
      const matchesTurma = turmaFilter === 'all' || student.turmas.includes(turmaFilter);
        
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || student.paymentStatus === paymentFilter;
      
      const matchesStartDate = !startDate || student.joinDate >= startDate;
      const matchesEndDate = !endDate || student.joinDate <= endDate;
      
      const lastActivity = student.messages.length > 0 
        ? student.messages[0].timestamp.split('T')[0] 
        : '';
        
      const matchesActivityStartDate = !activityStartDate || (lastActivity && lastActivity >= activityStartDate);
      const matchesActivityEndDate = !activityEndDate || (lastActivity && lastActivity <= activityEndDate);
      
      return matchesSearch && matchesModality && matchesTurma && matchesStatus && matchesPayment && 
             matchesStartDate && matchesEndDate && matchesActivityStartDate && matchesActivityEndDate;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchTerm, modalityFilters, turmaFilter, statusFilter, paymentFilter, startDate, endDate, activityStartDate, activityEndDate]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, modalityFilters, turmaFilter, statusFilter, paymentFilter, startDate, endDate, activityStartDate, activityEndDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setModalityFilters([]);
    setTurmaFilter('all');
    setStatusFilter('all');
    setPaymentFilter('all');
    setStartDate('');
    setEndDate('');
    setActivityStartDate('');
    setActivityEndDate('');
  };

  const toggleModality = (modality: string) => {
    setModalityFilters(prev => 
      prev.includes(modality) 
        ? prev.filter(m => m !== modality) 
        : [...prev, modality]
    );
  };

  const handleExportCSV = () => {
    const headers = ['Nome', 'Contato', 'Documento', 'Modalidades', 'Turmas', 'Status', 'Pagamento', 'Data de Ingresso'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => [
        `"${student.name}"`,
        `"${student.contact}"`,
        `"${student.document}"`,
        `"${student.classes.join('; ')}"`,
        `"${student.turmas.join('; ')}"`,
        student.status === 'active' ? 'Ativo' : 'Inativo',
        student.paymentStatus === 'paid' ? 'Pago' : student.paymentStatus === 'pending' ? 'Pendente' : 'Atrasado',
        student.joinDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `alunos_stylo_urbano_${format(new Date(), 'dd_MM_yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-headline font-black tracking-tight mb-2 uppercase">Gestão de Alunos</h2>
          <p className="text-sm sm:text-base text-on-surface-variant">Gerencie, filtre e cadastre novos talentos no estúdio.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="bg-surface-container-low p-1 rounded-xl sm:rounded-2xl border border-outline flex">
            {['Gerente', 'Recepcionista'].includes(currentUser?.role || '') && (
              <button 
                onClick={() => setActiveTab('list')}
                className={cn(
                  "px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
                  activeTab === 'list' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Lista
              </button>
            )}
            <button 
              onClick={() => setActiveTab('attendance')}
              className={cn(
                "px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
                activeTab === 'attendance' ? (currentUser?.role === 'Instrutor' ? "bg-emerald-500" : "bg-primary") + " text-white shadow-lg" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Chamada
            </button>
          </div>
          {['Gerente', 'Recepcionista'].includes(currentUser?.role || '') && (
            <button 
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 sm:py-3 bg-surface-container-low border border-outline rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high hover:text-primary transition-all group cursor-pointer active:scale-95"
            >
              <Download size={14} className="text-on-surface-variant group-hover:text-primary transition-colors" />
              <span>Exportar</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        {/* Form */}
        <div ref={formRef} className={cn(
          "lg:col-span-2 bg-surface-container p-6 sm:p-10 rounded-3xl border space-y-6 sm:space-y-8 kinetic-glow transition-all duration-500",
          Object.keys(errors).length > 0 ? "border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.1)]" : "border-outline shadow-xl"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg sm:text-xl font-headline font-bold flex items-center gap-3">
              {editingStudentId ? <Edit className="text-primary" /> : <Plus className="text-primary" />}
              {editingStudentId ? 'Editar Aluno' : 'Novo Aluno'}
            </h3>
            
            <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-2xl border border-outline/50">
              <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(Object.keys(formData).filter(k => 
                      ['name', 'contact', 'email', 'birthDate', 'document', 'street', 'number', 'neighborhood', 'city', 'state', 'zipCode'].includes(k) && 
                      (formData as any)[k]?.trim().length > 0
                    ).length / 11) * 100}%` 
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                {Math.round((Object.keys(formData).filter(k => 
                  ['name', 'contact', 'email', 'birthDate', 'document', 'street', 'number', 'neighborhood', 'city', 'state', 'zipCode'].includes(k) && 
                  (formData as any)[k]?.trim().length > 0
                ).length / 11) * 100)}% concluído
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-4">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Foto de Perfil</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-outline flex items-center justify-center overflow-hidden bg-surface-container-low relative group">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-on-surface-variant/30" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden" 
                    id="student-photo-upload"
                  />
                  <label 
                    htmlFor="student-photo-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-lg shadow-primary/20"
                  >
                    <Upload size={16} />
                    Carregar Foto
                  </label>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">JPG, PNG ou GIF. Recomendado 1:1.</p>
                </div>
              </div>
            </div>

            <InputGroup 
              label="Nome Completo" 
              placeholder="Ex: Maria Silva" 
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              required
            />
            <InputGroup 
              label="Telefone / WhatsApp" 
              placeholder="(11) 90000-0000" 
              type="tel" 
              value={formData.contact}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              error={errors.contact}
              required
            />
            <InputGroup 
              label="E-mail" 
              placeholder="contato@exemplo.com" 
              type="email" 
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              required
            />
            <InputGroup 
              label="Data de Nascimento" 
              placeholder="" 
              type="date" 
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              error={errors.birthDate}
              required
            />
            <InputGroup 
              label="Documento (CPF/CNPJ)" 
              placeholder="000.000.000-00" 
              value={formData.document}
              onChange={(e) => handleInputChange('document', e.target.value)}
              error={errors.document}
              required
            />
            <InputGroup 
              label="Data de Adesão" 
              type="date" 
              value={formData.joinDate}
              onChange={(e) => handleInputChange('joinDate', e.target.value)}
              error={errors.joinDate}
              required
            />
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tipo de Plano</label>
              <div className="relative">
                <select 
                  value={formData.planType}
                  onChange={(e) => handleInputChange('planType', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10"
                >
                  <option value="Studio">Studio</option>
                  <option value="WellHub">WellHub</option>
                  <option value="GuruPass">GuruPass</option>
                  <option value="TotalPass">TotalPass</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Plano Contratado</label>
              <div className="relative">
                <select 
                  value={formData.contractedPlan}
                  onChange={(e) => handleInputChange('contractedPlan', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10"
                >
                  <option value="">Selecione um plano...</option>
                  {PLANS_CONFIG.filter(p => !formData.planType || p.type === formData.planType).map(plan => (
                    <option key={plan.id} value={plan.name}>{plan.name} {plan.price > 0 ? `- R$ ${plan.price}` : ''}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status de Pagamento</label>
              <div className="relative">
                <select 
                  value={formData.paymentStatus}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10"
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="overdue">Atrasado</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status do Aluno</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => handleInputChange('status', 'active')}
                  className={cn(
                    "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                    formData.status === 'active' 
                      ? "bg-emerald-500 text-white border-emerald-500" 
                      : "bg-surface-container-low border-outline text-on-surface-variant"
                  )}
                >
                  Ativo
                </button>
                <button 
                  type="button"
                  onClick={() => handleInputChange('status', 'inactive')}
                  className={cn(
                    "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                    formData.status === 'inactive' 
                      ? "bg-red-500 text-white border-red-500" 
                      : "bg-surface-container-low border-outline text-on-surface-variant"
                  )}
                >
                  Inativo
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Dias da Semana (Pretendidos)</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setFormData(prev => {
                        const current = prev.preferredDays || [];
                        const next = current.includes(day)
                          ? current.filter(d => d !== day)
                          : current.length < 6 
                            ? [...current, day]
                            : current;
                        return { ...prev, preferredDays: next };
                      });
                    }}
                    className={cn(
                      "flex-1 min-w-[60px] py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                      (formData.preferredDays || []).includes(day)
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                        : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/50"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest italic opacity-60">Escolha de 1 a 6 dias da semana.</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Modalidades</label>
                {errors.classes && <span className="text-[10px] text-red-500 font-bold uppercase animate-pulse">{errors.classes}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {modalities.map(modality => (
                  <button
                    key={modality}
                    type="button"
                    onClick={() => {
                      setFormClasses(prev => {
                        const next = prev.includes(modality) 
                          ? prev.filter(m => m !== modality) 
                          : [...prev, modality];
                        if (next.length > 0 && errors.classes) {
                          setErrors(e => {
                            const newE = { ...e };
                            delete newE.classes;
                            return newE;
                          });
                        }
                        return next;
                      });
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      formClasses.includes(modality)
                        ? getModalityColor(modality)
                        : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/50",
                      errors.classes && "border-red-500/50"
                    )}
                  >
                    {modality}
                  </button>
                ))}
              </div>
            </div>

            {formClasses.length > 0 && (
              <div className="space-y-4 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Submodalidades por Categoria</label>
                <div className="grid grid-cols-1 gap-4">
                  {formClasses.map(modality => {
                    const subModalities = MODALITIES_CONFIG[modality] || [];
                    if (subModalities.length === 0) return null;
                    const isExpanded = expandedModalities.includes(modality);

                    return (
                      <div key={modality} className="bg-surface-container-low border border-outline rounded-2xl overflow-hidden transition-all">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedModalities(prev => 
                              prev.includes(modality) ? prev.filter(m => m !== modality) : [...prev, modality]
                            );
                          }}
                          className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-container transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold", getModalityColor(modality))}>
                              {modality.charAt(0)}
                            </div>
                            <span className="text-sm font-bold">{modality}</span>
                            <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant font-bold">
                              {formSubModalities.filter(s => subModalities.includes(s)).length} selecionadas
                            </span>
                          </div>
                          <ChevronDown size={18} className={cn("text-on-surface-variant transition-transform", isExpanded && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 pt-0 flex flex-wrap gap-2">
                                {subModalities.map(sub => (
                                  <button
                                    key={sub}
                                    type="button"
                                    onClick={() => {
                                      setFormSubModalities(prev => 
                                        prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
                                      );
                                    }}
                                    className={cn(
                                      "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                                      formSubModalities.includes(sub)
                                        ? "bg-primary/10 border-primary/30 text-primary"
                                        : "bg-surface-container border-outline text-on-surface-variant hover:border-primary/50"
                                    )}
                                  >
                                    {sub}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Turmas</label>
                {errors.turmas && <span className="text-[10px] text-red-500 font-bold uppercase animate-pulse">{errors.turmas}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {turmas.map(turma => (
                  <button
                    key={turma}
                    type="button"
                    onClick={() => {
                      setFormTurmas(prev => {
                        const next = prev.includes(turma) 
                          ? prev.filter(t => t !== turma) 
                          : [...prev, turma];
                        if (next.length > 0 && errors.turmas) {
                          setErrors(e => {
                            const newE = { ...e };
                            delete newE.turmas;
                            return newE;
                          });
                        }
                        return next;
                      });
                    }}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      formTurmas.includes(turma)
                        ? getTurmaColor(turma)
                        : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/50",
                      errors.turmas && "border-red-500/50"
                    )}
                  >
                    {turma}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAddTurma(!showAddTurma)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all border border-dashed border-outline text-on-surface-variant hover:border-primary hover:text-primary flex items-center gap-2"
                >
                  <Plus size={14} />
                  Nova Turma
                </button>
              </div>
              
              <AnimatePresence>
                {showAddTurma && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 p-4 bg-surface-container-low border border-outline rounded-2xl">
                      <input 
                        type="text"
                        placeholder="Nome da nova turma..."
                        value={newTurmaName}
                        onChange={(e) => setNewTurmaName(e.target.value)}
                        className="flex-1 bg-surface-container border border-outline rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTurma()}
                      />
                      <button 
                        onClick={handleAddTurma}
                        className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                      >
                        Adicionar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-3 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Novas Modalidades (Catálogo Completo)</label>
              </div>
              <div className="relative" ref={modalitiesDropdownRef}>
                <div 
                  onClick={() => setShowModalitiesDropdown(!showModalitiesDropdown)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm cursor-pointer flex flex-wrap gap-2 min-h-[50px] items-center hover:border-primary/50 transition-all"
                >
                  {formNovasModalidades.length === 0 ? (
                    <span className="text-on-surface-variant/50 italic">Selecione as modalidades do catálogo...</span>
                  ) : (
                    formNovasModalidades.map(m => (
                      <span 
                        key={m} 
                        className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1",
                          getModalityColor(m)
                        )}
                      >
                        {m}
                        <XCircle 
                          size={12} 
                          className="cursor-pointer hover:scale-110 transition-transform" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormNovasModalidades(prev => prev.filter(item => item !== m));
                          }}
                        />
                      </span>
                    ))
                  )}
                </div>

                <AnimatePresence>
                  {showModalitiesDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-2 bg-surface-container-high border border-outline rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-outline bg-surface-container flex items-center gap-3">
                        <Search size={16} className="text-on-surface-variant" />
                        <input 
                          type="text"
                          placeholder="Buscar modalidade..."
                          value={modalitySearch}
                          onChange={(e) => setModalitySearch(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm w-full"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {Array.from(new Set([...Object.keys(MODALITIES_CONFIG), ...modalities]))
                          .filter(m => m.toLowerCase().includes(modalitySearch.toLowerCase()))
                          .map(m => (
                            <div 
                              key={m}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormNovasModalidades(prev => 
                                  prev.includes(m) ? prev.filter(item => item !== m) : [...prev, m]
                                );
                              }}
                              className={cn(
                                "flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all",
                                formNovasModalidades.includes(m) 
                                  ? "bg-primary/10 text-primary" 
                                  : "hover:bg-surface-container text-on-surface-variant"
                              )}
                            >
                              <span className="text-sm font-medium">{m}</span>
                              {formNovasModalidades.includes(m) && <CheckCheck size={16} />}
                            </div>
                          ))}
                        {Array.from(new Set([...Object.keys(MODALITIES_CONFIG), ...modalities])).filter(m => m.toLowerCase().includes(modalitySearch.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-xs text-on-surface-variant italic">
                            Nenhuma modalidade encontrada.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status de Pagamento</label>
              <select 
                value={formData.paymentStatus}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none appearance-none transition-all"
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Atrasado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status do Aluno</label>
              <select 
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none appearance-none transition-all"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tipo de Plano</label>
              <select 
                value={formData.planType}
                onChange={(e) => handleInputChange('planType', e.target.value)}
                className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none appearance-none transition-all"
              >
                <option value="Studio">Direto do Studio</option>
                <option value="WellHub">WellHub (Gympass)</option>
                <option value="GuruPass">GuruPass</option>
                <option value="TotalPass">TotalPass</option>
              </select>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3">
                <InputGroup 
                  label="Logradouro" 
                  placeholder="Rua, Avenida, etc." 
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  error={errors.street}
                  required
                />
              </div>
              <div>
                <InputGroup 
                  label="Número" 
                  placeholder="123" 
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  error={errors.number}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <InputGroup 
                  label="Complemento" 
                  placeholder="Apto, Bloco, etc." 
                  value={formData.complement}
                  onChange={(e) => handleInputChange('complement', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <InputGroup 
                  label="Bairro" 
                  placeholder="Bairro" 
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  error={errors.neighborhood}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <InputGroup 
                  label="Cidade" 
                  placeholder="Cidade" 
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  error={errors.city}
                  required
                />
              </div>
              <div>
                <InputGroup 
                  label="Estado" 
                  placeholder="SP" 
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  error={errors.state}
                  required
                />
              </div>
              <div>
                <InputGroup 
                  label="CEP" 
                  placeholder="00000-000" 
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  error={errors.zipCode}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col xs:flex-row justify-end gap-3 sm:gap-4">
            <button 
              onClick={() => {
                setEditingStudentId(null);
                setFormData({
                  name: '',
                  contact: '',
                  email: '',
                  birthDate: '',
                  document: '',
                  paymentStatus: 'paid',
                  status: 'active',
                  address: '',
                  street: '',
                  number: '',
                  complement: '',
                  neighborhood: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  planType: 'Studio',
                  contractedPlan: 'Mensal',
                  joinDate: format(new Date(), 'yyyy-MM-dd'),
                  avatar: undefined,
                  preferredDays: [],
                  partnerMemberId: '',
                  customClassLimit: undefined,
                  customWeeklyLimit: undefined
                });
                setFormClasses([]);
                setFormTurmas([]);
                setFormSubModalities([]);
                setFormNovasModalidades([]);
                setErrors({});
              }}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-xs sm:text-sm font-bold text-on-surface-variant hover:text-white transition-colors"
            >
              {editingStudentId ? 'Cancelar Edição' : 'Limpar'}
            </button>
            <button 
              onClick={handleSave}
              className="bg-primary px-6 sm:px-10 py-3 sm:py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,107,0,0.2)] hover:scale-105 transition-transform kinetic-glow"
            >
              {editingStudentId ? 'Salvar Alterações' : 'Salvar Cadastro'}
            </button>
          </div>
        </div>

        {/* List with Filters */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Lista de Alunos</h3>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  {filteredStudents.length} {filteredStudents.length === 1 ? 'aluno' : 'alunos'}
                </span>
              </div>
              {(searchTerm || modalityFilters.length > 0 || turmaFilter !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all' || startDate || endDate || activityStartDate || activityEndDate) && (
                <button 
                  onClick={clearFilters}
                  className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <XCircle size={12} />
                  Limpar Filtros
                </button>
              )}
            </div>
            
            {/* Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input 
                  type="text" 
                  placeholder="Buscar (ex: nome:Ana, pagamento:pago, atividade_desde:2024-01-01)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white"
                  >
                    <XCircle size={14} />
                  </button>
                )}
              </div>

              {/* Multi-modality Filter */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Modalidades</p>
                <div className="flex flex-wrap gap-2">
                  {modalities.map(modality => (
                    <button
                      key={modality}
                      onClick={() => toggleModality(modality)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                        modalityFilters.includes(modality)
                          ? getModalityColor(modality)
                          : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/50"
                      )}
                    >
                      {modality}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turma Filter */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Turmas</p>
                <div className="relative">
                  <select
                    value={turmaFilter}
                    onChange={(e) => setTurmaFilter(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl pl-4 pr-10 py-2.5 text-[10px] font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none text-on-surface-variant cursor-pointer"
                  >
                    <option value="all">Todas as Turmas</option>
                    {turmas.map(turma => (
                      <option key={turma} value={turma}>{turma}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Data de Adesão</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl pl-9 pr-2 py-2 text-[10px] focus:ring-2 focus:ring-primary outline-none transition-all text-on-surface-variant"
                    />
                  </div>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl pl-9 pr-2 py-2 text-[10px] focus:ring-2 focus:ring-primary outline-none transition-all text-on-surface-variant"
                    />
                  </div>
                </div>
              </div>

              {/* Last Activity Date Range Filter */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Última Atividade (Chat)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="date" 
                      value={activityStartDate}
                      onChange={(e) => setActivityStartDate(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl pl-9 pr-2 py-2 text-[10px] focus:ring-2 focus:ring-primary outline-none transition-all text-on-surface-variant"
                    />
                  </div>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="date" 
                      value={activityEndDate}
                      onChange={(e) => setActivityEndDate(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl pl-9 pr-2 py-2 text-[10px] focus:ring-2 focus:ring-primary outline-none transition-all text-on-surface-variant"
                    />
                  </div>
                </div>
              </div>
              
              {/* Status and Payment Filters */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Status do Aluno</p>
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'active', label: 'Ativos' },
                      { id: 'inactive', label: 'Inativos' }
                    ].map((status) => (
                      <button
                        key={status.id}
                        onClick={() => setStatusFilter(status.id)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                          statusFilter === status.id
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/50"
                        )}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Status de Pagamento</p>
                  <div className="relative">
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl pl-4 pr-10 py-2.5 text-[10px] font-bold focus:ring-2 focus:ring-primary outline-none transition-all appearance-none text-on-surface-variant cursor-pointer"
                    >
                      <option value="all">Todos</option>
                      <option value="paid">Pago</option>
                      <option value="pending">Pendente</option>
                      <option value="overdue">Atrasado</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map(student => (
                  <motion.div 
                    key={student.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => onSelectStudent(student.id)}
                    className={cn(
                      "bg-surface-container p-5 rounded-2xl border flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer group hover:translate-x-2",
                      student.paymentStatus === 'overdue' ? "border-red-500/30 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.05)]" : "border-outline"
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary font-bold border border-outline relative overflow-hidden">
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        student.name.charAt(0)
                      )}
                      <span className={cn(
                        "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-surface-container",
                        student.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold truncate">{student.name}</p>
                        <span className={cn(
                          "text-[7px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border",
                          student.planType === 'Studio' ? "bg-primary/10 text-primary border-primary/20" : "bg-surface-container-high text-on-surface-variant border-outline"
                        )}>
                          {student.planType === 'Studio' ? 'Studio' : student.planType}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap gap-1">
                          {student.classes.map(modality => (
                            <span key={modality} className={cn("text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider flex items-center gap-1", getModalityColor(modality))}>
                              <span className="w-1 h-1 rounded-full bg-current" />
                              {modality}
                            </span>
                          ))}
                          {student.novasModalidades?.map(modality => (
                            <span key={modality} className={cn("text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider flex items-center gap-1", getModalityColor(modality))}>
                              <span className="w-1 h-1 rounded-full bg-current" />
                              {modality}
                            </span>
                          ))}
                          <div className="flex items-center gap-1 text-[8px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-high px-2 py-0.5 rounded-full border border-outline">
                            <Plus size={10} className="text-primary" />
                            Adesão: {format(new Date(student.joinDate + 'T12:00:00'), 'dd/MM/yy')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-wrap gap-1">
                            {student.turmas.map(turma => (
                              <span key={turma} className={cn("text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider flex items-center gap-1", getTurmaColor(turma))}>
                                <span className="w-1 h-1 rounded-full bg-current" />
                                {turma}
                              </span>
                            ))}
                          </div>
                          {student.messages.length > 0 && (
                            <div className="flex items-center gap-1 text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">
                              <MessageSquare size={10} className="text-primary" />
                              Ativo: {format(new Date(student.messages[student.messages.length - 1].timestamp), 'dd/MM/yy')} - {format(new Date(student.messages[0].timestamp), 'dd/MM/yy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.paymentStatus === 'overdue' && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <AlertCircle size={14} className="text-red-500" />
                        </motion.div>
                      )}
                      {student.paymentStatus === 'pending' && (
                        <Clock size={14} className="text-amber-500" />
                      )}
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        student.paymentStatus === 'paid' ? "bg-emerald-500" : student.paymentStatus === 'pending' ? "bg-amber-500" : "bg-red-500"
                      )} />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCardStudent(student);
                          setIsCardModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-white transition-all"
                        title="Carteirinha Digital & QR Code"
                      >
                        <QrCode size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(student.id);
                        }}
                        className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-white transition-all"
                        title="Enviar Mensagem"
                      >
                        <MessageSquare size={18} />
                      </button>
                      
                      {['Gerente', 'Recepcionista'].includes(currentUser?.role || '') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(student);
                          }}
                          className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-white transition-all"
                          title="Editar Aluno"
                        >
                          <Edit size={18} />
                        </button>
                      )}

                      {currentUser?.role === 'Gerente' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSaveToGallery(student);
                            }}
                            className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-lg active:scale-90"
                            title="Salvar à Galeria"
                          >
                            <Layout size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPaymentModal(student.id);
                            }}
                            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                            title="Enviar link de pagamento"
                          >
                            <CreditCard size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmationId(student.id);
                            }}
                            className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            title="Excluir Aluno"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-10 text-center space-y-3">
                  <Search size={40} className="mx-auto text-on-surface-variant opacity-20" />
                  <p className="text-sm text-on-surface-variant">Nenhum aluno encontrado com esses filtros.</p>
                  <button 
                    onClick={clearFilters}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {deleteConfirmationId && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDeleteConfirmationId(null)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-sm bg-surface-container p-8 rounded-[32px] border border-outline shadow-2xl space-y-8 kinetic-glow text-center"
                >
                  <div className="mx-auto w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                    <Trash2 size={40} className="animate-pulse" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl font-headline font-black uppercase tracking-tight text-on-surface">Confirmação de Exclusão</h3>
                    <p className="text-sm text-on-surface-variant font-medium">
                      Você está prestes a excluir o aluno <span className="text-red-400 font-bold">"{students.find(s => s.id === deleteConfirmationId)?.name}"</span>. 
                      <br /><br />
                      Esta ação é <span className="text-on-surface uppercase font-black">permanente</span> e todos os registros de presença e pagamentos associados serão removidos.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button 
                      onClick={async () => {
                        if (deleteConfirmationId) {
                          setIsDeleting(true);
                          await onDeleteStudent(deleteConfirmationId);
                          setDeleteConfirmationId(null);
                          setIsDeleting(false);
                        }
                      }}
                      disabled={isDeleting}
                      className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        "Confirmar Exclusão"
                      )}
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmationId(null)}
                      disabled={isDeleting}
                      className="w-full py-4 rounded-2xl font-bold text-on-surface-variant hover:bg-white/5 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-outline/50">
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Página <span className="text-primary">{currentPage}</span> de <span className="text-primary">{totalPages}</span>
                <span className="ml-2 opacity-50">({filteredStudents.length} alunos)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant transition-all"
                >
                  <ChevronLeft size={14} />
                  Anterior
                </button>
                
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first, last, and pages around current
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-[10px] font-bold transition-all",
                            currentPage === page 
                              ? "bg-primary text-white shadow-lg" 
                              : "text-on-surface-variant hover:bg-surface-container-high"
                          )}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      (page === currentPage - 2 && page > 1) || 
                      (page === currentPage + 2 && page < totalPages)
                    ) {
                      return <span key={page} className="text-on-surface-variant px-1 text-[10px]">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant transition-all"
                >
                  Próximo
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={clearFilters}
            className="w-full py-4 rounded-2xl border border-dashed border-outline text-xs font-bold text-on-surface-variant hover:border-primary/20 hover:text-white transition-all"
          >
            Ver Todos os Alunos
          </button>
        </div>
      </div>
      ) : (
        <div className="bg-surface-container p-10 rounded-3xl border border-outline space-y-8 kinetic-glow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Modalidade / Aula</label>
              <select 
                value={attendanceClass}
                onChange={(e) => setAttendanceClass(e.target.value)}
                className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="">Selecione a aula...</option>
                {modalities.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Instrutor</label>
              <input 
                type="text"
                placeholder="Nome do instrutor"
                value={attendanceInstructor}
                onChange={(e) => setAttendanceInstructor(e.target.value)}
                className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Data da Chamada</label>
              <input 
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleSaveAttendance}
              className="bg-primary px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
            >
              Salvar Chamada
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Buscar por aluno ou instrutor..."
              value={attendanceSearchTerm}
              onChange={(e) => setAttendanceSearchTerm(e.target.value)}
              className="w-full bg-surface-container-low border border-outline rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            {attendanceSearchTerm && (
              <button 
                onClick={() => setAttendanceSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Alunos da Turma</h3>
              {attendanceClass && (
                <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl border border-outline">
                  <button 
                    onClick={() => setAttendanceListFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      attendanceListFilter === 'all' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setAttendanceListFilter('present')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      attendanceListFilter === 'present' ? "bg-emerald-500 text-white shadow-lg" : "text-on-surface-variant hover:text-emerald-500"
                    )}
                  >
                    Presentes
                  </button>
                  <button 
                    onClick={() => setAttendanceListFilter('absent')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      attendanceListFilter === 'absent' ? "bg-red-500 text-white shadow-lg" : "text-on-surface-variant hover:text-red-500"
                    )}
                  >
                    Ausentes
                  </button>
                </div>
              )}
            </div>
            {!attendanceClass ? (
              <div className="py-20 text-center border border-dashed border-outline rounded-3xl opacity-30">
                <Users size={48} className="mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Selecione uma modalidade para iniciar a chamada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(() => {
                  const filtered = students
                    .filter(s => s.classes.includes(attendanceClass))
                    .filter(s => {
                      const searchLower = attendanceSearchTerm.toLowerCase();
                      const matchesSearch = !attendanceSearchTerm || 
                        s.name.toLowerCase().includes(searchLower);
                      
                      if (!matchesSearch) return false;

                      if (attendanceListFilter === 'all') return true;
                      const isPresent = attendanceData[s.id] !== false;
                      return attendanceListFilter === 'present' ? isPresent : !isPresent;
                    });

                  if (filtered.length === 0) {
                    return (
                      <div className="col-span-full py-10 text-center border border-dashed border-outline rounded-3xl opacity-30">
                        <Search size={32} className="mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum aluno encontrado para esta busca</p>
                      </div>
                    );
                  }

                  return filtered.map(student => (
                    <div key={student.id} className="bg-surface-container-low p-4 rounded-2xl border border-outline flex items-center justify-between group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold border border-outline">
                          {student.name.charAt(0)}
                        </div>
                        <p className="font-bold text-sm truncate max-w-[120px]">{student.name}</p>
                      </div>
                      <div className="flex bg-surface-container p-1 rounded-xl border border-outline">
                        <button 
                          onClick={() => setAttendanceData(prev => ({ ...prev, [student.id]: true }))}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                            attendanceData[student.id] !== false ? "bg-emerald-500 text-white" : "text-on-surface-variant hover:text-emerald-500"
                          )}
                        >
                          P
                        </button>
                        <button 
                          onClick={() => setAttendanceData(prev => ({ ...prev, [student.id]: false }))}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                            attendanceData[student.id] === false ? "bg-red-500 text-white" : "text-on-surface-variant hover:text-red-500"
                          )}
                        >
                          F
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {attendanceClass && fullClassHistory.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-outline">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Histórico de Chamadas</h3>
                  <p className="text-[10px] text-on-surface-variant/60 font-medium">Registros anteriores para {attendanceClass}</p>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl border border-outline">
                  <button 
                    onClick={() => setAttendanceHistoryFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      attendanceHistoryFilter === 'all' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setAttendanceHistoryFilter('present')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      attendanceHistoryFilter === 'present' ? "bg-emerald-500 text-white shadow-lg" : "text-on-surface-variant hover:text-emerald-500"
                    )}
                  >
                    Presentes
                  </button>
                  <button 
                    onClick={() => setAttendanceHistoryFilter('absent')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      attendanceHistoryFilter === 'absent' ? "bg-red-500 text-white shadow-lg" : "text-on-surface-variant hover:text-red-500"
                    )}
                  >
                    Ausentes
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fullClassHistory.length > 0 ? (
                  fullClassHistory.map((record, i) => (
                    <div key={i} className="bg-surface-container-low p-4 rounded-2xl border border-outline flex items-center justify-between group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          record.present ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {record.present ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{record.studentName}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                              {format(new Date(record.date + 'T12:00:00'), "dd/MM/yyyy")}
                            </p>
                            <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">• {record.instructor}</span>
                          </div>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg",
                        record.present ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {record.present ? 'Presente' : 'Ausente'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-10 text-center border border-dashed border-outline rounded-3xl opacity-30">
                    <Search size={32} className="mx-auto mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum registro encontrado para esta busca</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
          {/* Student Digital Card Modal */}
      <StudentDigitalCardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setSelectedCardStudent(null);
        }}
        student={selectedCardStudent}
        studioName="STYLO URBANO"
      />
    </motion.div>
  );
}

function AgendaScreen({ 
  events, 
  setEvents, 
  students,
  currentUser,
  turmas,
  onAddNotification,
  isGoogleConnected,
  setIsGoogleConnected,
  handleConnectGoogle,
  handleSyncCalendar,
  isSyncing,
  studioName = "STYLO URBANO",
  studioLogo = null
}: { 
  events: ClassEvent[], 
  setEvents: React.Dispatch<React.SetStateAction<ClassEvent[]>>,
  students: Student[],
  currentUser: User | null,
  turmas: string[],
  onAddNotification: (title: string, text: string) => void,
  isGoogleConnected: boolean,
  setIsGoogleConnected: React.Dispatch<React.SetStateAction<boolean>>,
  handleConnectGoogle: () => Promise<void>,
  handleSyncCalendar: () => Promise<void>,
  isSyncing: boolean,
  studioName?: string,
  studioLogo?: string | null
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [instructorFilter, setInstructorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newClassData, setNewClassData] = useState({
    title: '',
    instructor: '',
    instructorEmail: '',
    time: '18:00',
    date: format(new Date(), 'yyyy-MM-dd'),
    capacity: 20,
    category: '',
    type: 'Aula' as ClassEvent['type'],
    status: 'Confirmado' as ClassEvent['status'],
    turma: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');

  const monthEvents = useMemo(() => {
    return events.filter(e => {
      const isSameMonthCheck = isSameMonth(new Date(e.date), currentMonth);
      const matchesInstructor = e.instructor.toLowerCase().includes(instructorFilter.toLowerCase());
      const matchesType = typeFilter === 'all' || e.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return isSameMonthCheck && matchesInstructor && matchesType && matchesStatus;
    }).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.time.localeCompare(b.time);
    });
  }, [events, currentMonth, instructorFilter, typeFilter, statusFilter]);

  const monthStats = useMemo(() => {
    const total = monthEvents.length;
    const classes = monthEvents.filter(e => e.type === 'Aula').length;
    const workshops = monthEvents.filter(e => e.type === 'Evento').length;
    const capacity = monthEvents.reduce((acc, e) => acc + e.capacity, 0);
    const enrolled = monthEvents.reduce((acc, e) => acc + e.enrolled, 0);
    return { total, classes, workshops, capacity, enrolled, occupancy: total > 0 ? (enrolled / capacity) * 100 : 0 };
  }, [monthEvents]);

  const validateField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'title':
        if (!value.trim()) error = 'Obrigatório';
        else if (value.trim().length < 3) error = 'Mínimo 3 caracteres';
        break;
      case 'instructor':
        if (!value.trim()) error = 'Obrigatório';
        break;
      case 'instructorEmail':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!value.trim()) error = 'Obrigatório';
        else if (!emailRegex.test(value)) error = 'E-mail inválido';
        break;
      case 'time':
        if (!value) error = 'Obrigatório';
        break;
      case 'date':
        if (!value) error = 'Obrigatório';
        break;
      case 'capacity':
        if (value <= 0) error = 'Mínimo 1';
        break;
      case 'category':
        if (!value) error = 'Obrigatório';
        break;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      return newErrors;
    });
    return !error;
  };

  const validateForm = () => {
    const fields = ['title', 'instructor', 'instructorEmail', 'time', 'date', 'capacity', 'category'];
    let isValid = true;
    fields.forEach(field => {
      if (!validateField(field, (newClassData as any)[field])) isValid = false;
    });

    if (isValid) {
      // Overlap validation
      const eventDate = new Date(newClassData.date + 'T00:00:00');
      const [hours, minutes] = newClassData.time.split(':').map(Number);
      const startTime = hours * 60 + minutes;
      const endTime = startTime + 60; // Assume 1 hour duration

      const overlappingEvent = events.find(e => {
        if (editingEventId && e.id === editingEventId) return false;
        
        const eDate = new Date(e.date);
        if (format(eDate, 'yyyy-MM-dd') !== newClassData.date) return false;

        const [eHours, eMinutes] = e.time.split(':').map(Number);
        const eStartTime = eHours * 60 + eMinutes;
        const eEndTime = eStartTime + 60;

        // Check for overlap
        const hasTimeOverlap = (startTime < eEndTime && endTime > eStartTime);
        
        if (hasTimeOverlap) {
          // Check if same instructor or same turma
          const sameInstructor = e.instructorEmail === newClassData.instructorEmail;
          const sameTurma = newClassData.turma && e.turma === newClassData.turma;
          
          return sameInstructor || sameTurma;
        }
        
        return false;
      });

      if (overlappingEvent) {
        const conflictType = overlappingEvent.instructorEmail === newClassData.instructorEmail ? 'o instrutor' : 'a turma';
        toast.error('Conflito de Horário', {
          description: `Já existe um agendamento para ${conflictType} neste horário (${overlappingEvent.time}).`
        });
        isValid = false;
      }
    }

    return isValid;
  };

  const handleInputChange = (field: string, value: any) => {
    setNewClassData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handleSaveClass = async () => {
    if (!validateForm()) {
      toast.error('Erro no agendamento', {
        description: 'Por favor, corrija os campos destacados.'
      });
      return;
    }

    try {
      const eventData = {
        title: newClassData.title,
        instructor: newClassData.instructor,
        instructorEmail: newClassData.instructorEmail,
        time: newClassData.time,
        date: new Date(newClassData.date + 'T12:00:00'),
        capacity: Number(newClassData.capacity),
        category: newClassData.category,
        type: newClassData.type,
        status: newClassData.status,
        turma: newClassData.turma,
        enrolled: editingEventId ? (events.find(e => e.id === editingEventId)?.enrolled || 0) : 0
      };

      if (editingEventId) {
        await updateDoc(doc(db, 'events', editingEventId), eventData);
        onAddNotification(newClassData.type === 'Aula' ? 'Aula Atualizada' : 'Evento Atualizado', `O item "${newClassData.title}" foi atualizado.`);
        toast.success(newClassData.type === 'Aula' ? 'Aula atualizada!' : 'Evento atualizado!');
        
        // Auto-sync if connected
        if (isGoogleConnected && currentUser?.email) {
          fetch('/api/calendar/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: currentUser.email,
              events: [{ ...eventData, id: editingEventId, googleEventId: events.find(e => e.id === editingEventId)?.googleEventId }]
            })
          }).then(async (res) => {
            if (res.ok) {
              const result = await res.json();
              if (result.results?.[0]?.googleEventId) {
                await updateDoc(doc(db, 'events', editingEventId), { googleEventId: result.results[0].googleEventId });
              }
            }
          }).catch(err => console.error("Auto-sync error:", err));
        }
      } else {
        const docRef = await addDoc(collection(db, 'events'), eventData);
        onAddNotification(newClassData.type === 'Aula' ? 'Nova Aula Agendada' : 'Novo Evento Criado', `O item "${newClassData.title}" foi agendada para ${format(eventData.date, 'dd/MM')} às ${newClassData.time}.`);
        toast.success(newClassData.type === 'Aula' ? 'Nova aula agendada!' : 'Novo evento criado!', {
          description: `${newClassData.title} agendada para ${format(eventData.date, 'dd/MM')} às ${newClassData.time}.`,
          icon: <CheckCircle2 className="text-emerald-500" size={18} />
        });

        // Auto-sync if connected
        if (isGoogleConnected && currentUser?.email) {
          fetch('/api/calendar/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: currentUser.email,
              events: [{ ...eventData, id: docRef.id }]
            })
          }).then(async (res) => {
            if (res.ok) {
              const result = await res.json();
              if (result.results?.[0]?.googleEventId) {
                await updateDoc(doc(db, 'events', docRef.id), { googleEventId: result.results[0].googleEventId });
              }
            }
          }).catch(err => console.error("Auto-sync error:", err));
        }
      }

      setIsModalOpen(false);
      setEditingEventId(null);
      setErrors({});
      setNewClassData({
        title: '',
        instructor: '',
        instructorEmail: '',
        time: '18:00',
        date: format(selectedDate, 'yyyy-MM-dd'),
        capacity: 20,
        category: '',
        type: 'Aula',
        status: 'Confirmado',
        turma: ''
      });
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Erro ao salvar agendamento.");
    }
  };

  const handleCancelClass = async (id: string, title: string) => {
    try {
      const eventToDelete = events.find(e => e.id === id);
      await deleteDoc(doc(db, 'events', id));
      onAddNotification('Aula Cancelada', `A aula "${title}" foi removida da agenda.`);
      toast.error('Aula cancelada', {
        description: `A aula "${title}" foi removida da agenda.`,
        icon: <XCircle className="text-red-500" size={18} />
      });

      // Auto-delete from Google Calendar if connected
      if (isGoogleConnected && currentUser?.email && eventToDelete?.googleEventId) {
        fetch('/api/calendar/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            googleEventId: eventToDelete.googleEventId
          })
        }).catch(err => console.error("Auto-delete error:", err));
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Erro ao cancelar agendamento.");
    }
  };

  const selectedDayEvents = useMemo(() => {
    return events.filter(e => {
      const isSameDayCheck = isSameDay(e.date, selectedDate);
      const matchesInstructor = e.instructor.toLowerCase().includes(instructorFilter.toLowerCase());
      const matchesType = typeFilter === 'all' || e.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return isSameDayCheck && matchesInstructor && matchesType && matchesStatus;
    });
  }, [events, selectedDate, instructorFilter, typeFilter, statusFilter]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setNewClassData(prev => ({ 
      ...prev, 
      date: format(day, 'yyyy-MM-dd'),
      type: 'Aula',
      status: 'Confirmado'
    }));

    // Scroll to details section
    const detailsElement = document.getElementById('day-details');
    if (detailsElement) {
      detailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-10"
    >
      {/* Printable Document Header (Only visible when printing) */}
      <div className="print-only print-doc-header print-header-block mb-4">
        <div className="flex items-center gap-4">
          {studioLogo ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-300">
              <img src={studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center font-black text-2xl">
              {studioName.charAt(0) || 'S'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-gray-900 leading-tight">
              {studioName}
            </h1>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Agenda e Cronograma de Aulas • {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </p>
            <p className="text-[9pt] text-gray-500">
              Filtros: {instructorFilter ? `Instrutor: ${instructorFilter}` : 'Todos os Instrutores'} • {typeFilter !== 'all' ? `Tipo: ${typeFilter}` : 'Todos os Tipos'} • {statusFilter !== 'all' ? `Status: ${statusFilter}` : 'Todos os Status'}
            </p>
          </div>
        </div>
        <div className="text-right text-[8.5pt] text-gray-600">
          <p><strong>Emissão:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p><strong>Emitido por:</strong> {currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Administração'}</p>
          <p><strong>Total Programado:</strong> {monthEvents.length} atividades</p>
        </div>
      </div>

      {/* Printable Metrics Summary */}
      <div className="print-only print-metrics-row print-avoid-break">
        <div className="print-metric-box">
          <p className="text-[8pt] text-gray-500 uppercase font-bold">Total de Atividades</p>
          <p className="text-sm font-black text-gray-900">{monthStats.total}</p>
          <p className="text-[7.5pt] text-gray-400">Aulas e eventos no mês</p>
        </div>
        <div className="print-metric-box">
          <p className="text-[8pt] text-gray-500 uppercase font-bold">Aulas Regulares</p>
          <p className="text-sm font-black text-blue-700">{monthStats.classes}</p>
          <p className="text-[7.5pt] text-gray-400">Grade semanal</p>
        </div>
        <div className="print-metric-box">
          <p className="text-[8pt] text-gray-500 uppercase font-bold">Capacidade de Vagas</p>
          <p className="text-sm font-black text-gray-900">{monthStats.capacity} vagas</p>
          <p className="text-[7.5pt] text-gray-400">Total disponível</p>
        </div>
        <div className="print-metric-box">
          <p className="text-[8pt] text-gray-500 uppercase font-bold">Matrículas / Ocupação</p>
          <p className="text-sm font-black text-emerald-700">{monthStats.enrolled} alunos ({monthStats.occupancy.toFixed(0)}%)</p>
          <p className="text-[7.5pt] text-gray-400">Taxa de preenchimento</p>
        </div>
      </div>

      {/* Printable Schedule Table */}
      <div className="print-only print-avoid-break mt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th style={{ width: '16%' }}>Data & Dia</th>
              <th style={{ width: '10%' }}>Horário</th>
              <th style={{ width: '24%' }}>Atividade / Aula</th>
              <th style={{ width: '20%' }}>Instrutor</th>
              <th style={{ width: '16%' }}>Turma / Categoria</th>
              <th style={{ width: '7%' }} className="text-center">Vagas</th>
              <th style={{ width: '7%' }} className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {monthEvents.map((evt) => {
              const evtDate = evt.date instanceof Date ? evt.date : new Date(evt.date);
              return (
                <tr key={evt.id} className="print-avoid-break">
                  <td>
                    <strong>{format(evtDate, 'dd/MM/yyyy')}</strong>
                    <div className="text-[7.5pt] text-gray-500 uppercase">{format(evtDate, 'EEEE', { locale: ptBR })}</div>
                  </td>
                  <td>
                    <span className="font-bold">{evt.time}</span>
                  </td>
                  <td>
                    <span className="font-bold">{evt.title}</span>
                    <div className="text-[7.5pt] text-gray-500">{evt.type}</div>
                  </td>
                  <td>
                    <span>{evt.instructor}</span>
                  </td>
                  <td>
                    <span>{evt.turma || evt.category || 'Geral'}</span>
                  </td>
                  <td className="text-center">
                    <span className="font-bold">{evt.enrolled || 0}</span> / {evt.capacity}
                  </td>
                  <td className="text-center">
                    <span className={`print-tag ${evt.status === 'Confirmado' ? 'print-tag-paid' : evt.status === 'Pendente' ? 'print-tag-pending' : 'print-tag-class'}`}>
                      {evt.status || 'Confirmado'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {monthEvents.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  Nenhuma atividade cadastrada para este período com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Printable Document Footer */}
      <div className="print-only print-doc-footer print-footer-block">
        <div>
          <p><strong>{studioName}</strong> • Cronograma Oficial de Aulas e Eventos</p>
          <p>Documento de controle e gestão de salas e instrutores.</p>
        </div>
        <div className="text-right">
          <p>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p>Página de Cronograma</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 no-print">
        <div>
          <h2 className="text-3xl sm:text-4xl font-headline font-black tracking-tight mb-2 uppercase italic">Agenda Interativa</h2>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Calendar size={18} className="text-primary" />
            <p className="text-sm sm:text-base font-bold uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-2xl border border-outline shadow-inner">
            <div className="flex flex-col items-center px-4 border-r border-outline/30">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Total</span>
              <span className="text-xl font-headline font-black text-primary">{monthStats.total}</span>
            </div>
            <div className="flex flex-col items-center px-4 border-r border-outline/30">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Aulas</span>
              <span className="text-xl font-headline font-black text-emerald-500">{monthStats.classes}</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Eventos</span>
              <span className="text-xl font-headline font-black text-amber-500">{monthStats.workshops}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 ml-auto">
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-surface-container-high border border-outline hover:border-primary text-on-surface rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg no-print"
              title="Imprimir Agenda ou Salvar como PDF"
            >
              <Printer size={16} className="text-primary" />
              <span>Imprimir Agenda</span>
            </button>

            {['Gerente', 'Recepcionista'].includes(currentUser?.role || '') && (
              <button 
                onClick={() => {
                  setNewClassData(prev => ({ ...prev, type: 'Aula', status: 'Confirmado' }));
                  setIsModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,107,0,0.2)] kinetic-glow"
              >
                <Plus size={16} />
                Novo Registro
              </button>
            )}

          {/* Google Calendar Sync Button */}
          {['Gerente', 'Instrutor'].includes(currentUser?.role || '') && (
            <button 
              onClick={isGoogleConnected ? handleSyncCalendar : handleConnectGoogle}
              disabled={isSyncing}
              className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all shadow-lg",
                isGoogleConnected 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white" 
                  : "bg-surface-container-high text-on-surface-variant border border-outline hover:border-primary/50 hover:text-primary"
              )}
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isGoogleConnected ? (
                <RefreshCw size={16} className={cn(isSyncing && "animate-spin")} />
              ) : (
                <Calendar size={16} />
              )}
              {isGoogleConnected ? 'Sincronizar' : 'Conectar Google'}
            </button>
          )}
        </div>
      </div>
    </div>

      {/* Global Filters & Navigation */}
      <div className="bg-surface-container p-6 rounded-[32px] border border-outline shadow-xl space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-container-low border border-outline rounded-xl p-1">
              <button 
                onClick={() => setViewType('calendar')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewType === 'calendar' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-white/5"
                )}
                title="Calendário"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewType('list')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewType === 'list' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-white/5"
                )}
                title="Lista Mensal"
              >
                <List size={18} />
              </button>
            </div>
            <button 
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              }}
              className="px-4 py-2.5 bg-surface-container-low border border-outline rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
            >
              Hoje
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative group flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Buscar instrutor..."
                value={instructorFilter}
                onChange={(e) => setInstructorFilter(e.target.value)}
                className="w-full sm:w-auto bg-surface-container-low border border-outline rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-primary outline-none transition-all sm:min-w-[180px]"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-10"
                >
                  <option value="all">Tipos</option>
                  <option value="Aula">Aula</option>
                  <option value="Evento">Evento</option>
                  <option value="Feriado">Feriado</option>
                  <option value="Alteração">Alteração</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
              </div>

              <div className="relative flex-1 sm:flex-none">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-primary outline-none transition-all appearance-none pr-10"
                >
                  <option value="all">Status</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Aviso Enviado">Aviso Enviado</option>
                  <option value="Fechado">Fechado</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-outline/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/20" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Aulas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Eventos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Feriados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Alterações</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container p-8 rounded-3xl border border-outline shadow-2xl space-y-8 kinetic-glow"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-headline font-black uppercase tracking-tight">
                  {editingEventId ? `Editar ${newClassData.type}` : `Agendar ${newClassData.type}`}
                </h3>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingEventId(null);
                  }}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <XCircle size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tipo de Registro</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setNewClassData(prev => ({ ...prev, type: 'Aula' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        newClassData.type === 'Aula' 
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                          : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/30"
                      )}
                    >
                      Aula
                    </button>
                    <button 
                      onClick={() => setNewClassData(prev => ({ ...prev, type: 'Evento' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        newClassData.type === 'Evento' 
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                          : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/30"
                      )}
                    >
                      Evento
                    </button>
                    <button 
                      onClick={() => setNewClassData(prev => ({ ...prev, type: 'Feriado' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        newClassData.type === 'Feriado' 
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                          : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/30"
                      )}
                    >
                      Feriado
                    </button>
                    <button 
                      onClick={() => setNewClassData(prev => ({ ...prev, type: 'Alteração' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        newClassData.type === 'Alteração' 
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                          : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/30"
                      )}
                    >
                      Alteração
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setNewClassData(prev => ({ ...prev, status: 'Confirmado' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        newClassData.status === 'Confirmado' 
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                          : "bg-surface-container-low border-outline text-on-surface-variant hover:border-emerald-500/30"
                      )}
                    >
                      Confirmado
                    </button>
                    <button 
                      onClick={() => setNewClassData(prev => ({ ...prev, status: 'Pendente' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        newClassData.status === 'Pendente' 
                          ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" 
                          : "bg-surface-container-low border-outline text-on-surface-variant hover:border-amber-500/30"
                      )}
                    >
                      Pendente
                    </button>
                    <button 
                      onClick={() => setNewClassData(prev => ({ ...prev, status: 'Aviso Enviado' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        newClassData.status === 'Aviso Enviado' 
                          ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20" 
                          : "bg-surface-container-low border-outline text-on-surface-variant hover:border-blue-500/30"
                      )}
                    >
                      Aviso Enviado
                    </button>
                    <button 
                      onClick={() => setNewClassData(prev => ({ ...prev, status: 'Fechado' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        newClassData.status === 'Fechado' 
                          ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" 
                          : "bg-surface-container-low border-outline text-on-surface-variant hover:border-red-500/30"
                      )}
                    >
                      Fechado
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <InputGroup 
                    label={newClassData.type === 'Aula' ? "Título da Aula" : "Título do Registro"}
                    placeholder={newClassData.type === 'Aula' ? "Ex: Danças Urbanas Avançado" : "Ex: Workshop de Hip Hop"} 
                    value={newClassData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    error={errors.title}
                  />
                </div>
                <InputGroup 
                  label={newClassData.type === 'Aula' ? "Instrutor" : "Responsável"} 
                  placeholder={newClassData.type === 'Aula' ? "Nome do instrutor" : "Nome do responsável"} 
                  value={newClassData.instructor}
                  onChange={(e) => handleInputChange('instructor', e.target.value)}
                  error={errors.instructor}
                />
                <InputGroup 
                  label={newClassData.type === 'Aula' ? "E-mail do Instrutor" : "E-mail do Responsável"} 
                  placeholder="responsavel@email.com" 
                  type="email"
                  value={newClassData.instructorEmail}
                  onChange={(e) => handleInputChange('instructorEmail', e.target.value)}
                  error={errors.instructorEmail}
                />
                <InputGroup 
                  label="Horário" 
                  type="time" 
                  placeholder="" 
                  value={newClassData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  error={errors.time}
                />
                <InputGroup 
                  label="Data" 
                  type="date" 
                  placeholder="" 
                  value={newClassData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  error={errors.date}
                />
                <InputGroup 
                  label="Capacidade Máxima" 
                  type="number" 
                  placeholder="Ex: 20" 
                  value={newClassData.capacity.toString()}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                  error={errors.capacity}
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Turma (Opcional)</label>
                  <div className="relative">
                    <select 
                      value={newClassData.turma}
                      onChange={(e) => handleInputChange('turma', e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10"
                    >
                      <option value="">Nenhuma</option>
                      {turmas.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Categoria</label>
                  <div className="relative">
                    <select 
                      value={newClassData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={cn(
                        "w-full bg-surface-container-low border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10",
                        errors.category ? "border-red-500 ring-red-500/20" : "border-outline"
                      )}
                    >
                      <option value="">Selecione uma categoria</option>
                      <option value="Urban">Urban</option>
                      <option value="Classic">Classic</option>
                      <option value="Modern">Modern</option>
                      <option value="Jazz">Jazz</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Showcase">Showcase</option>
                      <option value="Competição">Competição</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                  </div>
                  {errors.category && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-1">{errors.category}</p>}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingEventId(null);
                  }}
                  className="flex-1 py-4 rounded-2xl font-bold text-on-surface-variant hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveClass}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,107,0,0.2)] hover:scale-105 transition-all"
                >
                  {editingEventId ? 'Salvar Alterações' : `Agendar ${newClassData.type}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for quick access */}
      <motion.button 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setNewClassData(prev => ({ ...prev, type: 'Aula', status: 'Confirmado' }));
          setIsModalOpen(true);
        }}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 kinetic-glow group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
        <span className="absolute right-20 bg-surface-container border border-outline px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          Novo Registro
        </span>
      </motion.button>

      <div className="grid grid-cols-1 gap-8">
        {viewType === 'calendar' ? (
          <InteractiveCalendar 
            events={events}
            onDateSelect={handleDayClick}
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            setSelectedDate={setSelectedDate}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {monthEvents.length > 0 ? (
              <div className="bg-surface-container rounded-[40px] border border-outline overflow-hidden shadow-2xl glass-panel">
                <div className="p-8 border-b border-outline/30 flex items-center justify-between">
                  <h3 className="font-headline font-black uppercase tracking-tight text-xl">
                    Lista de Registros - {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </h3>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                    {monthEvents.length} Itens
                  </span>
                </div>
                <div className="divide-y divide-outline/10">
                  {monthEvents.map((event, idx) => {
                    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                    const showDateHeader = idx === 0 || !isSameDay(eventDate, new Date(monthEvents[idx - 1].date));
                    return (
                      <React.Fragment key={event.id}>
                        {showDateHeader && (
                          <div className="bg-surface-container-low/50 px-8 py-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex flex-col items-center justify-center shadow-lg shadow-primary/20">
                              <span className="text-lg font-black leading-none">{format(eventDate, 'dd')}</span>
                              <span className="text-[8px] font-bold uppercase">{format(eventDate, 'EEE', { locale: ptBR })}</span>
                            </div>
                            <div>
                              <h4 className="font-headline font-black uppercase text-sm tracking-tight">
                                {format(eventDate, "dd 'de' MMMM", { locale: ptBR })}
                              </h4>
                              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                {format(eventDate, 'EEEE', { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        )}
                        <div 
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsDetailsModalOpen(true);
                          }}
                          className="px-8 py-6 hover:bg-white/5 transition-colors group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-6">
                            <div className="text-xl font-headline font-black text-primary min-w-[60px]">
                              {event.time}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border",
                                  event.type === 'Aula' ? "bg-primary/10 text-primary border-primary/20" :
                                  event.type === 'Evento' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                  event.type === 'Feriado' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                  "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                )}>
                                  {event.type}
                                </span>
                                <h5 className="font-bold text-base uppercase tracking-tight group-hover:text-primary transition-colors">
                                  {event.title}
                                </h5>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                                  <UserCircle size={14} className="text-primary" />
                                  {event.instructor}
                                </div>
                                {event.turma && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                    {event.turma}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 sm:text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                {event.enrolled} / {event.capacity} Vagas
                              </span>
                              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-outline/30">
                                <div 
                                  className={cn(
                                    "h-full transition-all duration-500",
                                    (event.enrolled / event.capacity) > 0.8 ? "bg-red-500" : "bg-primary"
                                  )}
                                  style={{ width: `${(event.enrolled / event.capacity) * 100}%` }}
                                />
                              </div>
                            </div>
                            <ChevronRight size={20} className="text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container rounded-[40px] border border-outline p-20 text-center space-y-4 glass-panel">
                <Calendar size={64} className="mx-auto text-on-surface-variant opacity-10" />
                <p className="text-xl font-headline font-black uppercase tracking-tight">Nenhum registro para este mês</p>
                <p className="text-sm text-on-surface-variant">Tente mudar os filtros ou navegue para outro mês.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Novo Registro
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div id="day-details" className="pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-headline font-black uppercase tracking-tight">Detalhes do Dia</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                  {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  {selectedDayEvents.length} Eventos
                </span>
              </div>
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedDayEvents.map((event) => (
                  <motion.div 
                    key={event.id}
                    layout
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsDetailsModalOpen(true);
                    }}
                    className="bg-surface-container-high/40 p-6 rounded-[32px] border border-outline hover:border-primary/50 transition-all cursor-pointer group glass-panel flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                       <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          event.type === 'Aula' ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(255,107,0,0.1)]" :
                          event.type === 'Evento' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          event.type === 'Feriado' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {event.type}
                        </span>
                        <div className="text-lg font-headline font-black text-primary group-hover:scale-110 transition-transform">
                          {event.time}
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-1">{event.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        <UserCircle size={14} className="text-primary" />
                        {event.instructor}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-auto border-t border-outline/10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-widest">Ocupação</span>
                        <div className="flex items-center gap-2">
                           <div className="w-16 h-1 bg-surface-container-low rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${(event.enrolled / event.capacity) * 100}%` }}
                              />
                           </div>
                           <span className="text-[10px] font-black text-primary">{Math.round((event.enrolled / event.capacity) * 100)}%</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-on-surface-variant group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-outline rounded-[40px] bg-surface-container-low/30 space-y-4">
                <Calendar size={48} className="mx-auto text-on-surface-variant opacity-10" />
                <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Nenhum registro para este dia selecionado.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline hover:scale-105 transition-all"
                >
                  + Agendar Novo
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isDetailsModalOpen && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-container p-8 rounded-3xl border border-outline shadow-2xl space-y-8 kinetic-glow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-widest border border-primary/20">
                      {selectedEvent.type}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border",
                      selectedEvent.status === 'Confirmado' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      selectedEvent.status === 'Pendente' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      selectedEvent.status === 'Aviso Enviado' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                      {selectedEvent.status}
                    </span>
                  </div>
                  <h3 className="text-2xl font-headline font-black uppercase tracking-tight">{selectedEvent.title}</h3>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
                    {selectedEvent.instructor} ({selectedEvent.instructorEmail}) • {selectedEvent.time} • {format(selectedEvent.date, 'dd/MM/yyyy')}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      <Tag size={12} className="text-primary" />
                      <span>Categoria: {selectedEvent.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      <Users size={12} className="text-primary" />
                      <span>Capacidade: {selectedEvent.capacity} Vagas</span>
                    </div>
                    {selectedEvent.turma && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        <Users size={12} className="text-primary" />
                        <span>Turma: {selectedEvent.turma}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <XCircle size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-widest">Alunos Matriculados</h4>
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">
                    {students.filter(s => s.classes.includes(selectedEvent.title)).length} Alunos
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {students.filter(s => s.classes.includes(selectedEvent.title)).length > 0 ? (
                    students.filter(s => s.classes.includes(selectedEvent.title)).map(student => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-surface-container-low border border-outline rounded-2xl hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <img 
                            src={`https://i.pravatar.cc/150?u=${student.id}`} 
                            alt={student.name}
                            className="w-10 h-10 rounded-full border border-outline"
                          />
                          <div>
                            <p className="text-sm font-bold">{student.name}</p>
                            <p className="text-[10px] text-on-surface-variant">{student.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5",
                            student.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-500" :
                            student.paymentStatus === 'pending' ? "bg-amber-500/10 text-amber-500" :
                            "bg-red-500/10 text-red-500"
                          )}>
                            {student.paymentStatus === 'pending' && <Clock size={10} />}
                            {student.paymentStatus === 'overdue' && <AlertCircle size={10} />}
                            {student.paymentStatus === 'paid' ? 'Pago' : student.paymentStatus === 'pending' ? 'Pendente' : 'Atrasado'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center border border-dashed border-outline rounded-2xl">
                      <p className="text-xs text-on-surface-variant">Nenhum aluno matriculado nesta aula.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,107,0,0.2)] hover:scale-105 transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StudentChat({ student, currentUser }: { student: Student, currentUser: User }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'students', student.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `students/${student.id}/messages`);
    });

    return () => unsubscribe();
  }, [student.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: newMessage,
      type: 'text',
      timestamp: new Date().toISOString(),
      read: false
    };

    try {
      await addDoc(collection(db, 'students', student.id, 'messages'), msg);
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `students/${student.id}/messages`);
    }
  };

  return (
    <div className="bg-surface-container rounded-3xl border border-outline flex flex-col h-[500px] overflow-hidden kinetic-glow">
      <div className="p-6 border-b border-outline bg-surface-container-high flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest">Chat Direto</h3>
            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Conversa com {student.name}</p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white/2"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <MessageSquare size={48} />
            <p className="text-xs font-bold uppercase tracking-widest">Nenhuma mensagem ainda.<br/>Inicie a conversa!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%]",
                msg.senderId === currentUser.id ? "ml-auto items-end" : "items-start"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                  {msg.senderName} • {format(new Date(msg.timestamp), 'HH:mm')}
                </span>
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm shadow-sm",
                msg.senderId === currentUser.id 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-surface-container-high text-on-surface rounded-tl-none border border-outline"
              )}>
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-surface-container-high border-t border-outline">
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MyProfileScreen({ user, onUpdateUser, onLogout }: { user: User | null, onUpdateUser: (u: User) => void, onLogout: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User | null>(user);
  const [isSaving, setIsSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  if (!user || !formData) return null;

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: formData.name,
        photoURL: formData.avatar
      });

      // If email changed
      if (formData.email !== user.email) {
        try {
          await updateEmail(auth.currentUser, formData.email);
        } catch (err: any) {
          if (err.code === 'auth/requires-recent-login') {
            toast.error('Para alterar o e-mail, você precisa ter feito login recentemente. Por favor, saia e entre novamente.');
          } else {
            toast.error('Erro ao atualizar e-mail no sistema de autenticação.');
          }
        }
      }

      await updateDoc(doc(db, 'users', user.id), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        avatar: formData.avatar || undefined,
        specialties: formData.specialties || [],
        schedules: formData.schedules || [],
        notifications: formData.notifications
      });
      onUpdateUser(formData);
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsChangingPassword(true);
    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await updatePassword(firebaseUser, newPassword);
      }
      
      // Always update Firestore password field for fallback login support
      await updateDoc(doc(db, 'users', user.id), {
        password: newPassword,
        mustChangePassword: false
      });

      toast.success('Senha atualizada com sucesso!');
      onUpdateUser({ ...user, password: newPassword, mustChangePassword: false });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Para sua segurança, faça login novamente antes de alterar a senha.');
      } else {
        toast.error('Erro ao atualizar senha');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => prev ? { ...prev, avatar: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSpecialty = (specialty: string) => {
    if (!specialty.trim()) return;
    const current = formData.specialties || [];
    if (!current.includes(specialty)) {
      setFormData({ ...formData, specialties: [...current, specialty] });
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData({ ...formData, specialties: (formData.specialties || []).filter(s => s !== specialty) });
  };

  const handleAddSchedule = () => {
    const current = formData.schedules || [];
    setFormData({ ...formData, schedules: [...current, { day: 'Segunda', start: '08:00', end: '09:00' }] });
  };

  const handleUpdateSchedule = (index: number, field: string, value: string) => {
    const current = [...(formData.schedules || [])];
    current[index] = { ...current[index], [field]: value };
    setFormData({ ...formData, schedules: current });
  };

  const handleRemoveSchedule = (index: number) => {
    setFormData({ ...formData, schedules: (formData.schedules || []).filter((_, i) => i !== index) });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-10 pb-20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] overflow-hidden border-4 border-primary shadow-2xl kinetic-glow">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                alt={user.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tighter uppercase">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                {user.role}
              </span>
              <span className="text-on-surface-variant text-xs">{user.email}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onLogout}
            className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <XCircle size={14} />
            Sair
          </button>
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg kinetic-glow hover:scale-105 transition-all flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                Salvar Alterações
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-surface-container-high text-on-surface px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline hover:border-primary/50 transition-all flex items-center gap-2"
            >
              <Edit size={16} />
              Editar Perfil
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <UserCircle size={20} />
              </div>
              <h3 className="text-lg font-headline font-black uppercase">Informações Básicas</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Nome Completo</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">E-mail</label>
                <input 
                  type="email" 
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50"
                />
              </div>
              <div className="sm:col-span-2 space-y-4">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Foto de Perfil</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-outline flex items-center justify-center overflow-hidden bg-surface-container-low relative group">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={32} className="text-on-surface-variant/30" />
                    )}
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex-1 space-y-3">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden" 
                        id="profile-photo-upload"
                      />
                      <div className="flex gap-2">
                        <label 
                          htmlFor="profile-photo-upload"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-lg shadow-primary/20"
                        >
                          <Upload size={16} />
                          Carregar Foto
                        </label>
                        {formData.avatar && (
                          <button 
                            onClick={() => setFormData({ ...formData, avatar: undefined })}
                            className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                            title="Remover Foto"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">JPG, PNG ou GIF. Recomendado 1:1.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                <Star size={20} />
              </div>
              <h3 className="text-lg font-headline font-black uppercase">Especialidades</h3>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {(formData.specialties || []).map(spec => (
                  <div key={spec} className="flex items-center gap-2 bg-purple-500/10 text-purple-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-purple-500/20">
                    {spec}
                    {isEditing && (
                      <button onClick={() => handleRemoveSpecialty(spec)} className="hover:text-red-500 transition-colors">
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Adicionar especialidade..."
                    className="flex-1 bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSpecialty((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-headline font-black uppercase">Segurança</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Nova Senha</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Confirmar Senha</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword}
                className="w-full py-4 rounded-2xl bg-surface-container-high border border-outline text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50"
              >
                {isChangingPassword ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Schedules */}
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <h3 className="text-lg font-headline font-black uppercase">Horários</h3>
              </div>
              {isEditing && (
                <button 
                  onClick={handleAddSchedule}
                  className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
                >
                  <Plus size={20} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {(formData.schedules || []).length > 0 ? (
                (formData.schedules || []).map((sched, idx) => (
                  <div key={idx} className="p-4 bg-surface-container-low border border-outline rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      {isEditing ? (
                        <select 
                          value={sched.day}
                          onChange={(e) => handleUpdateSchedule(idx, 'day', e.target.value)}
                          className="bg-transparent text-xs font-bold uppercase tracking-widest outline-none text-primary"
                        >
                          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">{sched.day}</span>
                      )}
                      {isEditing && (
                        <button onClick={() => handleRemoveSchedule(idx)} className="text-on-surface-variant hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <input 
                            type="time" 
                            value={sched.start}
                            onChange={(e) => handleUpdateSchedule(idx, 'start', e.target.value)}
                            className="bg-transparent text-sm font-bold outline-none"
                          />
                          <span className="text-on-surface-variant text-xs">até</span>
                          <input 
                            type="time" 
                            value={sched.end}
                            onChange={(e) => handleUpdateSchedule(idx, 'end', e.target.value)}
                            className="bg-transparent text-sm font-bold outline-none"
                          />
                        </>
                      ) : (
                        <p className="text-sm font-bold">{sched.start} — {sched.end}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-on-surface-variant text-center py-4 uppercase tracking-widest">Nenhum horário definido</p>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 text-sky-500 rounded-xl flex items-center justify-center">
                <Bell size={20} />
              </div>
              <h3 className="text-lg font-headline font-black uppercase">Notificações</h3>
            </div>

            <div className="space-y-4">
              <PreferenceToggle 
                label="E-mail" 
                description="Alertas de sistema"
                active={formData.notifications?.email || false}
                onToggle={() => setFormData({ 
                  ...formData, 
                  notifications: { ...formData.notifications!, email: !formData.notifications?.email } 
                })}
              />
              <PreferenceToggle 
                label="Push" 
                description="Alertas em tempo real"
                active={formData.notifications?.push || false}
                onToggle={() => setFormData({ 
                  ...formData, 
                  notifications: { ...formData.notifications!, push: !formData.notifications?.push } 
                })}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileScreen({ 
  student, 
  onUpdateStudent, 
  currentUser, 
  modalities,
  turmas,
  onOpenPaymentModal,
  onOpenQR 
}: { 
  student: Student | null, 
  onUpdateStudent: (s: Student) => void, 
  currentUser: User, 
  modalities: string[],
  turmas: string[],
  onOpenPaymentModal: (studentId: string) => void,
  onOpenQR: (data: { url: string; title: string; amount: number }) => void 
}) {
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceInstructor, setAttendanceInstructor] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Performance State
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showSubModalitiesDropdown, setShowSubModalitiesDropdown] = useState(false);
  const [perfDate, setPerfDate] = useState(new Date().toISOString().split('T')[0]);
  const [perfModality, setPerfModality] = useState('');
  const [perfSubModalities, setPerfSubModalities] = useState<string[]>([]);
  const [perfScore, setPerfScore] = useState(50);
  const [perfSubSearch, setPerfSubSearch] = useState('');

  // Payment History State
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isPaymentDetailsModalOpen, setIsPaymentDetailsModalOpen] = useState(false);
  
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'attendance' | 'performance' | 'payments' | 'notes'>('overview');

  // Chat State
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [remoteTypingRole, setRemoteTypingRole] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const studentRef = useRef<Student | null>(student);

  useEffect(() => {
    studentRef.current = student;
  }, [student]);

  useEffect(() => {
    if (!student) return;

    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('join_room', student.id);

    newSocket.on('receive_message', (message: Message) => {
      if (studentRef.current) {
        onUpdateStudent({
          ...studentRef.current,
          messages: [...studentRef.current.messages, message]
        });
      }
    });

    newSocket.on('display_typing', (data: { sender: string, isTyping: boolean }) => {
      if (data.sender !== currentUser.role) {
        setRemoteTyping(data.isTyping);
        setRemoteTypingRole(data.sender);
      }
    });

    newSocket.on('message_read', (data: { messageId: string }) => {
      if (studentRef.current) {
        onUpdateStudent({
          ...studentRef.current,
          messages: studentRef.current.messages.map(m => m.id === data.messageId ? { ...m, read: true } : m)
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [student?.id]);

  // Intersection Observer for Read Receipts
  useEffect(() => {
    if (!socket || !student || !scrollRef.current) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id');
          const isUnread = entry.target.getAttribute('data-unread') === 'true';
          const senderId = entry.target.getAttribute('data-sender');

          if (messageId && isUnread && senderId !== currentUser.id) {
            // Mark as read in Firestore
            try {
              const msgRef = doc(db, 'students', student.id, 'messages', messageId);
              await updateDoc(msgRef, { read: true });
              
              // Emit socket event
              socket.emit('mark_read', { studentId: student.id, messageId });

              // Update local state
              onUpdateStudent({
                ...student,
                messages: student.messages.map(m => m.id === messageId ? { ...m, read: true } : m)
              });
            } catch (error) {
              console.error('Error marking message as read:', error);
            }
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: scrollRef.current,
      threshold: 0.5
    });

    const messageElements = scrollRef.current.querySelectorAll('[data-unread="true"]');
    messageElements.forEach(el => {
      const senderId = el.getAttribute('data-sender');
      if (senderId !== currentUser.id) {
        observerRef.current?.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [student?.messages, socket, student?.id, currentUser.id]);

  const handleSendMessage = async (textOverride?: string, type: 'text' | 'payment' = 'text', paymentLink?: string) => {
    const finalMsg = textOverride || messageText;
    if (!finalMsg.trim() || !student) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: finalMsg,
      type,
      paymentLink,
      timestamp: new Date().toISOString(),
      read: false
    };

    try {
      await addDoc(collection(db, 'students', student.id, 'messages'), newMessage);
      
      onUpdateStudent({
        ...student,
        messages: [...student.messages, newMessage]
      });

      if (socket) {
        socket.emit('send_message', { studentId: student.id, message: newMessage });
      }

      if (type === 'text') setMessageText('');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setIsTyping(false);
      if (socket) socket.emit('typing', { studentId: student.id, sender: currentUser.role, isTyping: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `students/${student.id}/messages`);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (socket && student) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { studentId: student.id, sender: currentUser.role, isTyping: true });
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', { studentId: student.id, sender: currentUser.role, isTyping: false });
        typingTimeoutRef.current = null;
      }, 3000);
    }
  };
  
  // Feedback Form State
  const [feedbackYear, setFeedbackYear] = useState(new Date().getFullYear());
  const [feedbackInstructor, setFeedbackInstructor] = useState(currentUser?.email || '');
  const [feedbackInstructorError, setFeedbackInstructorError] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackDate, setFeedbackDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedbackTime, setFeedbackTime] = useState(new Date().toTimeString().slice(0, 5));
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  // Chat Filter State
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [chatSenderFilter, setChatSenderFilter] = useState<'all' | 'instructor' | 'student'>('all');
  const [chatStartDate, setChatStartDate] = useState('');
  const [chatEndDate, setChatEndDate] = useState('');
  const [showChatFilters, setShowChatFilters] = useState(false);
  const [visibleMessagesCount, setVisibleMessagesCount] = useState(20);

  useEffect(() => {
    setVisibleMessagesCount(20);
  }, [student?.id]);

  // Attendance Search State
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [quickNoteIndex, setQuickNoteIndex] = useState<number | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteInstructor, setQuickNoteInstructor] = useState('');

  // Notes State
  const [noteContent, setNoteContent] = useState('');
  const [noteInstructor, setNoteInstructor] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteTime, setNoteTime] = useState(new Date().toTimeString().slice(0, 5));
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteSortOrder, setNoteSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  // Modality Editing State
  const [isEditingModalities, setIsEditingModalities] = useState(false);
  const [editClasses, setEditClasses] = useState<string[]>([]);
  const [editSubModalities, setEditSubModalities] = useState<string[]>([]);
  const [editTurmas, setEditTurmas] = useState<string[]>([]);
  const [expandedEditModalities, setExpandedEditModalities] = useState<string[]>([]);
  const [customSubInputs, setCustomSubInputs] = useState<Record<string, string>>({});

  // Personal Info Editing State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfoData, setEditInfoData] = useState({
    name: '',
    email: '',
    contact: '',
    address: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    document: '',
    birthDate: '',
    status: 'active' as 'active' | 'inactive',
    planType: 'Studio' as any,
    contractedPlan: 'Mensal' as any,
    joinDate: '',
    paymentStatus: 'paid' as any
  });
  const [infoErrors, setInfoErrors] = useState<Record<string, string>>({});

  const validateInfoField = (field: string, value: string) => {
    let error = '';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

    switch (field) {
      case 'name':
        if (!value.trim()) error = 'Obrigatório';
        else if (value.trim().length < 3) error = 'Mínimo 3 caracteres';
        break;
      case 'email':
        if (!value.trim()) error = 'Obrigatório';
        else if (!emailRegex.test(value)) error = 'E-mail inválido';
        break;
      case 'contact':
        if (!value.trim()) error = 'Obrigatório';
        else if (!phoneRegex.test(value.replace(/\D/g, ''))) error = 'Formato inválido';
        break;
      case 'document':
        const cleanDoc = value.replace(/\D/g, '');
        if (!value.trim()) error = 'Obrigatório';
        else if (cleanDoc.length !== 11 && cleanDoc.length !== 14) error = 'CPF/CNPJ inválido';
        break;
      case 'street':
      case 'neighborhood':
      case 'city':
      case 'state':
        if (!value.trim()) error = 'Obrigatório';
        break;
      case 'number':
        if (!value.trim()) error = 'Obrigatório';
        break;
      case 'zipCode':
        if (!value.trim()) error = 'Obrigatório';
        else if (value.replace(/\D/g, '').length !== 8) error = 'CEP inválido';
        break;
    }

    setInfoErrors(prev => {
      const newErrors = { ...prev };
      if (error) newErrors[field] = error;
      else delete newErrors[field];
      return newErrors;
    });

    return !error;
  };

  const handleSaveInfo = () => {
    if (!student) return;
    
    const fields = ['name', 'email', 'contact', 'document', 'street', 'number', 'neighborhood', 'city', 'state', 'zipCode'];
    let isValid = true;
    fields.forEach(f => {
      if (!validateInfoField(f, (editInfoData as any)[f])) isValid = false;
    });

    if (!isValid) {
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    const formattedAddress = `${editInfoData.street}, ${editInfoData.number}${editInfoData.complement ? ', ' + editInfoData.complement : ''}, ${editInfoData.neighborhood}, ${editInfoData.city} - ${editInfoData.state}, ${editInfoData.zipCode}`;

    onUpdateStudent({
      ...student,
      ...editInfoData,
      address: formattedAddress
    });
    setIsEditingInfo(false);
    toast.success('Informações atualizadas com sucesso!');
  };

  const handleSaveModalities = () => {
    if (!student) return;

    if (editClasses.length === 0) {
      toast.error('Selecione pelo menos uma modalidade');
      return;
    }

    if (editTurmas.length === 0) {
      toast.error('Selecione pelo menos uma turma');
      return;
    }

    onUpdateStudent({
      ...student,
      classes: editClasses,
      subModalities: editSubModalities,
      turmas: editTurmas
    });
    setIsEditingModalities(false);
    toast.success('Modalidades atualizadas com sucesso!');
  };

  if (!student) return null;

  const handleSaveNote = () => {
    if (!noteContent.trim() || !noteInstructor.trim() || !noteDate || !noteTime) {
      toast.error('Preencha todos os campos da nota');
      return;
    }

    let updatedNotes = [...(student.notes || [])];

    if (editingNoteId) {
      updatedNotes = updatedNotes.map(note => 
        note.id === editingNoteId 
          ? { ...note, content: noteContent, instructor: noteInstructor, timestamp: `${noteDate}T${noteTime}:00` }
          : note
      );
      toast.success('Nota atualizada com sucesso!');
    } else {
      const newNote: Note = {
        id: `n${Date.now()}`,
        content: noteContent,
        timestamp: `${noteDate}T${noteTime}:00`,
        instructor: noteInstructor
      };
      updatedNotes = [newNote, ...updatedNotes];
      toast.success('Nota adicionada com sucesso!');
    }

    onUpdateStudent({
      ...student,
      notes: updatedNotes
    });

    setNoteContent('');
    setNoteInstructor('');
    setNoteDate(new Date().toISOString().split('T')[0]);
    setNoteTime(new Date().toTimeString().slice(0, 5));
    setEditingNoteId(null);
  };

  const handleDeleteNote = (id: string) => {
    setNoteToDeleteId(id);
    setShowDeleteNoteModal(true);
  };

  const confirmDeleteNote = () => {
    if (!noteToDeleteId || !student) return;
    const updatedNotes = student.notes?.filter(note => note.id !== noteToDeleteId) || [];
    onUpdateStudent({
      ...student,
      notes: updatedNotes
    });
    toast.success('Nota removida com sucesso!');
    setShowDeleteNoteModal(false);
    setNoteToDeleteId(null);
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
    setNoteInstructor(note.instructor);
    const [date, time] = note.timestamp.split('T');
    setNoteDate(date);
    setNoteTime(time.slice(0, 5));
    
    // Scroll to form
    const formElement = document.getElementById('note-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setNoteContent('');
    setNoteInstructor('');
    setNoteDate(new Date().toISOString().split('T')[0]);
    setNoteTime(new Date().toTimeString().slice(0, 5));
  };

  const filteredAttendance = useMemo(() => {
    let filtered = student.attendance;
    
    if (attendanceSearch.trim()) {
      const term = attendanceSearch.toLowerCase();
      filtered = filtered.filter(record => 
        record.className.toLowerCase().includes(term) || 
        record.instructor.toLowerCase().includes(term)
      );
    }

    if (attendanceStatusFilter !== 'all') {
      const isPresent = attendanceStatusFilter === 'present';
      filtered = filtered.filter(record => record.present === isPresent);
    }

    return filtered;
  }, [student.attendance, attendanceSearch, attendanceStatusFilter]);

  const filteredMessages = useMemo(() => {
    return student.messages.filter(msg => {
      // Search term filter
      if (chatSearchTerm && !msg.text.toLowerCase().includes(chatSearchTerm.toLowerCase())) {
        return false;
      }
      
      // Sender filter
      if (chatSenderFilter !== 'all') {
        const isStudent = msg.senderRole === 'Aluno';
        if (chatSenderFilter === 'student' && !isStudent) return false;
        if (chatSenderFilter === 'instructor' && isStudent) return false;
      }
      
      // Date range filter
      if (chatStartDate || chatEndDate) {
        const msgDate = new Date(msg.timestamp);
        msgDate.setHours(0, 0, 0, 0);
        
        if (chatStartDate) {
          const start = new Date(chatStartDate + 'T00:00:00');
          if (msgDate < start) return false;
        }
        
        if (chatEndDate) {
          const end = new Date(chatEndDate + 'T00:00:00');
          if (msgDate > end) return false;
        }
      }
      
      return true;
    });
  }, [student.messages, chatSearchTerm, chatSenderFilter, chatStartDate, chatEndDate]);

  const visibleMessages = useMemo(() => {
    return filteredMessages.slice(-visibleMessagesCount);
  }, [filteredMessages, visibleMessagesCount]);

  const hasMoreMessages = filteredMessages.length > visibleMessagesCount;

  // Mark messages as read when they become visible on screen
  useEffect(() => {
    if (!socket || !student || !scrollRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            const isUnread = entry.target.getAttribute('data-unread') === 'true';
            const sender = entry.target.getAttribute('data-sender');

            if (messageId && isUnread && sender === 'student') {
              socket.emit('mark_read', { studentId: student.id, messageId });
            }
          }
        });
      },
      { 
        root: scrollRef.current,
        threshold: 0.5, // Mark as read when 50% of the message is visible
        rootMargin: '0px'
      }
    );

    // Observe all unread messages from the student
    const unreadElements = scrollRef.current.querySelectorAll('[data-unread="true"][data-sender="student"]');
    unreadElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [visibleMessages, socket, student?.id]);

  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const handleLoadMoreMessages = useCallback(() => {
    const container = scrollRef.current;
    if (container && hasMoreMessages && !isFetchingMore) {
      setIsFetchingMore(true);
      const oldScrollHeight = container.scrollHeight;
      
      // Simulate a small delay for smoother loading feel
      setTimeout(() => {
        setVisibleMessagesCount(prev => prev + 20);
        setIsFetchingMore(false);
        
        // Use requestAnimationFrame to wait for the DOM update
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - oldScrollHeight;
        });
      }, 300);
    }
  }, [hasMoreMessages, isFetchingMore]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Trigger load more when scrolling near the top (within 50px)
      if (container.scrollTop <= 50 && hasMoreMessages) {
        handleLoadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, handleLoadMoreMessages]);

  useEffect(() => {
    if (scrollRef.current && !hasMoreMessages) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [student?.messages?.length, remoteTyping, hasMoreMessages]);

  // Scroll to bottom only on initial load or when a NEW message is added at the end
  const prevMessagesLength = useRef(student?.messages?.length || 0);
  useEffect(() => {
    if (student?.messages && student.messages.length > prevMessagesLength.current) {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
    prevMessagesLength.current = student?.messages?.length || 0;
  }, [student?.messages]);

  const handleAiSuggestFeedback = async () => {
    if (!process.env.GEMINI_API_KEY) {
      toast.error('Chave da API Gemini não configurada');
      return;
    }

    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Você é um instrutor de dança profissional no Stylo Urbano Studio. 
        Gere um feedback anual construtivo e motivador para o aluno ${student.name}.
        Métricas do aluno:
        - Taxa de Presença: ${attendanceStats.rate}%
        - Modalidades: ${student.classes.join(', ')}
        - Status de Pagamento: ${student.paymentStatus}
        - Histórico de Presença: ${student.attendance.length} aulas registradas.
        
        O feedback deve ser em português, ter tom profissional e encorajador, e focar na evolução técnica e artística baseada na presença. 
        Se a presença for baixa, sugira mais foco e consistência. Se for alta, elogie o comprometimento.
        Limite o texto a 3 ou 4 frases curtas.`
      });

      const text = response.text;
      if (text) {
        setFeedbackContent(text.trim());
        toast.success('Sugestão gerada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar feedback com IA:', error);
      toast.error('Falha ao gerar sugestão com IA');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAddFeedback = () => {
    if (!feedbackInstructor || !feedbackContent) {
      toast.error('Preencha o instrutor e o conteúdo do feedback');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(feedbackInstructor)) {
      setFeedbackInstructorError('E-mail inválido');
      toast.error('O instrutor deve ser um e-mail válido');
      return;
    }

    setFeedbackInstructorError('');

    const newFeedback = {
      id: `f${Date.now()}`,
      year: feedbackYear,
      instructor: feedbackInstructor,
      content: feedbackContent,
      date: feedbackDate,
      time: feedbackTime
    };

    const updatedStudent: Student = {
      ...student,
      feedbacks: [newFeedback, ...student.feedbacks]
    };

    onUpdateStudent(updatedStudent);
    setFeedbackContent('');
    setFeedbackInstructor(currentUser?.email || '');
    setFeedbackDate(new Date().toISOString().split('T')[0]);
    setFeedbackTime(new Date().toTimeString().slice(0, 5));
    toast.success('Feedback anual registrado!', {
      description: `Avaliação de ${feedbackYear} para ${student.name}`
    });
  };

  const handleMarkAttendance = (present: boolean) => {
    if (!selectedClass) {
      toast.error('Selecione uma modalidade');
      return;
    }

    if (!attendanceInstructor) {
      toast.error('Informe o instrutor');
      return;
    }

    const newRecord = {
      id: `a${Date.now()}`,
      date: attendanceDate,
      present,
      className: selectedClass,
      instructor: attendanceInstructor
    };

    const updatedStudent: Student = {
      ...student,
      attendance: [newRecord, ...student.attendance]
    };

    onUpdateStudent(updatedStudent);
    toast.success(present ? 'Presença registrada!' : 'Falta registrada!', {
      description: `${student.name} em ${selectedClass}`
    });
  };

  const handleSaveQuickNote = (record: any, index: number) => {
    if (!quickNoteText.trim()) {
      toast.error('O conteúdo da nota não pode estar vazio');
      return;
    }

    if (!quickNoteInstructor.trim()) {
      toast.error('O nome do instrutor não pode estar vazio');
      return;
    }

    const updatedAttendance = student.attendance.map((a, idx) => {
      const isMatch = a.id ? a.id === record.id : idx === index;
      return isMatch ? { ...a, note: quickNoteText, instructor: quickNoteInstructor } : a;
    });

    const newNote: Note = {
      id: `n${Date.now()}`,
      content: `[Aula de ${record.className} - ${format(new Date(record.date + 'T12:00:00'), 'dd/MM/yyyy')}] ${quickNoteText}`,
      timestamp: new Date().toISOString(),
      instructor: quickNoteInstructor
    };

    onUpdateStudent({
      ...student,
      attendance: updatedAttendance,
      notes: [newNote, ...(student.notes || [])]
    });

    setQuickNoteIndex(null);
    setQuickNoteText('');
    setQuickNoteInstructor('');
    toast.success('Nota de aula salva com sucesso!');
  };

  const attendanceStats = useMemo(() => {
    const total = student.attendance.length;
    
    // Per class stats
    const classStats = student.classes.map(className => {
      const classAttendance = student.attendance.filter(a => a.className === className);
      const classTotal = classAttendance.length;
      const classPresent = classAttendance.filter(a => a.present).length;
      const classRate = classTotal > 0 ? Math.round((classPresent / classTotal) * 100) : 0;
      
      return {
        name: className,
        total: classTotal,
        present: classPresent,
        rate: classRate
      };
    });

    if (total === 0) return { rate: 0, present: 0, absent: 0, data: [{ name: 'Sem Dados', value: 1 }], classStats };
    
    const present = student.attendance.filter(a => a.present).length;
    const absent = total - present;
    const rate = Math.round((present / total) * 100);
    
    return {
      rate,
      present,
      absent,
      data: [
        { name: 'Presente', value: present },
        { name: 'Falta', value: absent }
      ],
      classStats
    };
  }, [student.attendance, student.classes]);

  const paymentStats = useMemo(() => {
    if (!student.payments || student.payments.length === 0) {
      return { totalPaid: 0, pendingCount: 0, overdueCount: 0, totalPending: 0 };
    }
    
    const paid = student.payments.filter(p => p.status === 'paid');
    const pending = student.payments.filter(p => p.status === 'pending');
    const overdue = student.payments.filter(p => p.status === 'overdue');
    
    return {
      totalPaid: paid.reduce((sum, p) => sum + p.amount, 0),
      totalPending: pending.reduce((sum, p) => sum + p.amount, 0),
      pendingCount: pending.length,
      overdueCount: overdue.length
    };
  }, [student.payments]);

  const performanceData = useMemo(() => {
    if (!student.performance || student.performance.length === 0) return [];
    
    // Group by date
    const dates = [...new Set(student.performance.map(p => p.date))].sort();
    const modalities = [...new Set(student.performance.map(p => p.modality))];
    
    return dates.map(date => {
      const entry: any = { 
        date: format(new Date(date + 'T12:00:00'), 'MMM/yy', { locale: ptBR }),
        fullDate: date 
      };
      
      let totalScore = 0;
      let count = 0;

      modalities.forEach(mod => {
        const records = student.performance.filter(p => p.date === date && p.modality === mod);
        if (records.length > 0) {
          const avgScore = records.reduce((sum, r) => sum + r.score, 0) / records.length;
          entry[mod] = Math.round(avgScore);
          totalScore += avgScore;
          count++;
        }
      });

      if (count > 0) {
        entry['Média Geral'] = Math.round(totalScore / count);
      }

      return entry;
    });
  }, [student.performance]);

  const handleSavePerformance = () => {
    if (!student || !perfModality) {
      toast.error('Selecione a modalidade.');
      return;
    }

    const hasSubcategories = MODALITIES_CONFIG[perfModality].length > 0;
    if (hasSubcategories && perfSubModalities.length === 0) {
      toast.error('Selecione pelo menos uma subcategoria.');
      return;
    }

    const newRecord: PerformanceRecord = {
      date: perfDate,
      modality: perfModality,
      subModalities: perfSubModalities,
      score: perfScore
    };

    onUpdateStudent({
      ...student,
      performance: [...(student.performance || []), newRecord]
    });

    setShowPerformanceModal(false);
    setPerfSubModalities([]);
    setPerfSubSearch('');
    setShowSubModalitiesDropdown(false);
    toast.success('Performance registrada com sucesso!');
  };

  const handleGeneratePDF = () => {
    if (!student) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(255, 107, 0); // Primary color
      doc.text("STYLO DANCE STUDIO", pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Relatório Informativo do Aluno", pageWidth / 2, 30, { align: 'center' });

      // Contact Info
      doc.setFontSize(14);
      doc.text("Informações de Contato", 14, 45);
      doc.setFontSize(10);
      doc.text(`Nome: ${student.name}`, 14, 52);
      doc.text(`E-mail: ${student.email}`, 14, 57);
      doc.text(`Contato: ${student.contact}`, 14, 62);
      doc.text(`Documento: ${student.document}`, 14, 67);
      doc.text(`Data de Nascimento: ${format(new Date(student.birthDate), 'dd/MM/yyyy')}`, 14, 72);
      doc.text(`Endereço: ${student.address}`, 14, 77);
      doc.text(`Data de Adesão: ${format(new Date(student.joinDate), 'dd/MM/yyyy')}`, 14, 82);

      // Attendance History
      doc.setFontSize(14);
      doc.text("Histórico de Presença", 14, 95);
      const attendanceData = student.attendance.map(record => [
        format(new Date(record.date + 'T12:00:00'), 'dd/MM/yyyy'),
        record.className,
        record.instructor,
        record.present ? 'Presente' : 'Faltou'
      ]);

      autoTable(doc, {
        startY: 100,
        head: [['Data', 'Aula', 'Instrutor', 'Status']],
        body: attendanceData,
        theme: 'striped',
        headStyles: { fillColor: [255, 107, 0] }
      });

      // Annual Feedback
      let finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Feedback Anual", 14, finalY);
      
      if (student.feedbacks && student.feedbacks.length > 0) {
        const feedbackData = student.feedbacks.map(f => [
          f.year.toString(),
          f.instructor,
          f.content,
          format(new Date(f.date), 'dd/MM/yyyy')
        ]);
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Ano', 'Instrutor', 'Feedback', 'Data']],
          body: feedbackData,
          theme: 'striped',
          headStyles: { fillColor: [255, 107, 0] }
        });
        finalY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.text("Nenhum feedback registrado.", 14, finalY + 5);
        finalY += 15;
      }

      // Instructor Notes
      doc.setFontSize(14);
      doc.text("Notas do Instrutor", 14, finalY);
      
      if (student.notes && student.notes.length > 0) {
        const notesData = student.notes.map(n => [
          format(new Date(n.timestamp), 'dd/MM/yyyy HH:mm'),
          n.instructor,
          n.content
        ]);
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Data/Hora', 'Instrutor', 'Nota']],
          body: notesData,
          theme: 'striped',
          headStyles: { fillColor: [255, 107, 0] }
        });
      } else {
        doc.setFontSize(10);
        doc.text("Nenhuma nota registrada.", 14, finalY + 5);
      }

      doc.save(`Relatorio_${student.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error('Erro ao gerar o relatório PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleFavorite = () => {
    const updatedStudent: Student = {
      ...student,
      isFavorite: !student.isFavorite
    };
    onUpdateStudent(updatedStudent);
    toast.success(updatedStudent.isFavorite ? 'Aluno favoritado!' : 'Aluno removido dos favoritos');
  };

  const handleQuickAttendance = (present: boolean) => {
    if (!student.classes || student.classes.length === 0) {
      toast.error('O aluno não está matriculado em nenhuma modalidade');
      return;
    }

    const defaultClass = student.classes[0];
    const lastInstructor = student.attendance.length > 0 
      ? student.attendance[0].instructor 
      : 'Instrutor';

    const newRecord = {
      id: `a${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      present,
      className: defaultClass,
      instructor: lastInstructor
    };

    onUpdateStudent({
      ...student,
      attendance: [newRecord, ...student.attendance]
    });

    toast.success(present ? 'Presença rápida registrada!' : 'Falta rápida registrada!', {
      description: `${student.name} em ${defaultClass}`
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-primary to-[#FF9E00] flex items-center justify-center text-3xl sm:text-4xl font-headline font-black shadow-[0_0_40px_rgba(255,107,0,0.2)] kinetic-glow shrink-0">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-3xl sm:text-4xl font-headline font-black tracking-tight uppercase">{student.name}</h2>
              <button 
                onClick={handleToggleFavorite}
                className={cn(
                  "p-2 rounded-xl border transition-all hover:scale-110 active:scale-95",
                  student.isFavorite 
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                    : "bg-surface-container border-outline text-on-surface-variant hover:text-amber-500"
                )}
              >
                <Star size={20} fill={student.isFavorite ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={cn(
                "px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest",
                student.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              )}>
                {student.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
              <span className={cn(
                "px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border",
                student.planType === 'Studio' ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(255,107,0,0.1)]" : "bg-surface-container-high text-on-surface-variant border-outline"
              )}>
                {student.planType === 'Studio' ? 'Direto do Studio' : student.planType}
              </span>
            </div>
            <p className="text-sm sm:text-base text-on-surface-variant flex items-center gap-2">
              <Calendar size={14} />
              Aluno desde {format(new Date(student.joinDate), 'MMMM yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-4">
          <div className="flex items-center gap-2 xs:mr-2 xs:border-r border-outline xs:pr-4">
            <button 
              onClick={() => setIsCardModalOpen(true)}
              className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg group"
              title="Ver Carteirinha Digital e QR Code do Aluno"
            >
              <QrCode size={14} className="group-hover:scale-110 transition-transform" />
              Carteirinha & QR
            </button>
            <button 
              onClick={() => handleQuickAttendance(true)}
              className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg group"
              title="Presença Rápida (Aula de Hoje)"
            >
              <CheckCircle2 size={14} className="group-hover:scale-110 transition-transform" />
              Presença
            </button>
            <button 
              onClick={() => handleQuickAttendance(false)}
              className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg group"
              title="Falta Rápida (Aula de Hoje)"
            >
              <XCircle size={14} className="group-hover:scale-110 transition-transform" />
              Falta
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-4 bg-surface-container-low rounded-2xl border border-outline hover:bg-surface-container-high transition-colors shrink-0">
              <MoreVertical size={20} />
            </button>
            <button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className={cn(
                "flex-1 xs:flex-none bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xl",
                isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-primary hover:text-white"
              )}
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {isGenerating ? 'Gerando...' : 'Gerar PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface-container-low border border-outline rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
          { id: 'attendance', label: 'Frequência', icon: CheckCircle2 },
          { id: 'performance', label: 'Performance', icon: Wand2 },
          { id: 'payments', label: 'Financeiro', icon: CreditCard },
          { id: 'notes', label: 'Observações', icon: StickyNote },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveProfileTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activeProfileTab === tab.id 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Cards */}
        <div className="lg:col-span-2 space-y-8">
          {activeProfileTab === 'overview' && (
            <>
              {/* Overall Attendance Summary */}
              <div className="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline kinetic-glow overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 sm:gap-10">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceStats.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={450}
                    >
                      <Cell fill="var(--color-primary)" />
                      <Cell fill="var(--color-surface-container-high)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-headline font-black text-primary">{attendanceStats.rate}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Frequência</span>
                </div>
              </div>

              <div className="flex-1 space-y-6 w-full">
                <div>
                  <h3 className="text-2xl font-headline font-black uppercase tracking-tight mb-2">Resumo Geral de Presença</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    {student.name} possui um aproveitamento de <span className="text-primary font-bold">{attendanceStats.rate}%</span> das aulas contratadas. 
                    {attendanceStats.rate >= 90 
                      ? " Um desempenho excepcional que reflete total comprometimento com a evolução na dança." 
                      : attendanceStats.rate >= 70 
                      ? " Um bom nível de frequência, mantendo a consistência necessária para o aprendizado." 
                      : " A frequência está abaixo do esperado. Recomendamos maior regularidade para garantir o progresso técnico."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Presenças</p>
                    <p className="text-2xl font-headline font-black text-emerald-500">{attendanceStats.present}</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Faltas</p>
                    <p className="text-2xl font-headline font-black text-red-500">{attendanceStats.absent}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <span>Meta de Frequência (85%)</span>
                    <span>{attendanceStats.rate >= 85 ? 'Meta Atingida' : 'Abaixo da Meta'}</span>
                  </div>
                  <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${attendanceStats.rate}%` }}
                      className={cn(
                        "h-full transition-all duration-1000",
                        attendanceStats.rate >= 85 ? "bg-emerald-500" : attendanceStats.rate >= 70 ? "bg-primary" : "bg-amber-500"
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

          {activeProfileTab === 'performance' && (
            /* Performance Progress Chart */
            <div className="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline kinetic-glow space-y-6 sm:space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight">Evolução Técnica</h3>
                <p className="text-on-surface-variant text-xs sm:text-sm">Acompanhamento de performance por modalidade.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button 
                  onClick={() => setShowPerformanceModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  <Plus size={16} />
                  Registrar Performance
                </button>
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-high rounded-2xl border border-outline">
                  <Wand2 size={18} className="text-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">IA Insights</span>
                </div>
              </div>
            </div>
            
            {performanceData.length > 0 ? (
              <div className="space-y-12">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: 'var(--on-surface-variant)', fontWeight: 600 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: 'var(--on-surface-variant)', fontWeight: 600 }}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <Tooltip 
                        cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        contentStyle={{ 
                          backgroundColor: 'var(--surface-container-high)', 
                          borderRadius: '16px', 
                          border: '1px solid var(--outline)',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                        }} 
                        itemStyle={{ padding: '2px 0' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle" 
                        wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} 
                      />
                      {Object.keys(performanceData[0] || {})
                        .filter(key => key !== 'date' && key !== 'fullDate')
                        .map((modality, index) => {
                          const colors = ['#FF6B00', '#0EA5E9', '#F59E0B', '#6366F1', '#10B981', '#EC4899'];
                          const isGeneral = modality === 'Média Geral';
                          return (
                            <Line 
                              key={modality}
                              type="monotone" 
                              dataKey={modality} 
                              stroke={isGeneral ? 'var(--primary)' : colors[index % colors.length]} 
                              strokeWidth={isGeneral ? 5 : 2} 
                              strokeDasharray={isGeneral ? "0" : "5 5"}
                              dot={isGeneral ? { fill: 'var(--primary)', strokeWidth: 3, r: 5, stroke: 'var(--surface-container)' } : { fill: colors[index % colors.length], strokeWidth: 2, r: 3 }}
                              activeDot={{ r: isGeneral ? 8 : 6, strokeWidth: 0 }}
                              animationDuration={1500}
                              connectNulls
                            />
                          );
                        })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Histórico de Registros</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[...student.performance].reverse().slice(0, 8).map((record, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-surface-container-low border border-outline rounded-2xl hover:border-primary/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Wand2 size={20} />
                          </div>
                          <div>
                            <div className="flex flex-col">
                              <p className="text-sm font-bold">{record.modality}</p>
                              {record.subModalities && record.subModalities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {record.subModalities.map(sub => (
                                    <span key={sub} className="text-[8px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-widest">
                                      {sub}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-on-surface-variant mt-1">{format(new Date(record.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-headline font-black text-primary">{record.score}</p>
                            <p className="text-[8px] text-on-surface-variant uppercase font-bold">Pontos</p>
                          </div>
                          <button 
                            onClick={() => {
                              const updatedPerf = student.performance?.filter((_, i) => i !== (student.performance!.length - 1 - idx));
                              onUpdateStudent({ ...student, performance: updatedPerf });
                              toast.success('Registro removido.');
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-on-surface-variant space-y-4 bg-surface-container-low rounded-2xl border border-dashed border-outline">
                <LayoutDashboard size={48} className="opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-50">Nenhum dado de performance registrado</p>
                <button 
                  onClick={() => setShowPerformanceModal(true)}
                  className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
                >
                  Começar a acompanhar
                </button>
              </div>
            )}
          </div>
        )}

          {activeProfileTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-6 kinetic-glow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Dados de Contato</h3>
                    {currentUser.role === 'Gerente' && (
                      <button 
                        onClick={() => {
                          setEditInfoData({
                            name: student.name,
                            email: student.email,
                            contact: student.contact,
                            address: student.address,
                            street: student.street || '',
                            number: student.number || '',
                            complement: student.complement || '',
                            neighborhood: student.neighborhood || '',
                            city: student.city || '',
                            state: student.state || '',
                            zipCode: student.zipCode || '',
                            document: student.document,
                            birthDate: student.birthDate,
                            status: student.status,
                            planType: student.planType,
                            contractedPlan: student.contractedPlan || 'Mensal',
                            joinDate: student.joinDate || '',
                            paymentStatus: student.paymentStatus || 'paid'
                          });
                          setInfoErrors({});
                          setIsEditingInfo(true);
                        }}
                        className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                        title="Editar Informações"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline flex items-center justify-center text-primary">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Telefone</p>
                        <p className="font-bold">{student.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline flex items-center justify-center text-primary">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">E-mail</p>
                        <p className="font-bold">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline flex items-center justify-center text-primary">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Endereço</p>
                        <p className="font-bold text-sm">{student.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline flex items-center justify-center text-primary">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Documento</p>
                        <p className="font-bold">{student.document}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-6 kinetic-glow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Modalidades e Turmas</h3>
                    {currentUser.role === 'Gerente' && (
                      <button 
                        onClick={() => {
                          setEditClasses(student.classes);
                          setEditSubModalities(student.subModalities || []);
                          setEditTurmas(student.turmas);
                          setIsEditingModalities(true);
                        }}
                        className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                        title="Editar Modalidades"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <LayoutGrid size={14} className="text-primary" />
                        <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest">Modalidades Principais</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.classes.map((c, i) => (
                          <span key={`mod-${i}`} className={cn("px-4 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 shadow-sm", getModalityColor(c))}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    {student.subModalities && student.subModalities.length > 0 && (
                      <div className="space-y-3 p-4 bg-surface-container-low rounded-2xl border border-outline/50">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-primary/70" />
                          <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest">Submodalidades</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {student.subModalities.map((s, i) => (
                            <span key={`sub-${i}`} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-outline bg-surface-container text-on-surface-variant uppercase tracking-widest hover:border-primary/30 transition-colors">
                              {s.includes(']') ? s.split('] ')[1] : s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-primary/70" />
                        <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest">Turmas</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.turmas.map((t, i) => (
                          <span key={`turma-${i}`} className={cn("px-4 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 shadow-sm", getTurmaColor(t))}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-outline/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar size={14} className="text-primary/70" />
                      <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-widest">Próxima Aula</p>
                    </div>
                    <div className="flex items-center justify-between bg-surface-container-high/50 p-4 rounded-2xl border border-outline/30">
                      <span className="font-bold text-sm">Danças Urbanas</span>
                      <span className="text-primary font-black text-sm">Hoje, 18:00</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-6 kinetic-glow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Dados do Plano</h3>
                    {currentUser.role === 'Gerente' && (
                      <button 
                        onClick={() => {
                          setEditInfoData({
                            name: student.name,
                            email: student.email,
                            contact: student.contact,
                            address: student.address,
                            street: student.street || '',
                            number: student.number || '',
                            complement: student.complement || '',
                            neighborhood: student.neighborhood || '',
                            city: student.city || '',
                            state: student.state || '',
                            zipCode: student.zipCode || '',
                            document: student.document,
                            birthDate: student.birthDate,
                            status: student.status,
                            planType: student.planType,
                            contractedPlan: student.contractedPlan || 'Mensal',
                            joinDate: student.joinDate || '',
                            paymentStatus: student.paymentStatus || 'paid'
                          });
                          setInfoErrors({});
                          setIsEditingInfo(true);
                        }}
                        className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                        title="Editar Informações"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline flex items-center justify-center text-primary">
                        <Tag size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Tipo de Plano</p>
                        <p className="font-bold">{student.planType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline flex items-center justify-center text-primary">
                        <StickyNote size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Plano Contratado</p>
                        <p className="font-bold">{student.contractedPlan || 'Não definido'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline flex items-center justify-center text-primary">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Data de Adesão</p>
                        <p className="font-bold">{student.joinDate ? format(new Date(student.joinDate + 'T12:00:00'), "dd/MM/yyyy") : 'Não definida'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center",
                        student.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        student.paymentStatus === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        <DollarSign size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">Status de Pagamento</p>
                        <p className={cn(
                          "font-bold",
                          student.paymentStatus === 'paid' ? "text-emerald-500" :
                          student.paymentStatus === 'pending' ? "text-amber-500" :
                          "text-red-500"
                        )}>
                          {student.paymentStatus === 'paid' ? 'Pago' :
                           student.paymentStatus === 'pending' ? 'Pendente' : 'Atrasado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress by Modality */}
              <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-8 kinetic-glow">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-headline font-bold">Progresso por Modalidade</h3>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                    <Clock size={14} />
                    <span>Baseado em Frequência</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {attendanceStats.classStats.map((stat, i) => (
                    <div key={i} className="p-6 bg-surface-container-low rounded-2xl border border-outline space-y-4 group hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold", getModalityColor(stat.name))}>
                            {stat.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{stat.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{stat.present} aulas concluídas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-headline font-black text-primary">{stat.rate}%</p>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">Domínio</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          <span>Nível de Evolução</span>
                          <span>{stat.rate >= 90 ? 'Avançado' : stat.rate >= 60 ? 'Intermediário' : 'Iniciante'}</span>
                        </div>
                        <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.rate}%` }}
                            className={cn(
                              "h-full transition-all duration-1000",
                              stat.rate >= 90 ? "bg-emerald-500" : stat.rate >= 60 ? "bg-primary" : "bg-amber-500"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {activeProfileTab === 'attendance' && (
            /* Attendance History */
            <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-8 kinetic-glow">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold">Registro de Presença</h3>
              <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Buscar aula ou instrutor..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="bg-surface-container-low border border-outline rounded-full pl-9 pr-4 py-1.5 text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-primary outline-none transition-all w-40 focus:w-64"
                />
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-on-surface-variant">Presente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-on-surface-variant">Falta</span>
                </div>
              </div>
            </div>

            {/* Quick Mark Attendance */}
            <div className="p-6 bg-surface-container-low rounded-2xl border border-outline space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Modalidade</label>
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-surface-container border border-outline rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="">Selecionar aula...</option>
                    {student.classes.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Instrutor</label>
                  <input 
                    type="text"
                    placeholder="Nome do instrutor"
                    value={attendanceInstructor}
                    onChange={(e) => setAttendanceInstructor(e.target.value)}
                    className="w-full bg-surface-container border border-outline rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Data</label>
                  <input 
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full bg-surface-container border border-outline rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleMarkAttendance(true)}
                  className="flex-1 bg-emerald-500/10 text-emerald-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                >
                  Registrar Presença
                </button>
                <button 
                  onClick={() => handleMarkAttendance(false)}
                  className="flex-1 bg-red-500/10 text-red-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                >
                  Registrar Falta
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Histórico de Aulas</h4>
                <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl border border-outline">
                  <button 
                    onClick={() => setAttendanceStatusFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      attendanceStatusFilter === 'all' ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:text-primary"
                    )}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setAttendanceStatusFilter('present')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      attendanceStatusFilter === 'present' ? "bg-emerald-500 text-white shadow-lg" : "text-on-surface-variant hover:text-emerald-500"
                    )}
                  >
                    Presentes
                  </button>
                  <button 
                    onClick={() => setAttendanceStatusFilter('absent')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                      attendanceStatusFilter === 'absent' ? "bg-red-500 text-white shadow-lg" : "text-on-surface-variant hover:text-red-500"
                    )}
                  >
                    Ausentes
                  </button>
                </div>
              </div>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record, i) => (
                  <div key={i} className="flex flex-col p-4 rounded-2xl bg-surface-container-low border border-outline hover:border-primary/20 transition-all gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          record.present ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {record.present ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-bold">Aula de {record.className}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold">{format(new Date(record.date + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">• Prof. {record.instructor}</span>
                          </div>
                          {record.note && (
                            <div className="mt-2 p-3 bg-surface-container rounded-xl border border-outline/50 flex items-start gap-2">
                              <StickyNote size={12} className="text-primary mt-0.5 shrink-0" />
                              <p className="text-xs text-on-surface-variant italic leading-relaxed">"{record.note}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "font-bold text-sm",
                          record.present ? "text-emerald-500" : "text-red-500"
                        )}>
                          {record.present ? 'PRESENÇA' : 'FALTA'}
                        </span>
                        <button 
                          onClick={() => {
                            if (quickNoteIndex === i) {
                              setQuickNoteIndex(null);
                              setQuickNoteText('');
                              setQuickNoteInstructor('');
                            } else {
                              setQuickNoteIndex(i);
                              setQuickNoteText(record.note || '');
                              setQuickNoteInstructor(currentUser?.name || record.instructor || '');
                            }
                          }}
                          className={cn(
                            "p-2 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                            quickNoteIndex === i 
                              ? "bg-primary text-white border-primary" 
                              : "bg-surface-container border-outline text-on-surface-variant hover:text-primary hover:border-primary/30"
                          )}
                        >
                          <StickyNote size={14} />
                          {quickNoteIndex === i ? 'Cancelar' : 'Nota'}
                        </button>
                      </div>
                    </div>

                    {quickNoteIndex === i && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="overflow-hidden space-y-3 pt-2 border-t border-outline"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Instrutor</label>
                            <input 
                              type="text"
                              placeholder="Nome do instrutor"
                              value={quickNoteInstructor}
                              onChange={(e) => setQuickNoteInstructor(e.target.value)}
                              className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Data da Aula</label>
                            <div className="w-full bg-surface-container/50 border border-outline rounded-xl px-3 py-2 text-xs text-on-surface-variant font-medium">
                              {format(new Date(record.date + 'T12:00:00'), "dd/MM/yyyy")}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Nota da Aula</label>
                          <textarea 
                            placeholder="Descreva o desempenho ou comportamento do aluno nesta aula..."
                            value={quickNoteText}
                            onChange={(e) => setQuickNoteText(e.target.value)}
                            className="w-full bg-surface-container border border-outline rounded-xl p-4 text-xs focus:ring-2 focus:ring-primary outline-none transition-all min-h-[80px]"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleSaveQuickNote(record, i)}
                            className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg kinetic-glow"
                          >
                            Salvar Nota
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-10 text-center border border-dashed border-outline rounded-2xl">
                  <p className="text-sm text-on-surface-variant">
                    {student.attendance.length > 0 ? 'Nenhum registro corresponde à busca.' : 'Nenhum registro de presença encontrado.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

          {activeProfileTab === 'notes' && (
            <>
              {/* Annual Feedback Section */}
              <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-8 kinetic-glow">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold">Feedback Anual do Instrutor</h3>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleAiSuggestFeedback}
                  disabled={isAiGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                  Sugerir com IA
                </button>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <MessageSquare size={14} />
                  <span>Avaliações de Desempenho</span>
                </div>
              </div>
            </div>

            {/* Add Feedback Form */}
            <div className="p-6 bg-surface-container-low rounded-2xl border border-outline space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ano de Referência</label>
                  <select 
                    value={feedbackYear}
                    onChange={(e) => setFeedbackYear(Number(e.target.value))}
                    className="w-full bg-surface-container border border-outline rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Instrutor Responsável (E-mail)</label>
                    {feedbackInstructorError && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">{feedbackInstructorError}</span>}
                  </div>
                  <input 
                    type="email"
                    placeholder="instrutor@stylo.com"
                    value={feedbackInstructor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFeedbackInstructor(val);
                      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                      if (val && !emailRegex.test(val)) {
                        setFeedbackInstructorError('E-mail inválido');
                      } else {
                        setFeedbackInstructorError('');
                      }
                    }}
                    className={cn(
                      "w-full bg-surface-container border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all",
                      feedbackInstructorError ? "border-red-500/50" : "border-outline"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Data da Avaliação</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="date"
                      value={feedbackDate}
                      onChange={(e) => setFeedbackDate(e.target.value)}
                      className="w-full bg-surface-container border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Hora da Avaliação</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="time"
                      value={feedbackTime}
                      onChange={(e) => setFeedbackTime(e.target.value)}
                      className="w-full bg-surface-container border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Conteúdo da Avaliação</label>
                <textarea 
                  placeholder="Descreva a evolução técnica, rítmica e artística do aluno..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  className="w-full bg-surface-container border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all min-h-[120px] resize-none"
                />
              </div>
              <button 
                onClick={handleAddFeedback}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,107,0,0.2)] hover:scale-[1.02] transition-all"
              >
                Registrar Avaliação Anual
              </button>
            </div>

            {/* Feedback History */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Histórico de Avaliações</h4>
              {student.feedbacks.length > 0 ? (
                student.feedbacks.map((fb) => (
                  <div key={fb.id} className="p-6 rounded-2xl bg-surface-container-low border border-outline space-y-4 hover:border-primary/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {fb.year}
                        </div>
                        <div>
                          <p className="font-bold">Avaliação Anual {fb.year}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">Por: {fb.instructor}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                        {format(new Date(fb.date + 'T' + (fb.time || '12:00') + ':00'), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed italic">
                      "{fb.content}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center border border-dashed border-outline rounded-2xl">
                  <p className="text-sm text-on-surface-variant">Nenhuma avaliação anual registrada ainda.</p>
                </div>
              )}
            </div>
          </div>

          {/* Instructor Notes Section */}
          <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-8 kinetic-glow">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold">Notas do Instrutor</h3>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                <FileText size={14} />
                <span>Observações Internas</span>
              </div>
            </div>

            {/* Add Note Form */}
            <div id="note-form" className="p-6 bg-surface-container-low rounded-2xl border border-outline space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  {editingNoteId ? 'Editar Nota' : 'Adicionar Nova Nota'}
                </h4>
                {editingNoteId && (
                  <button 
                    onClick={cancelEdit}
                    className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Instrutor</label>
                <input 
                  type="text"
                  placeholder="Seu nome"
                  value={noteInstructor}
                  onChange={(e) => setNoteInstructor(e.target.value)}
                  className="w-full bg-surface-container border border-outline rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Data (DD/MM/AAAA)</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="date"
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      className="w-full bg-surface-container border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Hora (HH:MM)</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="time"
                      value={noteTime}
                      onChange={(e) => setNoteTime(e.target.value)}
                      className="w-full bg-surface-container border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Conteúdo da Nota</label>
                <textarea 
                  placeholder="Adicione observações sobre o comportamento, evolução ou necessidades específicas do aluno..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-surface-container border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all min-h-[100px] resize-none"
                />
              </div>
              <button 
                onClick={handleSaveNote}
                className={cn(
                  "w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs border transition-all",
                  editingNoteId 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-surface-container-high text-on-surface border-outline hover:bg-primary hover:text-white hover:border-primary"
                )}
              >
                {editingNoteId ? 'Salvar Alterações' : 'Adicionar Nota'}
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Histórico de Notas</h4>
                <button 
                  onClick={() => setNoteSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline text-[10px] font-bold uppercase tracking-widest hover:border-primary/50 transition-all"
                >
                  <ArrowUpDown size={12} />
                  {noteSortOrder === 'asc' ? 'Mais Antigas' : 'Mais Recentes'}
                </button>
              </div>
              
              <div className="space-y-4">
                {student.notes && student.notes.length > 0 ? (
                  [...(student.notes || [])]
                    .sort((a, b) => {
                      const dateA = new Date(a.timestamp).getTime();
                      const dateB = new Date(b.timestamp).getTime();
                      return noteSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                    })
                    .map((note) => (
                      <div key={note.id} className="p-5 rounded-2xl bg-surface-container-low border border-outline space-y-3 group hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Instrutor: {note.instructor}</span>
                            <span className="text-[10px] text-on-surface-variant font-bold">
                              {format(new Date(note.timestamp), "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditNote(note)}
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all"
                              title="Editar nota"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-all"
                              title="Excluir nota"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-on-surface leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    ))
                ) : (
                  <div className="py-8 text-center border border-dashed border-outline rounded-2xl">
                    <p className="text-sm text-on-surface-variant">Nenhuma nota interna registrada.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

          {activeProfileTab === 'payments' && (
            /* Payment History Section */
            <div className="space-y-8">
              {/* Payment Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface-container p-6 rounded-3xl border border-outline kinetic-glow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Pago</span>
                  </div>
                  <p className="text-2xl font-headline font-black text-emerald-500">R$ {paymentStats.totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-surface-container p-6 rounded-3xl border border-outline kinetic-glow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pendentes</span>
                  </div>
                  <p className="text-2xl font-headline font-black text-amber-500">{paymentStats.pendingCount} faturas</p>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase mt-1">R$ {paymentStats.totalPending.toFixed(2)} total</p>
                </div>
                <div className="bg-surface-container p-6 rounded-3xl border border-outline kinetic-glow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                      <AlertCircle size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Atrasados</span>
                  </div>
                  <p className="text-2xl font-headline font-black text-red-500">{paymentStats.overdueCount} faturas</p>
                </div>
              </div>

              <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-8 kinetic-glow">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-black uppercase tracking-tight">Histórico de Pagamentos</h3>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                <CreditCard size={14} />
                <span>Financeiro</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {student.payments && student.payments.length > 0 ? (
                [...student.payments].reverse().map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-6 bg-surface-container-low border border-outline rounded-2xl hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        payment.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" :
                        payment.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <p className="font-bold">R$ {payment.amount.toFixed(2)}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold">{format(new Date(payment.date + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                      </div>
                    </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                          payment.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" :
                          payment.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                          "bg-red-500/10 text-red-500"
                        )}>
                          {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Atrasado'}
                        </span>
                        {payment.status !== 'paid' && (payment.pixPayload || payment.paymentLink) && (
                          <button 
                            onClick={() => {
                              onOpenQR({
                                url: payment.pixPayload || payment.paymentLink || '',
                                title: payment.pixPayload ? 'PIX' : 'Link',
                                amount: payment.amount
                              });
                            }}
                            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary transition-all group/qr hover:text-white border border-primary/20"
                            title="Ver QR Code"
                          >
                            <QrCode size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsPaymentDetailsModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-surface-container border border-outline text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center border border-dashed border-outline rounded-2xl">
                  <p className="text-sm text-on-surface-variant">Nenhum histórico de pagamento encontrado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

        {/* Side Stats & Chat */}
        <div className="space-y-8">
          {/* Chat Interface */}
          <div className="bg-surface-container rounded-3xl border border-outline flex flex-col h-[600px] kinetic-glow overflow-hidden">
            <div className="p-6 border-b border-outline bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">Chat Direto</h3>
                  <div className="flex items-center gap-1.5">
                    {(chatStartDate || chatEndDate) ? (
                      <div className="flex items-center gap-1 text-[8px] font-bold text-primary uppercase tracking-widest">
                        <Calendar size={8} />
                        <span>
                          {chatStartDate ? format(new Date(chatStartDate + 'T00:00:00'), 'dd/MM') : '...'} 
                          {' - '} 
                          {chatEndDate ? format(new Date(chatEndDate + 'T00:00:00'), 'dd/MM') : '...'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Online</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {(chatSearchTerm || chatSenderFilter !== 'all' || chatStartDate || chatEndDate) && !showChatFilters && (
                    <button 
                      onClick={() => {
                        setChatSearchTerm('');
                        setChatSenderFilter('all');
                        setChatStartDate('');
                        setChatEndDate('');
                      }}
                      className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline px-2"
                    >
                      Limpar
                    </button>
                  )}
                  <button 
                    onClick={() => setShowChatFilters(!showChatFilters)}
                    className={cn(
                      "p-2 rounded-xl border transition-all relative",
                      chatSearchTerm || chatSenderFilter !== 'all' || chatStartDate || chatEndDate
                        ? "bg-primary/10 border-primary/30 text-primary" 
                        : showChatFilters 
                          ? "bg-surface-container-high border-primary/30 text-primary"
                          : "bg-surface-container border-outline text-on-surface-variant hover:text-primary"
                    )}
                  >
                    <Filter size={18} />
                    {(chatSearchTerm || chatSenderFilter !== 'all' || chatStartDate || chatEndDate) && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-surface-container shadow-lg">
                        {[
                          chatSearchTerm, 
                          chatSenderFilter !== 'all', 
                          chatStartDate, 
                          chatEndDate
                        ].filter(Boolean).length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Filters & Search */}
            <AnimatePresence>
              {showChatFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-surface-container-low border-b border-outline"
                >
                  <div className="p-6 space-y-4">
                    <div className="relative group">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text"
                        placeholder="Buscar palavras-chave..."
                        value={chatSearchTerm}
                        onChange={(e) => setChatSearchTerm(e.target.value)}
                        className="w-full bg-surface-container border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Remetente</label>
                        <select 
                          value={chatSenderFilter}
                          onChange={(e) => setChatSenderFilter(e.target.value as any)}
                          className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                          <option value="all">Todos</option>
                          <option value="instructor">Instrutor</option>
                          <option value="student">Aluno</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Período</label>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                setChatStartDate(today);
                                setChatEndDate(today);
                              }}
                              className="text-[8px] font-bold uppercase text-primary hover:underline"
                            >
                              Hoje
                            </button>
                            <button 
                              onClick={() => {
                                const end = new Date();
                                const start = new Date();
                                start.setDate(end.getDate() - 7);
                                setChatStartDate(start.toISOString().split('T')[0]);
                                setChatEndDate(end.toISOString().split('T')[0]);
                              }}
                              className="text-[8px] font-bold uppercase text-primary hover:underline"
                            >
                              7 Dias
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                            <input 
                              type="date"
                              value={chatStartDate}
                              onChange={(e) => setChatStartDate(e.target.value)}
                              className="w-full bg-surface-container border border-outline rounded-xl pl-8 pr-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                          </div>
                          <span className="text-on-surface-variant text-[10px] font-bold">-</span>
                          <div className="relative flex-1">
                            <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                            <input 
                              type="date"
                              value={chatEndDate}
                              onChange={(e) => setChatEndDate(e.target.value)}
                              className="w-full bg-surface-container border border-outline rounded-xl pl-8 pr-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {(chatSearchTerm || chatSenderFilter !== 'all' || chatStartDate || chatEndDate) && (
                      <button 
                        onClick={() => {
                          setChatSearchTerm('');
                          setChatSenderFilter('all');
                          setChatStartDate('');
                          setChatEndDate('');
                        }}
                        className="w-full py-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar scroll-smooth relative"
            >
              <AnimatePresence initial={false}>
                {hasMoreMessages && (
                  <div className="flex justify-center pb-4">
                    <div className="px-4 py-2 bg-surface-container-high border border-outline rounded-xl text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      {isFetchingMore ? (
                        <>
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          >
                            <Clock size={12} />
                          </motion.div>
                          Carregando mensagens antigas...
                        </>
                      ) : (
                        <>
                          <Clock size={12} />
                          Role para o topo para carregar mais {Math.min(20, filteredMessages.length - visibleMessagesCount)} mensagens
                        </>
                      )}
                    </div>
                  </div>
                )}
                {visibleMessages.length > 0 ? (
                  visibleMessages.map((msg) => (
                    <motion.div 
                      key={msg.id}
                      data-message-id={msg.id}
                      data-unread={!msg.read}
                      data-sender={msg.senderId}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        msg.senderId === currentUser.id ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "p-3.5 rounded-2xl text-sm leading-relaxed relative group",
                        msg.senderId === currentUser.id 
                          ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10" 
                          : "bg-surface-container-low border border-outline text-on-surface rounded-tl-none"
                      )}>
                        {msg.type === 'payment' ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                              <CreditCard size={14} />
                              <span>Link de Pagamento</span>
                            </div>
                            <p className="text-sm">{msg.text}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <a 
                                href={msg.paymentLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={cn(
                                  "py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all",
                                  msg.senderId === currentUser.id
                                    ? "bg-white text-primary hover:bg-white/90"
                                    : "bg-primary text-white hover:bg-primary/90"
                                )}
                              >
                                Pagar Agora
                              </a>
                              <button 
                                onClick={() => {
                                  onOpenQR({
                                    url: msg.pixPayload || msg.paymentLink || '',
                                    title: msg.pixPayload ? 'PIX' : 'Link de Pagamento',
                                    amount: parseFloat(msg.text.split('R$ ')[1]?.split(' - ')[0]) || 0
                                  });
                                }}
                                className={cn(
                                  "py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border",
                                  msg.senderId === currentUser.id
                                    ? "border-white/30 text-white hover:bg-white/10"
                                    : "border-primary/30 text-primary hover:bg-primary/5"
                                )}
                              >
                                <QrCode size={14} />
                                QR Code
                              </button>
                            </div>
                          </div>
                        ) : (
                          msg.text
                        )}
                        <div className={cn(
                          "absolute top-0 w-2 h-2",
                          msg.senderId === currentUser.id 
                            ? "right-[-2px] bg-primary" 
                            : "left-[-2px] bg-surface-container-low border-l border-t border-outline"
                        )} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)', transform: msg.senderId === currentUser.id ? 'none' : 'rotate(-90deg)' }} />
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 px-1">
                        <span className="text-[9px] text-on-surface-variant opacity-60 font-bold">
                          {msg.senderName} • {format(new Date(msg.timestamp), 'HH:mm')}
                        </span>
                        {msg.senderId === currentUser.id && (
                          <CheckCheck size={12} className={cn(
                            msg.read ? "text-primary" : "text-on-surface-variant opacity-40"
                          )} />
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                    <MessageSquare size={48} />
                    <p className="text-sm font-bold uppercase tracking-widest">
                      {student.messages.length > 0 ? 'Nenhuma mensagem corresponde aos filtros' : 'Sem mensagens ainda'}
                    </p>
                  </div>
                )}
                {remoteTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col mr-auto items-start max-w-[85%]"
                  >
                    <div className="bg-surface-container-low border border-outline p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <motion.span 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary" 
                      />
                      <motion.span 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary" 
                      />
                      <motion.span 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary" 
                      />
                    </div>
                    <span className="text-[9px] text-on-surface-variant mt-1 px-1 font-bold uppercase tracking-widest opacity-60">
                      {remoteTypingRole === 'Aluno' ? student.name : remoteTypingRole} está digitando
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-outline bg-surface-container-low space-y-4">
              {currentUser.role === 'Gerente' && (
                <button 
                  onClick={() => onOpenPaymentModal(student.id)}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 transition-all"
                >
                  <CreditCard size={14} />
                  Enviar Link de Pagamento
                </button>
              )}
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Escreva sua mensagem..."
                  value={messageText}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="w-full bg-surface-container border border-outline rounded-2xl pl-5 pr-14 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!messageText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="kinetic-gradient p-8 rounded-3xl space-y-6 shadow-2xl shadow-primary/20 kinetic-glow animate-float">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Taxa de Presença</h3>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                {attendanceStats.present} de {student.attendance.length} aulas
              </span>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceStats.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#FFFFFF" />
                      <Cell fill="rgba(255, 255, 255, 0.2)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-headline font-black leading-none">{attendanceStats.rate}%</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <p className="text-2xl font-headline font-black">
                    {attendanceStats.rate >= 90 ? 'Excelente' : attendanceStats.rate >= 75 ? 'Bom' : 'Abaixo da Média'}
                  </p>
                  <p className="text-white/60 text-xs font-medium">
                    {attendanceStats.present} presenças e {attendanceStats.absent} faltas registradas.
                  </p>
                </div>
                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${attendanceStats.rate}%` }}
                    className="h-full bg-white" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container p-8 rounded-3xl border border-outline space-y-6 kinetic-glow">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Documentos</h3>
            <div className="space-y-4">
              <DocItem label="Contrato de Matrícula" date="15/01/2024" />
              <DocItem label="Termo de Responsabilidade" date="15/01/2024" />
              <DocItem label="Atestado Médico" date="20/02/2024" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Modal */}
      <AnimatePresence>
        {showPerformanceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface-container w-full max-w-lg rounded-[40px] border border-outline p-8 shadow-2xl space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-headline font-black uppercase tracking-tight">Registrar Performance</h3>
                  <p className="text-on-surface-variant text-sm">Acompanhe a evolução técnica do aluno.</p>
                </div>
                <button 
                  onClick={() => setShowPerformanceModal(false)}
                  className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-outline/10 transition-all"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="relative z-10 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Data da Avaliação</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                      <input 
                        type="date"
                        value={perfDate}
                        onChange={(e) => setPerfDate(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Pontuação (0-100)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={perfScore}
                        onChange={(e) => setPerfScore(Number(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-lg font-headline font-black text-primary w-10 text-center">{perfScore}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Modalidade Principal</label>
                  <select 
                    value={perfModality}
                    onChange={(e) => {
                      setPerfModality(e.target.value);
                      setPerfSubModalities([]);
                      setPerfSubSearch('');
                      setShowSubModalitiesDropdown(false);
                    }}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="">Selecione uma modalidade</option>
                    {/* Combine hardcoded config keys with dynamic modalities */}
                    {Array.from(new Set([...Object.keys(MODALITIES_CONFIG), ...modalities])).map(mod => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                </div>

                {perfModality && MODALITIES_CONFIG[perfModality] && MODALITIES_CONFIG[perfModality].length > 0 && (
                  <div className="space-y-3 relative">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Subcategorias</label>
                    <div 
                      onClick={() => setShowSubModalitiesDropdown(!showSubModalitiesDropdown)}
                      className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm cursor-pointer min-h-[48px] flex flex-wrap gap-2 items-center"
                    >
                      {perfSubModalities.length === 0 ? (
                        <span className="text-on-surface-variant/50">Selecione as subcategorias...</span>
                      ) : (
                        perfSubModalities.map(sub => (
                          <span key={sub} className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-lg border border-primary/20 flex items-center gap-1">
                            {sub}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPerfSubModalities(perfSubModalities.filter(s => s !== sub));
                              }}
                              className="hover:text-primary/70"
                            >
                              <XCircle size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    <AnimatePresence>
                      {showSubModalitiesDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-20 top-full left-0 right-0 mt-2 bg-surface-container border border-outline rounded-2xl shadow-2xl overflow-hidden"
                        >
                          <div className="p-3 border-bottom border-outline bg-surface-container-high flex items-center gap-2">
                            <Search size={14} className="text-on-surface-variant" />
                            <input 
                              type="text"
                              placeholder="Buscar subcategoria..."
                              value={perfSubSearch}
                              onChange={(e) => setPerfSubSearch(e.target.value)}
                              className="bg-transparent border-none outline-none text-[10px] w-full"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto p-2 custom-scrollbar">
                            <div className="flex justify-between p-2 mb-2 border-bottom border-outline/10">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const filtered = MODALITIES_CONFIG[perfModality]?.filter(sub => 
                                    sub.toLowerCase().includes(perfSubSearch.toLowerCase())
                                  ) || [];
                                  setPerfSubModalities(prev => [...new Set([...prev, ...filtered])]);
                                }}
                                className="text-[9px] font-bold text-primary uppercase hover:underline"
                              >
                                Selecionar Filtrados
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPerfSubModalities([]);
                                }}
                                className="text-[9px] font-bold text-on-surface-variant uppercase hover:underline"
                              >
                                Limpar
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                              {MODALITIES_CONFIG[perfModality]
                                ?.filter(sub => sub.toLowerCase().includes(perfSubSearch.toLowerCase()))
                                .map(sub => (
                                <button
                                  key={sub}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (perfSubModalities.includes(sub)) {
                                      setPerfSubModalities(perfSubModalities.filter(s => s !== sub));
                                    } else {
                                      setPerfSubModalities([...perfSubModalities, sub]);
                                    }
                                  }}
                                  className={cn(
                                    "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-left flex items-center justify-between",
                                    perfSubModalities.includes(sub)
                                      ? "bg-primary/10 text-primary"
                                      : "hover:bg-surface-container-high text-on-surface-variant"
                                  )}
                                >
                                  {sub}
                                  {perfSubModalities.includes(sub) && <CheckCircle2 size={14} />}
                                </button>
                              ))}
                              
                              {perfSubSearch && !MODALITIES_CONFIG[perfModality]?.some(sub => sub.toLowerCase() === perfSubSearch.toLowerCase()) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!perfSubModalities.includes(perfSubSearch)) {
                                      setPerfSubModalities([...perfSubModalities, perfSubSearch]);
                                    }
                                    setPerfSubSearch('');
                                  }}
                                  className="px-3 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-left flex items-center gap-2 text-primary bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/30 mt-2"
                                >
                                  <Plus size={14} />
                                  Adicionar "{perfSubSearch}"
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <button 
                  onClick={handleSavePerformance}
                  className="w-full bg-primary text-on-primary py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-[0.98] shadow-xl shadow-primary/20 kinetic-glow"
                >
                  Salvar Performance
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteNoteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface-container-high border border-outline rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <Trash2 size={40} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-headline font-black uppercase tracking-tight">Excluir Nota?</h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => {
                      setShowDeleteNoteModal(false);
                      setNoteToDeleteId(null);
                    }}
                    className="flex-1 px-6 py-4 rounded-2xl bg-surface-container border border-outline text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDeleteNote}
                    className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Details Modal */}
      <AnimatePresence>
        {isPaymentDetailsModalOpen && selectedPayment && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentDetailsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl relative z-10 glass-panel"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    selectedPayment.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" :
                    selectedPayment.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                    "bg-red-500/10 text-red-500"
                  )}>
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-black uppercase">Detalhes do Pagamento</h2>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">ID: {selectedPayment.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPaymentDetailsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <XCircle size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Valor</p>
                    <p className="text-xl font-headline font-black text-primary">R$ {selectedPayment.amount.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Status</p>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                      selectedPayment.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" :
                      selectedPayment.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                      "bg-red-500/10 text-red-500"
                    )}>
                      {selectedPayment.status === 'paid' ? 'Pago' : selectedPayment.status === 'pending' ? 'Pendente' : 'Atrasado'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-outline/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Data</span>
                    <span className="text-sm font-bold">{format(new Date(selectedPayment.date + 'T12:00:00'), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-outline/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Método</span>
                    <span className="text-sm font-bold">{selectedPayment.method}</span>
                  </div>
                  <div className="space-y-2 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Descrição</span>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {selectedPayment.description || 'Nenhuma descrição fornecida.'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsPaymentDetailsModalOpen(false)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modality Editing Modal */}
      <AnimatePresence>
        {isEditingInfo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingInfo(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl relative z-10 glass-panel max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-black uppercase">Editar Perfil</h2>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Informações pessoais de {student.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingInfo(false)}
                  className="p-2 rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <XCircle size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputGroup 
                    label="Nome Completo" 
                    value={editInfoData.name}
                    onChange={(e) => {
                      setEditInfoData(prev => ({ ...prev, name: e.target.value }));
                      validateInfoField('name', e.target.value);
                    }}
                    error={infoErrors.name}
                  />
                </div>
                <InputGroup 
                  label="E-mail" 
                  type="email"
                  value={editInfoData.email}
                  onChange={(e) => {
                    setEditInfoData(prev => ({ ...prev, email: e.target.value }));
                    validateInfoField('email', e.target.value);
                  }}
                  error={infoErrors.email}
                />
                <InputGroup 
                  label="Telefone" 
                  value={editInfoData.contact}
                  onChange={(e) => {
                    setEditInfoData(prev => ({ ...prev, contact: e.target.value }));
                    validateInfoField('contact', e.target.value);
                  }}
                  error={infoErrors.contact}
                />
                <InputGroup 
                  label="Documento (CPF/CNPJ)" 
                  value={editInfoData.document}
                  onChange={(e) => {
                    setEditInfoData(prev => ({ ...prev, document: e.target.value }));
                    validateInfoField('document', e.target.value);
                  }}
                  error={infoErrors.document}
                />
                <InputGroup 
                  label="Data de Nascimento" 
                  type="date"
                  value={editInfoData.birthDate}
                  onChange={(e) => setEditInfoData(prev => ({ ...prev, birthDate: e.target.value }))}
                />
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <InputGroup 
                      label="Logradouro" 
                      value={editInfoData.street}
                      onChange={(e) => {
                        setEditInfoData(prev => ({ ...prev, street: e.target.value }));
                        validateInfoField('street', e.target.value);
                      }}
                      error={infoErrors.street}
                    />
                  </div>
                  <InputGroup 
                    label="Número" 
                    value={editInfoData.number}
                    onChange={(e) => {
                      setEditInfoData(prev => ({ ...prev, number: e.target.value }));
                      validateInfoField('number', e.target.value);
                    }}
                    error={infoErrors.number}
                  />
                  <InputGroup 
                    label="Complemento" 
                    value={editInfoData.complement}
                    onChange={(e) => setEditInfoData(prev => ({ ...prev, complement: e.target.value }))}
                  />
                  <InputGroup 
                    label="Bairro" 
                    value={editInfoData.neighborhood}
                    onChange={(e) => {
                      setEditInfoData(prev => ({ ...prev, neighborhood: e.target.value }));
                      validateInfoField('neighborhood', e.target.value);
                    }}
                    error={infoErrors.neighborhood}
                  />
                  <InputGroup 
                    label="Cidade" 
                    value={editInfoData.city}
                    onChange={(e) => {
                      setEditInfoData(prev => ({ ...prev, city: e.target.value }));
                      validateInfoField('city', e.target.value);
                    }}
                    error={infoErrors.city}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup 
                      label="Estado" 
                      value={editInfoData.state}
                      onChange={(e) => {
                        setEditInfoData(prev => ({ ...prev, state: e.target.value }));
                        validateInfoField('state', e.target.value);
                      }}
                      error={infoErrors.state}
                    />
                    <InputGroup 
                      label="CEP" 
                      value={editInfoData.zipCode}
                      onChange={(e) => {
                        setEditInfoData(prev => ({ ...prev, zipCode: e.target.value }));
                        validateInfoField('zipCode', e.target.value);
                      }}
                      error={infoErrors.zipCode}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setEditInfoData(prev => ({ ...prev, status: 'active' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        editInfoData.status === 'active' 
                          ? "bg-emerald-500 text-white border-emerald-500" 
                          : "bg-surface-container-low border-outline text-on-surface-variant"
                      )}
                    >
                      Ativo
                    </button>
                    <button 
                      onClick={() => setEditInfoData(prev => ({ ...prev, status: 'inactive' }))}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        editInfoData.status === 'inactive' 
                          ? "bg-red-500 text-white border-red-500" 
                          : "bg-surface-container-low border-outline text-on-surface-variant"
                      )}
                    >
                      Inativo
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tipo de Plano</label>
                  <div className="relative">
                    <select 
                      value={editInfoData.planType}
                      onChange={(e) => setEditInfoData(prev => ({ ...prev, planType: e.target.value as any }))}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10"
                    >
                      <option value="Studio">Studio</option>
                      <option value="WellHub">WellHub</option>
                      <option value="GuruPass">GuruPass</option>
                      <option value="TotalPass">TotalPass</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Plano Contratado</label>
                  <div className="relative">
                    <select 
                      value={editInfoData.contractedPlan}
                      onChange={(e) => setEditInfoData(prev => ({ ...prev, contractedPlan: e.target.value as any }))}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10"
                    >
                      <option value="Mensal">Mensal</option>
                      <option value="Trimestral">Trimestral</option>
                      <option value="Semestral">Semestral</option>
                      <option value="Anual">Anual</option>
                      <option value="Experimental">Experimental</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status de Pagamento</label>
                  <div className="relative">
                    <select 
                      value={editInfoData.paymentStatus}
                      onChange={(e) => setEditInfoData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10"
                    >
                      <option value="paid">Pago</option>
                      <option value="pending">Pendente</option>
                      <option value="overdue">Atrasado</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                  </div>
                </div>
                <InputGroup 
                  label="Data de Adesão" 
                  type="date"
                  value={editInfoData.joinDate}
                  onChange={(e) => setEditInfoData(prev => ({ ...prev, joinDate: e.target.value }))}
                />
              </div>

              <div className="flex gap-4 pt-8">
                <button 
                  onClick={() => setIsEditingInfo(false)}
                  className="flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border border-outline hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveInfo}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isEditingModalities && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingModalities(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl relative z-10 glass-panel max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <Edit size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-black uppercase">Editar Modalidades</h2>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Gerenciar cursos e turmas de {student.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingModalities(false)}
                  className="p-2 rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <XCircle size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Main Modalities */}
                <div className="space-y-4 p-6 bg-surface-container-low rounded-[32px] border border-outline/50">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutGrid size={14} className="text-primary" />
                    <label className="text-xs font-black text-on-surface uppercase tracking-[0.2em]">Modalidades Principais</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {modalities.map(modality => (
                      <button
                        key={modality}
                        type="button"
                        onClick={() => {
                          const isRemoving = editClasses.includes(modality);
                          setEditClasses(prev => 
                            isRemoving ? prev.filter(m => m !== modality) : [...prev, modality]
                          );
                          if (isRemoving) {
                            const predefinedSubs = MODALITIES_CONFIG[modality] || [];
                            setEditSubModalities(prev => prev.filter(s => 
                              !predefinedSubs.includes(s) && !s.startsWith(`[${modality}]`)
                            ));
                          }
                        }}
                        className={cn(
                          "px-6 py-3 rounded-2xl text-xs font-black transition-all border shadow-sm",
                          editClasses.includes(modality)
                            ? getModalityColor(modality) + " ring-2 ring-primary/20"
                            : "bg-surface-container border-outline text-on-surface-variant hover:border-primary/50"
                        )}
                      >
                        {modality}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submodalities */}
                {editClasses.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Tag size={14} className="text-primary" />
                      <label className="text-xs font-black text-on-surface uppercase tracking-[0.2em]">Submodalidades por Categoria</label>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {editClasses.map(modality => {
                        const subModalities = MODALITIES_CONFIG[modality] || [];
                        const isExpanded = expandedEditModalities.includes(modality);

                        return (
                          <div key={modality} className="bg-surface-container-low border border-outline rounded-[32px] overflow-hidden transition-all shadow-sm">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedEditModalities(prev => 
                                  prev.includes(modality) ? prev.filter(m => m !== modality) : [...prev, modality]
                                );
                              }}
                              className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface-container transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner", getModalityColor(modality))}>
                                  {modality.charAt(0)}
                                </div>
                                <div className="text-left">
                                  <span className="text-sm font-black block uppercase tracking-tight">{modality}</span>
                                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                                    {editSubModalities.filter(s => subModalities.includes(s) || s.startsWith(`[${modality}]`)).length} selecionadas
                                  </span>
                                </div>
                              </div>
                              <ChevronDown size={20} className={cn("text-on-surface-variant transition-transform duration-300", isExpanded && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-6 pt-0 space-y-6">
                                    <div className="flex flex-wrap gap-2">
                                      {subModalities.map(sub => (
                                        <button
                                          key={sub}
                                          type="button"
                                          onClick={() => {
                                            setEditSubModalities(prev => 
                                              prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
                                            );
                                          }}
                                          className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                            editSubModalities.includes(sub)
                                              ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                                              : "bg-surface-container border-outline text-on-surface-variant hover:border-primary/50"
                                          )}
                                        >
                                          {sub}
                                        </button>
                                      ))}
                                      {/* Show custom submodalities for this category */}
                                      {editSubModalities.filter(s => s.startsWith(`[${modality}]`)).map(sub => (
                                        <button
                                          key={sub}
                                          type="button"
                                          onClick={() => {
                                            setEditSubModalities(prev => prev.filter(s => s !== sub));
                                          }}
                                          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-primary/10 border-primary/30 text-primary shadow-sm flex items-center gap-2"
                                        >
                                          {sub.replace(`[${modality}] `, '')}
                                          <X size={12} />
                                        </button>
                                      ))}
                                    </div>

                                    {/* Add Custom Submodality */}
                                    <div className="flex gap-2 pt-4 border-t border-outline/30">
                                      <div className="flex-1 relative">
                                        <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                                        <input 
                                          type="text"
                                          placeholder="Adicionar submodalidade personalizada..."
                                          value={customSubInputs[modality] || ''}
                                          onChange={(e) => setCustomSubInputs(prev => ({ ...prev, [modality]: e.target.value }))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const val = customSubInputs[modality]?.trim();
                                              if (val) {
                                                const prefixedVal = `[${modality}] ${val}`;
                                                setEditSubModalities(prev => [...new Set([...prev, prefixedVal])]);
                                                setCustomSubInputs(prev => ({ ...prev, [modality]: '' }));
                                              }
                                            }
                                          }}
                                          className="w-full bg-surface-container border border-outline rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/30"
                                        />
                                      </div>
                                      <button
                                        onClick={() => {
                                          const val = customSubInputs[modality]?.trim();
                                          if (val) {
                                            const prefixedVal = `[${modality}] ${val}`;
                                            setEditSubModalities(prev => [...new Set([...prev, prefixedVal])]);
                                            setCustomSubInputs(prev => ({ ...prev, [modality]: '' }));
                                          }
                                        }}
                                        className="px-4 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                                      >
                                        <Plus size={18} />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Turmas */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Turmas</label>
                  <div className="flex flex-wrap gap-2">
                    {turmas.map(turma => (
                      <button
                        key={turma}
                        type="button"
                        onClick={() => {
                          setEditTurmas(prev => 
                            prev.includes(turma) ? prev.filter(t => t !== turma) : [...prev, turma]
                          );
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          editTurmas.includes(turma)
                            ? getTurmaColor(turma)
                            : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/50"
                        )}
                      >
                        {turma}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setIsEditingModalities(false)}
                    className="flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest border border-outline hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveModalities}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
          {/* Student Digital Card Modal */}
      <StudentDigitalCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        student={student}
        studioName="STYLO URBANO"
      />
    </motion.div>
  );
}

function MessagesScreen({ currentUser }: { currentUser: User }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      const saved = safeStorage.getItem('local_global_messages');
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {
          // ignore
        }
      }
      return;
    }

    const q = query(
      collection(db, 'global_messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'global_messages');
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const msg: Message = {
      id: `gm${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: newMessage,
      type: 'text',
      timestamp: new Date().toISOString(),
      read: false
    };

    if (!auth.currentUser) {
      setMessages(prev => {
        const updated = [...prev, msg];
        safeStorage.setItem('local_global_messages', JSON.stringify(updated));
        return updated;
      });
      setNewMessage('');
      return;
    }

    try {
      await addDoc(collection(db, 'global_messages'), msg);
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'global_messages');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-black uppercase tracking-tight">Mural de Avisos</h2>
          <p className="text-on-surface-variant text-sm font-medium">Comunicação global entre toda a equipe e alunos</p>
        </div>
      </div>

      <div className="flex-1 bg-surface-container rounded-[40px] border border-outline overflow-hidden flex flex-col shadow-2xl glass-panel">
        <div className="p-6 border-b border-outline bg-surface-container-low flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Megaphone size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest">Anúncios do Estúdio</h3>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Canal Aberto</p>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%] sm:max-w-[70%]",
                msg.senderId === currentUser.id ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{msg.senderName}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">• {msg.senderRole}</span>
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.senderId === currentUser.id 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-surface-container-low border border-outline text-on-surface rounded-tl-none"
              )}>
                {msg.text}
              </div>
              <span className="text-[9px] text-on-surface-variant mt-1.5 px-1 font-bold opacity-40">
                {format(new Date(msg.timestamp), 'dd/MM HH:mm')}
              </span>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-outline bg-surface-container-low">
          <div className="relative">
            <input 
              type="text"
              placeholder="Postar um aviso ou mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full bg-surface-container border border-outline rounded-2xl pl-5 pr-14 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/80 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsScreen({ 
  users, 
  setUsers, 
  onResetSetup,
  students,
  setStudents,
  events,
  setEvents,
  modalities,
  setModalities,
  studioLogo,
  setStudioLogo,
  handleSaveToDrive,
  isSavingToDrive,
  onLogout,
  bankInfo,
  onUpdateBankInfo,
  notificationSettings,
  onUpdateNotificationSettings,
  rooms,
  onUpdateRooms,
  storageMode,
  onUpdateStorageMode,
  lastBackupDate,
  onPerformBackup,
  isGoogleConnected = false,
  googleEmail,
  onConnectGoogle = () => {},
  autoBackupSettings = {
    enabled: true,
    frequency: "daily",
    time: "23:00",
    notifyOnFailure: true,
    channels: { push: true, email: true },
    alertEmail: "stylourbanostudio@gmail.com",
    folderName: "Stylo Urbano - Backups"
  },
  onUpdateAutoBackupSettings = async () => {},
  lastBackupStatus,
  lastBackupError,
  currentUserEmail,
  studioName,
  partnerConfig = DEFAULT_PARTNER_CONFIG,
  onUpdatePartnerConfig,
  onCheckIn
}: { 
  users: User[], 
  setUsers: React.Dispatch<React.SetStateAction<User[]>>, 
  onResetSetup: () => void,
  students: Student[],
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>,
  events: ClassEvent[],
  setEvents: React.Dispatch<React.SetStateAction<ClassEvent[]>>,
  modalities: string[],
  setModalities: (newMods: string[]) => void,
  studioLogo: string | null,
  setStudioLogo: (logo: string | null) => void,
  handleSaveToDrive: () => Promise<void>,
  isSavingToDrive: boolean,
  onLogout: () => void,
  bankInfo: { bankName: string; pixKey: string; holderName: string },
  onUpdateBankInfo: (info: { bankName: string; pixKey: string; holderName: string }) => void,
  notificationSettings: any,
  onUpdateNotificationSettings: (settings: any) => void,
  rooms: StudioRoom[],
  onUpdateRooms: (rooms: StudioRoom[]) => void,
  storageMode: "drive" | "local",
  onUpdateStorageMode: (mode: "drive" | "local") => void,
  lastBackupDate: string | null,
  onPerformBackup: () => Promise<void>,
  isGoogleConnected?: boolean,
  googleEmail?: string | null,
  onConnectGoogle?: () => void,
  autoBackupSettings?: AutoBackupConfig,
  onUpdateAutoBackupSettings?: (settings: AutoBackupConfig) => Promise<void>,
  lastBackupStatus?: "success" | "failure" | null,
  lastBackupError?: string | null,
  currentUserEmail?: string,
  studioName?: string,
  partnerConfig?: PartnerConfig,
  onUpdatePartnerConfig?: (config: PartnerConfig) => Promise<void> | void,
  onCheckIn?: (studentId: string, className: string, metadata?: any) => Promise<void> | void
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({ role: 'Instrutor', phone: '' });
  const [newModality, setNewModality] = useState('');
  const [editingModality, setEditingModality] = useState<string | null>(null);
  const [editingModalityValue, setEditingModalityValue] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'backup' | 'instrutores' | 'whatsapp' | 'smsGateway' | 'sms' | 'financeiro' | 'parceiros'>('geral');
  const [showSmsSecret, setShowSmsSecret] = useState(false);
  const [selectedSmsTemplateKey, setSelectedSmsTemplateKey] = useState<'paymentDue' | 'upcomingClasses' | 'overduePayment' | 'promotions'>('paymentDue');
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<User | null>(null);
  const [tempBankInfo, setTempBankInfo] = useState(bankInfo);
  const [tempNotificationSettings, setTempNotificationSettings] = useState(() => ({
    ...notificationSettings,
    smsProvider: {
      enabled: true,
      name: 'Twilio',
      apiKey: '',
      apiSecret: '',
      fromNumber: '',
      ...notificationSettings?.smsProvider
    },
    smsTemplates: {
      ...DEFAULT_SMS_TEMPLATES,
      ...notificationSettings?.smsTemplates
    }
  }));
  const [tempRooms, setTempRooms] = useState<StudioRoom[]>(rooms);

  useEffect(() => {
    setTempBankInfo(bankInfo);
  }, [bankInfo]);

  useEffect(() => {
    if (notificationSettings) {
      setTempNotificationSettings({
        ...notificationSettings,
        smsProvider: {
          enabled: true,
          name: 'Twilio',
          apiKey: '',
          apiSecret: '',
          fromNumber: '',
          ...notificationSettings?.smsProvider
        },
        smsTemplates: {
          ...DEFAULT_SMS_TEMPLATES,
          ...notificationSettings?.smsTemplates
        }
      });
    }
  }, [notificationSettings]);

  useEffect(() => {
    setTempRooms(rooms);
  }, [rooms]);
  const [instructorData, setInstructorData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    specialties: [] as string[],
    schedules: [] as { day: string; start: string; end: string }[],
    preferredDays: [] as string[]
  });

  const handleExportBackup = () => {
    const backupData = {
      users,
      students,
      events,
      modalities,
      rooms,
      bankInfo,
      notificationSettings,
      timestamp: new Date().toISOString(),
      version: '1.1'
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-estudio-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup exportado localmente!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.users && data.students && data.events) {
          if (confirm('Isso irá substituir os dados atuais. Deseja continuar?')) {
            setUsers(data.users);
            setStudents(data.students);
            setEvents(data.events);
            if (data.modalities) setModalities(data.modalities);
            toast.success('Dados restaurados com sucesso!');
          }
        } else {
          toast.error('Arquivo de backup inválido');
        }
      } catch (err) {
        toast.error('Erro ao ler o arquivo de backup');
      }
    };
    reader.readAsText(file);
  };

  const handleShareApp = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Sistema de Gestão de Estúdio',
        text: 'Acesse o sistema de gestão do estúdio aqui:',
        url: url
      }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleExportToExcel = (type: 'students' | 'instructors') => {
    let dataToExport: any[] = [];
    let fileName = '';

    if (type === 'students') {
      dataToExport = students.map(s => ({
        'Nome': s.name,
        'Email': s.email,
        'Telefone': s.contact,
        'Status': s.status === 'active' ? 'Ativo' : 'Inativo',
        'Plano': s.planType,
        'Data de Adesão': format(new Date(s.joinDate), 'dd/MM/yyyy')
      }));
      fileName = 'alunos-estudio.csv';
    } else {
      dataToExport = users.filter(u => u.role === 'Instrutor').map(i => ({
        'Nome': i.name,
        'Email': i.email,
        'Status': 'Ativo'
      }));
      fileName = 'instrutores-estudio.csv';
    }

    if (dataToExport.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    // Creating CSV as a simple alternative to Excel for browser compatibility
    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório exportado com sucesso!');
  };
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newSchedule, setNewSchedule] = useState({ day: 'Segunda', start: '08:00', end: '09:00' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 in Firestore doc
        toast.error('O logo deve ter menos de 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudioLogo(reader.result as string);
        toast.success('Logo atualizado!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isNewUser: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isNewUser) {
          setNewUser(prev => ({ ...prev, avatar: reader.result as string }));
        } else {
          setInstructorData(prev => ({ ...prev, avatar: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInstructor = async () => {
    if (!instructorData.name || !instructorData.email) {
      toast.error('Nome e Email são obrigatórios');
      return;
    }

    try {
      if (editingInstructor) {
        const updatedUser = {
          ...editingInstructor,
          name: instructorData.name,
          email: instructorData.email,
          phone: instructorData.phone,
          avatar: instructorData.avatar || editingInstructor.avatar,
          specialties: instructorData.specialties,
          schedules: instructorData.schedules,
          preferredDays: instructorData.preferredDays
        };
        await updateDoc(doc(db, 'users', editingInstructor.id), updatedUser);
        setUsers(users.map(u => u.id === editingInstructor.id ? updatedUser : u));
        toast.success('Instrutor atualizado!');
      } else {
        const newUser: User = {
          id: `u${Date.now()}`,
          name: instructorData.name,
          email: instructorData.email,
          phone: instructorData.phone,
          role: 'Instrutor',
          avatar: instructorData.avatar || `https://i.pravatar.cc/150?u=${instructorData.email}`,
          password: 'Vemdançar',
          mustChangePassword: true,
          specialties: instructorData.specialties,
          schedules: instructorData.schedules,
          preferredDays: instructorData.preferredDays
        };
        await setDoc(doc(db, 'users', newUser.id), newUser);
        setUsers([...users, newUser]);
        
        // Send welcome email
        await sendWelcomeEmail({
          to: newUser.email,
          name: newUser.name,
          role: newUser.role,
          login: newUser.email,
          password: 'Vemdançar',
          phone: newUser.phone
        });
        
        toast.success('Instrutor cadastrado e e-mail enviado!');
      }
      setIsInstructorModalOpen(false);
      setEditingInstructor(null);
      setInstructorData({ name: '', email: '', phone: '', avatar: '', specialties: [], schedules: [], preferredDays: [] });
    } catch (error) {
      console.error("Error saving instructor:", error);
      toast.error("Erro ao salvar instrutor");
    }
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !instructorData.specialties.includes(newSpecialty.trim())) {
      setInstructorData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const handleAddSchedule = () => {
    setInstructorData(prev => ({
      ...prev,
      schedules: [...prev.schedules, { ...newSchedule }]
    }));
  };

  const handleRemoveSchedule = (index: number) => {
    setInstructorData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async () => {
    if (newUser.name && newUser.email && newUser.role) {
      // Single Gerente check
      if (newUser.role === 'Gerente') {
        const hasGerente = users.some(u => u.role === 'Gerente');
        if (hasGerente) {
          toast.error('Já existe um Gerente cadastrado. O sistema permite apenas um Gerente.');
          return;
        }
      }

      // Single Recepcionista check
      if (newUser.role === 'Recepcionista') {
        const hasRecepcionista = users.some(u => u.role === 'Recepcionista');
        if (hasRecepcionista) {
          toast.error('Já existe um Recepcionista cadastrado. O sistema permite apenas um.');
          return;
        }
      }

      // Single Auxiliar de Gerência check
      if (newUser.role === 'Auxiliar de Gerência') {
        const hasAuxiliar = users.some(u => u.role === 'Auxiliar de Gerência');
        if (hasAuxiliar) {
          toast.error('Já existe um Auxiliar de Gerência cadastrado. O sistema permite apenas um.');
          return;
        }
      }

      try {
        const user: User = {
          id: `u${Date.now()}`,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role as UserRole,
          avatar: newUser.avatar || `https://i.pravatar.cc/150?u=${newUser.email}`,
          password: 'Vemdançar',
          mustChangePassword: true
        };
        await setDoc(doc(db, 'users', user.id), user);
        setUsers([...users, user]);
        
        // Send welcome email
        await sendWelcomeEmail({
          to: user.email,
          name: user.name,
          role: user.role,
          login: user.email,
          password: 'Vemdançar',
          phone: user.phone
        });

        setIsAddingUser(false);
        setNewUser({ role: 'Instrutor', phone: '' });
        toast.success('Usuário adicionado e e-mail enviado!');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'users');
      }
    } else {
      toast.error('Preencha todos os campos obrigatórios');
    }
  };

  const handleAddModality = () => {
    if (newModality.trim()) {
      if (modalities.includes(newModality.trim())) {
        toast.error('Esta modalidade já existe');
        return;
      }
      setModalities([...modalities, newModality.trim()]);
      setNewModality('');
      toast.success('Modalidade adicionada!');
    }
  };

  const handleRemoveModality = (mod: string) => {
    if (confirm(`Deseja remover a modalidade "${mod}"?`)) {
      setModalities(modalities.filter(m => m !== mod));
      toast.success('Modalidade removida');
    }
  };

  const handleEditModality = (oldMod: string) => {
    if (editingModalityValue.trim() && editingModalityValue.trim() !== oldMod) {
      if (modalities.includes(editingModalityValue.trim())) {
        toast.error('Esta modalidade já existe');
        return;
      }
      const newMods = modalities.map(m => m === oldMod ? editingModalityValue.trim() : m);
      setModalities(newMods);
      setEditingModality(null);
      toast.success('Modalidade atualizada!');
    } else {
      setEditingModality(null);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (confirm(`Deseja resetar a senha de ${user.name} para a senha padrão "Vemdançar"?`)) {
      try {
        await updateDoc(doc(db, 'users', user.id), {
          password: 'Vemdançar',
          mustChangePassword: true
        });
        await sendPasswordResetEmail(user.email, user.name, 'Vemdançar');
        toast.success(`Senha de ${user.name} resetada com sucesso!`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'users');
      }
    }
  };
  const handleDeleteUser = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        setUsers(users.filter(u => u.id !== id));
        toast.success('Usuário removido');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'users');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-black tracking-tighter">Configurações</h1>
          <p className="text-on-surface-variant text-sm mt-2">Gerencie sua equipe, permissões e preferências do sistema.</p>
        </div>
        <button 
          onClick={onResetSetup}
          className="px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
        >
          Reiniciar Configuração Inicial
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-outline pb-4">
        <button 
          onClick={() => setActiveTab('geral')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0",
            activeTab === 'geral' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-white/5"
          )}
        >
          Geral
        </button>
        <button 
          onClick={() => setActiveTab('backup')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 flex items-center gap-1.5",
            activeTab === 'backup' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-white/5"
          )}
        >
          <Cloud size={14} />
          <span>Backup & Google Drive</span>
        </button>
        <button 
          onClick={() => setActiveTab('instrutores')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'instrutores' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-white/5"
          )}
        >
          Instrutores
        </button>
        <button 
          onClick={() => setActiveTab('whatsapp')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 flex items-center gap-1.5",
            activeTab === 'whatsapp' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-on-surface-variant hover:bg-white/5"
          )}
        >
          <MessageSquare size={14} className="text-emerald-400" />
          <span>WhatsApp & API (Lembretes)</span>
        </button>
        <button 
          onClick={() => setActiveTab('smsGateway')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 flex items-center gap-1.5",
            activeTab === 'smsGateway' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-on-surface-variant hover:bg-white/5"
          )}
        >
          <Smartphone size={14} className="text-sky-400" />
          <span>SMS & Twilio</span>
        </button>
        <button 
          onClick={() => setActiveTab('sms')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 flex items-center gap-1.5",
            activeTab === 'sms' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-white/5"
          )}
        >
          <Bell size={14} />
          <span>Regras de Notificação</span>
        </button>
        <button 
          onClick={() => setActiveTab('financeiro')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'financeiro' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-white/5"
          )}
        >
          Financeiro
        </button>
        <button 
          onClick={() => setActiveTab('parceiros')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 flex items-center gap-1.5",
            activeTab === 'parceiros' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-on-surface-variant hover:bg-white/5"
          )}
        >
          <Zap size={14} className="text-amber-400" />
          <span>Wellhub, GuruPass & TotalPass</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'geral' && (
          <motion.div 
            key="geral"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel kinetic-glow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <LayoutGrid size={24} className="text-primary" />
                Gestão de Modalidades
              </h2>
            </div>
            
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newModality}
                onChange={(e) => setNewModality(e.target.value)}
                placeholder="Nova modalidade (ex: Yoga, Pilates)..."
                className="flex-1 bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAddModality()}
              />
              <button 
                onClick={handleAddModality}
                className="p-4 bg-primary text-white rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {modalities.map(mod => (
                <div 
                  key={mod} 
                  className="group flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-primary/20 hover:bg-primary/20 transition-all"
                >
                  {editingModality === mod ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={editingModalityValue}
                        onChange={(e) => setEditingModalityValue(e.target.value)}
                        className="bg-transparent border-b border-primary outline-none w-24"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditModality(mod);
                          if (e.key === 'Escape') setEditingModality(null);
                        }}
                      />
                      <button onClick={() => handleEditModality(mod)} className="text-emerald-500">
                        <CheckCircle2 size={14} />
                      </button>
                      <button onClick={() => setEditingModality(null)} className="text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span onClick={() => {
                        setEditingModality(mod);
                        setEditingModalityValue(mod);
                      }} className="cursor-pointer hover:underline">
                        {mod}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingModality(mod);
                            setEditingModalityValue(mod);
                          }}
                          className="text-primary/50 hover:text-primary transition-colors"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleRemoveModality(mod)}
                          className="text-primary/50 hover:text-red-500 transition-colors"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel kinetic-glow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Users size={24} className="text-primary" />
                Gerenciamento de Equipe
              </h2>
              <button 
                onClick={() => setIsAddingUser(true)}
                className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-container-low border border-outline rounded-2xl pl-12 pr-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-4">
              {filteredUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-outline group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-xl border border-outline" />
                    <div>
                      <h4 className="font-bold text-sm">{user.name}</h4>
                      <p className="text-xs text-on-surface-variant">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                      user.role === 'Gerente' ? "bg-primary/10 text-primary" : "bg-white/10 text-on-surface-variant"
                    )}>
                      {user.role}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleResetPassword(user)}
                        className="p-2 text-on-surface-variant hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        title="Resetar Senha"
                      >
                        <RefreshCw size={16} />
                      </button>
                      {user.role !== 'Gerente' && (
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-on-surface-variant hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Excluir Usuário"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-6 glass-panel kinetic-glow">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Identidade Visual</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-outline flex items-center justify-center overflow-hidden bg-surface-container-low group relative">
                {studioLogo ? (
                  <>
                    <img src={studioLogo} alt="Studio Logo" className="w-full h-full object-contain p-2" />
                    <button 
                      onClick={() => setStudioLogo(null)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <ImageIcon size={32} className="text-on-surface-variant/30" />
                )}
              </div>
              <input 
                type="file" 
                ref={logoInputRef} 
                onChange={handleLogoUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => logoInputRef.current?.click()}
                className="w-full py-4 rounded-2xl bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Upload size={14} />
                {studioLogo ? 'Alterar Logo' : 'Upload Logo'}
              </button>
            </div>
          </div>

          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-6 glass-panel kinetic-glow">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Backup & Google Drive</h3>
              {autoBackupSettings.enabled ? (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20">
                  Automático ({autoBackupSettings.frequency})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-surface-container-high text-on-surface-variant">
                  Manual
                </span>
              )}
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <RefreshCw size={20} className={cn(isSavingToDrive && "animate-spin")} />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Última Sincronização</h4>
                <p className="text-xs font-bold text-on-surface">
                  {lastBackupDate ? format(new Date(lastBackupDate), "dd MMM, yyyy 'às' HH:mm", { locale: ptBR }) : "Nunca realizado"}
                </p>
                <p className="text-[9px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {isGoogleConnected ? `Google Drive conectado (${googleEmail || "Ativo"})` : "Conecte sua conta Google"}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => setActiveTab("backup")}
                className="w-full py-3.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Cloud size={14} />
                <span>Configurar Backup Automático & Alertas</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleExportBackup}
                  className="py-3 rounded-2xl border border-outline bg-surface-container-low text-[10px] font-bold uppercase tracking-widest hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
                >
                  <Download size={13} className="text-primary" />
                  <span>Download JSON</span>
                </button>
                <button 
                  onClick={handleSaveToDrive}
                  disabled={isSavingToDrive || !isGoogleConnected}
                  className="py-3 rounded-2xl border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={cn(isSavingToDrive && "animate-spin")} />
                  <span>Salvar Agora</span>
                </button>
              </div>
            </div>
          </div>
          </div>

          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-6 glass-panel kinetic-glow">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Exportar para Excel</h3>
            <div className="space-y-3">
              <button 
                onClick={() => handleExportToExcel('students')}
                className="w-full py-4 rounded-2xl border border-outline bg-surface-container-low text-[10px] font-bold uppercase tracking-widest hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={14} className="text-emerald-500" />
                Exportar Alunos
              </button>
              <button 
                onClick={() => handleExportToExcel('instructors')}
                className="w-full py-4 rounded-2xl border border-outline bg-surface-container-low text-[10px] font-bold uppercase tracking-widest hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={14} className="text-emerald-500" />
                Exportar Professores
              </button>
            </div>
          </div>

          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-6 glass-panel kinetic-glow">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Compartilhar Sistema</h3>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Compartilhe o link do sistema para gerenciar de outros dispositivos.
            </p>
            <button 
              onClick={handleShareApp}
              className="w-full py-4 rounded-2xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Share2 size={14} />
              Compartilhar Link
            </button>
          </div>

          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-6 glass-panel kinetic-glow">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Sair do Sistema</h3>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Encerre sua sessão atual com segurança.
            </p>
            <button 
              onClick={onLogout}
              className="w-full py-4 rounded-2xl border border-red-500/30 bg-red-500/5 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
            >
              <XCircle size={14} />
              Sair da Conta
            </button>
          </div>

          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-6 glass-panel kinetic-glow">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Ferramentas de Teste</h3>
            <div className="space-y-4">
              <button 
                onClick={() => {
                  // Generate 5 random students
                  const newStudents: Student[] = Array.from({ length: 5 }).map((_, i) => ({
                    id: `test-s-${Date.now()}-${i}`,
                    name: `Aluno Teste ${i + 1}`,
                    email: `teste${i + 1}@exemplo.com`,
                    contact: `(11) 99999-000${i}`,
                    address: 'Rua de Teste, 123',
                    document: '000.000.000-00',
                    classes: ['Hip Hop', 'Jazz'],
                    turmas: ['Turma Tarde'],
                    status: 'active',
                    paymentStatus: i % 2 === 0 ? 'paid' : 'pending',
                    birthDate: '2000-01-01',
                    joinDate: format(new Date(), 'yyyy-MM-dd'),
                    attendance: [],
                    feedbacks: [],
                    performance: [],
                    messages: [],
                    notes: [],
                    isFavorite: false,
                    planType: 'Studio',
                    contractedPlan: 'Mensal'
                  }));
                  setStudents(prev => [...newStudents, ...prev]);
                  toast.success('5 alunos de teste gerados!');
                }}
                className="w-full py-4 rounded-2xl border border-outline bg-surface-container-low text-[10px] font-bold uppercase tracking-widest hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <Wand2 size={14} className="text-primary" />
                Gerar Alunos de Teste
              </button>

              <button 
                onClick={() => {
                  // Generate 3 random events
                  const newEvents: ClassEvent[] = Array.from({ length: 3 }).map((_, i) => ({
                    id: `test-e-${Date.now()}-${i}`,
                    title: `Aula de Teste ${i + 1}`,
                    instructor: 'Instrutor Teste',
                    instructorEmail: `instrutor${i + 1}@exemplo.com`,
                    time: `${14 + i}:00`,
                    date: new Date(),
                    capacity: 20,
                    enrolled: Math.floor(Math.random() * 15),
                    category: 'Urban',
                    type: 'Aula',
                    status: 'Confirmado'
                  }));
                  setEvents(prev => [...prev, ...newEvents]);
                  toast.success('3 aulas de teste geradas!');
                }}
                className="w-full py-4 rounded-2xl border border-outline bg-surface-container-low text-[10px] font-bold uppercase tracking-widest hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={14} className="text-primary" />
                Gerar Aulas de Teste
              </button>
            </div>
          </div>

          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-6 glass-panel kinetic-glow">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Níveis de Acesso</h3>
            <div className="space-y-4">
              <AccessLevelItem role="Gerente" description="Acesso total ao sistema, configurações e financeiro (Máx 1)." />
              <AccessLevelItem role="Recepcionista" description="Gerenciamento de alunos, matrículas e agenda (Máx 1)." />
              <AccessLevelItem role="Auxiliar de Gerência" description="Suporte administrativo com funções limitadas (Máx 1)." />
              <AccessLevelItem role="Instrutor" description="Visualização de agenda, frequência e feedbacks." />
              <AccessLevelItem role="Aluno" description="Acesso ao perfil, mensagens e sua própria agenda." />
            </div>
          </div>
      </motion.div>
    )}

      {activeTab === 'backup' && (
        <motion.div 
          key="backup"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-6"
        >
          <GoogleDriveBackupSettings
            isGoogleConnected={isGoogleConnected}
            googleEmail={googleEmail}
            onConnectGoogle={onConnectGoogle}
            lastBackupDate={lastBackupDate}
            lastBackupStatus={lastBackupStatus}
            lastBackupError={lastBackupError}
            autoBackupSettings={autoBackupSettings}
            onSaveAutoBackupSettings={onUpdateAutoBackupSettings}
            onExecuteDriveBackup={handleSaveToDrive}
            isBackingUp={isSavingToDrive}
            onExportLocalBackup={handleExportBackup}
            onImportLocalBackup={handleImportBackup}
            currentUserEmail={currentUserEmail}
            studioName={studioName}
          />
        </motion.div>
      )}

      {activeTab === 'instrutores' && (
        <motion.div 
          key="instrutores"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-8"
        >
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel kinetic-glow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <UserCircle size={24} className="text-primary" />
                  Gestão de Instrutores
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">Cadastre e gerencie a equipe técnica do estúdio.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingInstructor(null);
                  setInstructorData({ name: '', email: '', phone: '', avatar: '', specialties: [], schedules: [], preferredDays: [] });
                  setIsInstructorModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
              >
                <Plus size={16} />
                Novo Instrutor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {users.filter(u => u.role === 'Instrutor').map(instructor => (
                <div key={instructor.id} className="bg-surface-container-low p-6 rounded-[32px] border border-outline group hover:border-primary/30 transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={instructor.avatar} alt={instructor.name} className="w-12 h-12 rounded-2xl border border-outline" />
                      <div>
                        <h4 className="font-bold text-sm">{instructor.name}</h4>
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">{instructor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleResetPassword(instructor)}
                        className="p-2 hover:bg-primary/10 rounded-xl text-on-surface-variant hover:text-primary transition-colors"
                        title="Resetar Senha"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingInstructor(instructor);
                          setInstructorData({
                            name: instructor.name,
                            email: instructor.email,
                            phone: instructor.phone || '',
                            avatar: instructor.avatar || '',
                            specialties: instructor.specialties || [],
                            schedules: instructor.schedules || [],
                            preferredDays: instructor.preferredDays || []
                          });
                          setIsInstructorModalOpen(true);
                        }}
                        className="p-2 hover:bg-primary/10 rounded-xl text-on-surface-variant hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(instructor.id)}
                        className="p-2 hover:bg-red-500/10 rounded-xl text-on-surface-variant hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Especialidades</p>
                      <div className="flex flex-wrap gap-1.5">
                        {instructor.specialties && instructor.specialties.length > 0 ? (
                          instructor.specialties.map(spec => (
                            <span key={spec} className="px-2 py-0.5 bg-primary/5 text-primary text-[8px] font-bold uppercase rounded-md border border-primary/10">
                              {spec}
                            </span>
                          ))
                        ) : (
                          <span className="text-[8px] text-on-surface-variant opacity-50 italic">Nenhuma especialidade</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Horários Fixos</p>
                      <div className="space-y-1">
                        {instructor.schedules && instructor.schedules.length > 0 ? (
                          instructor.schedules.map((sched, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[9px] font-bold text-on-surface-variant">
                              <span>{sched.day}</span>
                              <span className="text-primary">{sched.start} - {sched.end}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[8px] text-on-surface-variant opacity-50 italic">Nenhum horário definido</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'whatsapp' && (
        <motion.div 
          key="whatsapp"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-8"
        >
          <WhatsAppIntegrationSettings
            config={tempNotificationSettings?.whatsAppConfig || notificationSettings?.whatsAppConfig || DEFAULT_WHATSAPP_CONFIG}
            onSaveConfig={async (newWppConfig) => {
              const updated = {
                ...tempNotificationSettings,
                whatsAppConfig: newWppConfig
              };
              setTempNotificationSettings(updated);
              await onUpdateNotificationSettings(updated);
            }}
            students={students}
            events={events}
            bankInfo={tempBankInfo || bankInfo}
            studioName={studioName}
          />
        </motion.div>
      )}

      {activeTab === 'smsGateway' && (
        <motion.div 
          key="smsGateway"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-8"
        >
          <SMSIntegrationSettings
            smsConfig={tempNotificationSettings?.smsProvider || notificationSettings?.smsProvider || {
              enabled: true,
              name: 'Twilio',
              apiKey: '',
              apiSecret: '',
              fromNumber: ''
            }}
            smsTemplates={tempNotificationSettings?.smsTemplates || notificationSettings?.smsTemplates}
            whatsAppTemplates={tempNotificationSettings?.whatsAppConfig?.templates}
            studioName={studioName}
            onSaveConfig={async (newConfig, newTemplates) => {
              const updated = {
                ...tempNotificationSettings,
                smsProvider: newConfig,
                smsTemplates: newTemplates,
                templates: {
                  ...tempNotificationSettings.templates,
                  paymentDue: newTemplates.paymentDue,
                  upcomingClasses: newTemplates.upcomingClasses,
                  promotions: newTemplates.promotions
                }
              };
              setTempNotificationSettings(updated);
              await onUpdateNotificationSettings(updated);
            }}
          />
        </motion.div>
      )}

      {activeTab === 'sms' && (
        <motion.div 
          key="sms"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-8"
        >
          <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel kinetic-glow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <Bell size={24} className="text-primary" />
                  Regras de Notificação
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">Configure o envio automático de lembretes e avisos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-3xl flex flex-col justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 mt-0.5">
                    <Key size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      WhatsApp API & Templates
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black">
                        {tempNotificationSettings?.whatsAppConfig?.enabled ?? true ? 'Ativo' : 'Pausado'}
                      </span>
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Token e Phone Number ID da API com formatação rica (*negrito*, emojis e QR Code PIX).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('whatsapp')}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 self-start"
                >
                  <Key size={14} />
                  <span>Configurar WhatsApp API</span>
                </button>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/30 p-5 rounded-3xl flex flex-col justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30 mt-0.5">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      Gateway SMS & Templates ({tempNotificationSettings?.smsProvider?.name || 'Twilio'})
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-black">
                        {tempNotificationSettings?.smsProvider?.apiKey ? 'Configurado' : 'Pendente'}
                      </span>
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Account SID, Auth Token e templates exclusivos GSM-7 (160 caracteres, enxutos e econômicos).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('smsGateway')}
                  className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 self-start"
                >
                  <Smartphone size={14} />
                  <span>Central SMS & Templates</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Automações e Regras</h3>
                
                {/* Lembrete Automático de Início de Aula */}
                <div className="bg-surface-container-low p-6 sm:p-7 rounded-3xl border border-primary/20 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-outline/40">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <Clock size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">Lembretes Automáticos de Início de Aula</span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                            tempNotificationSettings.upcomingClasses?.enabled
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-surface-container-high text-on-surface-variant border border-outline"
                          )}>
                            {tempNotificationSettings.upcomingClasses?.enabled ? "Ativo" : "Desativado"}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Disparo programado antes do início de cada aula na grade para os alunos matriculados.
                        </p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setTempNotificationSettings(prev => ({
                        ...prev,
                        upcomingClasses: { 
                          ...prev.upcomingClasses, 
                          enabled: !prev.upcomingClasses?.enabled 
                        }
                      }))}
                      className={cn(
                        "w-12 h-6 rounded-full relative cursor-pointer transition-colors shrink-0",
                        tempNotificationSettings.upcomingClasses?.enabled ? "bg-primary" : "bg-surface-container-high"
                      )}
                    >
                      <motion.div 
                        animate={{ x: tempNotificationSettings.upcomingClasses?.enabled ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Configurações quando ativado */}
                  {tempNotificationSettings.upcomingClasses?.enabled && (
                    <div className="space-y-5">
                      {/* TEMPO DE ANTECEDÊNCIA */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={13} className="text-primary" />
                            <span>Tempo de Antecedência do Lembrete</span>
                          </label>
                          <span className="text-[11px] font-bold text-primary">
                            {tempNotificationSettings.upcomingClasses?.timing || '2'}{' '}
                            {(tempNotificationSettings.upcomingClasses as any)?.timeUnit === 'minutes' 
                              ? 'minutos antes' 
                              : (tempNotificationSettings.upcomingClasses as any)?.timeUnit === 'days' 
                              ? 'dia(s) antes' 
                              : 'hora(s) antes'}
                          </span>
                        </div>

                        {/* Botões rápidos de tempo */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { label: '15 min antes', timing: '15', unit: 'minutes' },
                            { label: '30 min antes', timing: '30', unit: 'minutes' },
                            { label: '1 hora antes', timing: '1', unit: 'hours' },
                            { label: '2 horas antes', timing: '2', unit: 'hours', badge: 'Recomendado' },
                            { label: '3 horas antes', timing: '3', unit: 'hours' },
                            { label: '24 horas antes', timing: '1', unit: 'days' },
                          ].map(preset => {
                            const isSelected = 
                              String(tempNotificationSettings.upcomingClasses?.timing) === preset.timing &&
                              ((tempNotificationSettings.upcomingClasses as any)?.timeUnit || 'hours') === preset.unit;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setTempNotificationSettings(prev => ({
                                  ...prev,
                                  upcomingClasses: {
                                    ...prev.upcomingClasses,
                                    timing: preset.timing,
                                    timeUnit: preset.unit
                                  } as any
                                }))}
                                className={cn(
                                  "py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col justify-center relative",
                                  isSelected 
                                    ? "bg-primary/15 border-primary text-primary shadow-sm" 
                                    : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{preset.label}</span>
                                  {isSelected && <Check size={12} className="text-primary" />}
                                </div>
                                {preset.badge && (
                                  <span className="text-[9px] text-emerald-400 font-bold tracking-tight mt-0.5">
                                    ★ {preset.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Ajuste personalizado */}
                        <div className="bg-surface-container/60 p-3.5 rounded-2xl border border-outline/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <span className="text-xs text-on-surface-variant shrink-0 font-medium">Ou personalizar tempo exato:</span>
                          <div className="flex items-center gap-2 flex-1">
                            <input 
                              type="number"
                              min="1"
                              max="120"
                              value={tempNotificationSettings.upcomingClasses?.timing || '2'}
                              onChange={(e) => setTempNotificationSettings(prev => ({
                                ...prev,
                                upcomingClasses: { 
                                  ...prev.upcomingClasses, 
                                  timing: e.target.value 
                                } as any
                              }))}
                              className="w-20 bg-surface-container-low border border-outline rounded-xl px-3 py-1.5 text-xs font-bold text-center focus:ring-1 focus:ring-primary outline-none"
                              placeholder="2"
                            />
                            <select
                              value={(tempNotificationSettings.upcomingClasses as any)?.timeUnit || 'hours'}
                              onChange={(e) => setTempNotificationSettings(prev => ({
                                ...prev,
                                upcomingClasses: {
                                  ...prev.upcomingClasses,
                                  timeUnit: e.target.value
                                } as any
                              }))}
                              className="flex-1 bg-surface-container-low border border-outline rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                            >
                              <option value="minutes">Minuto(s) antes do início</option>
                              <option value="hours">Hora(s) antes do início</option>
                              <option value="days">Dia(s) antes do início</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* CANAIS DE ENVIO */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                            <Send size={13} className="text-primary" />
                            <span>Canais de Envio do Lembrete</span>
                          </label>
                          <span className="text-[10px] text-on-surface-variant">Multi-seleção ativa</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* WhatsApp */}
                          <div 
                            onClick={() => setTempNotificationSettings(prev => {
                              const currChannels = prev.upcomingClasses?.channels || {} as any;
                              return {
                                ...prev,
                                upcomingClasses: {
                                  ...prev.upcomingClasses,
                                  channels: {
                                    ...currChannels,
                                    whatsapp: !(currChannels.whatsapp ?? true)
                                  }
                                } as any
                              };
                            })}
                            className={cn(
                              "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                              (tempNotificationSettings.upcomingClasses?.channels as any)?.whatsapp ?? true
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-outline"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-sm",
                                (tempNotificationSettings.upcomingClasses?.channels as any)?.whatsapp ?? true
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-surface-container-high text-on-surface-variant"
                              )}>
                                <MessageSquare size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                  <span>WhatsApp</span>
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">Mais Usado</span>
                                </div>
                                <div className="text-[10px] text-on-surface-variant">Mensagem direta via API WhatsApp</div>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                              (tempNotificationSettings.upcomingClasses?.channels as any)?.whatsapp ?? true
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-outline text-transparent"
                            )}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>

                          {/* Notificação Push */}
                          <div 
                            onClick={() => setTempNotificationSettings(prev => {
                              const currChannels = prev.upcomingClasses?.channels || {} as any;
                              return {
                                ...prev,
                                upcomingClasses: {
                                  ...prev.upcomingClasses,
                                  channels: {
                                    ...currChannels,
                                    push: !currChannels.push
                                  }
                                } as any
                              };
                            })}
                            className={cn(
                              "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                              tempNotificationSettings.upcomingClasses?.channels?.push
                                ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                                : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-outline"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-sm",
                                tempNotificationSettings.upcomingClasses?.channels?.push
                                  ? "bg-sky-500/20 text-sky-400"
                                  : "bg-surface-container-high text-on-surface-variant"
                              )}>
                                <Smartphone size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold">Notificação Push</div>
                                <div className="text-[10px] text-on-surface-variant">Alerta no celular & Web</div>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                              tempNotificationSettings.upcomingClasses?.channels?.push
                                ? "bg-sky-500 border-sky-500 text-white"
                                : "border-outline text-transparent"
                            )}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>

                          {/* SMS */}
                          <div 
                            onClick={() => setTempNotificationSettings(prev => {
                              const currChannels = prev.upcomingClasses?.channels || {} as any;
                              return {
                                ...prev,
                                upcomingClasses: {
                                  ...prev.upcomingClasses,
                                  channels: {
                                    ...currChannels,
                                    sms: !currChannels.sms
                                  }
                                } as any
                              };
                            })}
                            className={cn(
                              "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                              tempNotificationSettings.upcomingClasses?.channels?.sms
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-outline"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-sm",
                                tempNotificationSettings.upcomingClasses?.channels?.sms
                                  ? "bg-primary/20 text-primary"
                                  : "bg-surface-container-high text-on-surface-variant"
                              )}>
                                <Send size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold">SMS Tradicional</div>
                                <div className="text-[10px] text-on-surface-variant">Mensagem curta por operadora</div>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                              tempNotificationSettings.upcomingClasses?.channels?.sms
                                ? "bg-primary border-primary text-white"
                                : "border-outline text-transparent"
                            )}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>

                          {/* E-mail */}
                          <div 
                            onClick={() => setTempNotificationSettings(prev => {
                              const currChannels = prev.upcomingClasses?.channels || {} as any;
                              return {
                                ...prev,
                                upcomingClasses: {
                                  ...prev.upcomingClasses,
                                  channels: {
                                    ...currChannels,
                                    email: !currChannels.email
                                  }
                                } as any
                              };
                            })}
                            className={cn(
                              "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                              (tempNotificationSettings.upcomingClasses?.channels as any)?.email
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-outline"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-sm",
                                (tempNotificationSettings.upcomingClasses?.channels as any)?.email
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-surface-container-high text-on-surface-variant"
                              )}>
                                <Mail size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold">E-mail Cadastrado</div>
                                <div className="text-[10px] text-on-surface-variant">Comprovante e lembrete na caixa</div>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                              (tempNotificationSettings.upcomingClasses?.channels as any)?.email
                                ? "bg-amber-500 border-amber-500 text-white"
                                : "border-outline text-transparent"
                            )}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>
                        </div>

                        {/* Alerta se nenhum canal estiver selecionado */}
                        {!((tempNotificationSettings.upcomingClasses?.channels as any)?.whatsapp ?? true) &&
                         !tempNotificationSettings.upcomingClasses?.channels?.push &&
                         !tempNotificationSettings.upcomingClasses?.channels?.sms &&
                         !(tempNotificationSettings.upcomingClasses?.channels as any)?.email && (
                          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>Atenção: Selecione pelo menos um canal para envio do lembrete automático.</span>
                          </div>
                        )}
                      </div>

                      {/* SOLICITAR CONFIRMAÇÃO INTERATIVA */}
                      <div 
                        onClick={() => setTempNotificationSettings(prev => ({
                          ...prev,
                          upcomingClasses: {
                            ...prev.upcomingClasses,
                            requestConfirmation: !((prev.upcomingClasses as any)?.requestConfirmation ?? true)
                          } as any
                        }))}
                        className={cn(
                          "p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all",
                          (tempNotificationSettings.upcomingClasses as any)?.requestConfirmation ?? true
                            ? "bg-primary/10 border-primary/30 text-on-surface"
                            : "bg-surface-container border-outline text-on-surface-variant"
                        )}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>Solicitar confirmação interativa de presença</span>
                            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-bold">1=Sim / 2=Não</span>
                          </div>
                          <div className="text-[10px] text-on-surface-variant">
                            Permite que o aluno confirme com um toque ou resposta, agilizando a chamada do professor.
                          </div>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ml-3",
                          (tempNotificationSettings.upcomingClasses as any)?.requestConfirmation ?? true
                            ? "bg-primary border-primary text-white"
                            : "border-outline text-transparent"
                        )}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>

                      {/* TESTAR LEMBRETE */}
                      <div className="pt-2 flex items-center justify-between border-t border-outline/30">
                        <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                          <Sparkles size={12} className="text-primary" />
                          <span>Simular notificação de teste para a equipe</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const channels: string[] = [];
                            const ch = tempNotificationSettings.upcomingClasses?.channels as any;
                            if (ch?.whatsapp ?? true) channels.push('WhatsApp');
                            if (ch?.push) channels.push('Push');
                            if (ch?.sms) channels.push('SMS');
                            if (ch?.email) channels.push('E-mail');
                            const timeVal = tempNotificationSettings.upcomingClasses?.timing || '2';
                            const unitVal = (tempNotificationSettings.upcomingClasses as any)?.timeUnit === 'minutes' 
                              ? 'minutos' 
                              : (tempNotificationSettings.upcomingClasses as any)?.timeUnit === 'days' 
                              ? 'dias' 
                              : 'horas';

                            if (channels.length === 0) {
                              toast.error("Selecione ao menos um canal de envio antes de testar!");
                              return;
                            }

                            toast.success("Lembrete de aula simulado com sucesso! 🔔", {
                              description: `Disparo agendado para ${timeVal} ${unitVal} antes da aula via [${channels.join(', ')}].`
                            });
                          }}
                          className="px-3.5 py-1.5 bg-surface-container border border-primary/30 hover:bg-primary/10 text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <Send size={12} />
                          <span>Testar Disparo Agora</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lembrete Automático de Vencimento de Mensalidade */}
                <div className="bg-surface-container-low p-6 sm:p-7 rounded-3xl border border-amber-500/20 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-outline/40">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">Lembretes Automáticos de Vencimento de Mensalidade</span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                            tempNotificationSettings.paymentDue?.enabled
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-surface-container-high text-on-surface-variant border border-outline"
                          )}>
                            {tempNotificationSettings.paymentDue?.enabled ? "Ativo" : "Desativado"}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Disparo programado antes do vencimento da mensalidade para avisar os alunos e agilizar o pagamento via PIX/Link.
                        </p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setTempNotificationSettings(prev => ({
                        ...prev,
                        paymentDue: { ...prev.paymentDue, enabled: !prev.paymentDue?.enabled }
                      }))}
                      className={cn(
                        "w-12 h-6 rounded-full relative cursor-pointer transition-colors shrink-0",
                        tempNotificationSettings.paymentDue?.enabled ? "bg-primary" : "bg-surface-container-high"
                      )}
                    >
                      <motion.div 
                        animate={{ x: tempNotificationSettings.paymentDue?.enabled ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Configurações quando ativado */}
                  {tempNotificationSettings.paymentDue?.enabled && (
                    <div className="space-y-5">
                      {/* TEMPO DE ANTECEDÊNCIA */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={13} className="text-amber-400" />
                            <span>Tempo de Antecedência do Vencimento</span>
                          </label>
                          <span className="text-[11px] font-bold text-amber-400">
                            {Number(tempNotificationSettings.paymentDue?.timing) === 0
                              ? 'No dia do vencimento'
                              : `${tempNotificationSettings.paymentDue?.timing || '3'} ${(tempNotificationSettings.paymentDue as any)?.timeUnit === 'weeks' ? 'semana(s)' : 'dia(s)'} antes`}
                            {' • às '}{(tempNotificationSettings.paymentDue as any)?.sendTime || '09:00'}
                          </span>
                        </div>

                        {/* Botões rápidos de tempo */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { label: '1 dia antes', timing: '1', unit: 'days' },
                            { label: '2 dias antes', timing: '2', unit: 'days' },
                            { label: '3 dias antes', timing: '3', unit: 'days', badge: 'Recomendado' },
                            { label: '5 dias antes', timing: '5', unit: 'days' },
                            { label: '7 dias antes (1 sem)', timing: '7', unit: 'days' },
                            { label: 'No dia do vencimento', timing: '0', unit: 'days' },
                          ].map(preset => {
                            const isSelected = 
                              String(tempNotificationSettings.paymentDue?.timing) === preset.timing &&
                              ((tempNotificationSettings.paymentDue as any)?.timeUnit || 'days') === preset.unit;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setTempNotificationSettings(prev => ({
                                  ...prev,
                                  paymentDue: {
                                    ...prev.paymentDue,
                                    timing: preset.timing,
                                    timeUnit: preset.unit
                                  } as any
                                }))}
                                className={cn(
                                  "py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col justify-center relative",
                                  isSelected 
                                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm" 
                                    : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-amber-500/30 hover:text-on-surface"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{preset.label}</span>
                                  {isSelected && <Check size={12} className="text-amber-400" />}
                                </div>
                                {preset.badge && (
                                  <span className="text-[9px] text-amber-400 font-bold tracking-tight mt-0.5">
                                    ★ {preset.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Ajuste personalizado e Horário de envio */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-surface-container/60 p-3.5 rounded-2xl border border-outline/50 flex flex-col gap-2">
                            <span className="text-xs text-on-surface-variant font-medium">Personalizar dias de antecedência:</span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                min="0"
                                max="30"
                                value={tempNotificationSettings.paymentDue?.timing ?? '3'}
                                onChange={(e) => setTempNotificationSettings(prev => ({
                                  ...prev,
                                  paymentDue: { 
                                    ...prev.paymentDue, 
                                    timing: e.target.value 
                                  } as any
                                }))}
                                className="w-20 bg-surface-container-low border border-outline rounded-xl px-3 py-1.5 text-xs font-bold text-center focus:ring-1 focus:ring-primary outline-none"
                                placeholder="3"
                              />
                              <select
                                value={(tempNotificationSettings.paymentDue as any)?.timeUnit || 'days'}
                                onChange={(e) => setTempNotificationSettings(prev => ({
                                  ...prev,
                                  paymentDue: {
                                    ...prev.paymentDue,
                                    timeUnit: e.target.value
                                  } as any
                                }))}
                                className="flex-1 bg-surface-container-low border border-outline rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                              >
                                <option value="days">Dia(s) antes do vencimento</option>
                                <option value="weeks">Semana(s) antes do vencimento</option>
                              </select>
                            </div>
                          </div>

                          <div className="bg-surface-container/60 p-3.5 rounded-2xl border border-outline/50 flex flex-col gap-2">
                            <span className="text-xs text-on-surface-variant font-medium">Horário de Disparo Automático:</span>
                            <div className="flex items-center gap-2">
                              <select
                                value={(tempNotificationSettings.paymentDue as any)?.sendTime || '09:00'}
                                onChange={(e) => setTempNotificationSettings(prev => ({
                                  ...prev,
                                  paymentDue: {
                                    ...prev.paymentDue,
                                    sendTime: e.target.value
                                  } as any
                                }))}
                                className="w-full bg-surface-container-low border border-outline rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                              >
                                <option value="08:00">08:00 (Início da manhã)</option>
                                <option value="09:00">09:00 (Padrão Recomendado)</option>
                                <option value="10:00">10:00 (Meio da manhã)</option>
                                <option value="12:00">12:00 (Horário de almoço)</option>
                                <option value="14:00">14:00 (Início da tarde)</option>
                                <option value="18:00">18:00 (Fim de expediente)</option>
                                <option value="19:30">19:30 (Início da noite)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CANAIS DE ENVIO */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                            <Send size={13} className="text-amber-400" />
                            <span>Canais de Envio para Cobrança de Mensalidade</span>
                          </label>
                          <span className="text-[10px] text-on-surface-variant">Multi-seleção ativa</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* WhatsApp */}
                          <div 
                            onClick={() => setTempNotificationSettings(prev => {
                              const currChannels = prev.paymentDue?.channels || {} as any;
                              return {
                                ...prev,
                                paymentDue: {
                                  ...prev.paymentDue,
                                  channels: {
                                    ...currChannels,
                                    whatsapp: !(currChannels.whatsapp ?? true)
                                  }
                                } as any
                              };
                            })}
                            className={cn(
                              "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                              (tempNotificationSettings.paymentDue?.channels as any)?.whatsapp ?? true
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-outline"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-sm",
                                (tempNotificationSettings.paymentDue?.channels as any)?.whatsapp ?? true
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-surface-container-high text-on-surface-variant"
                              )}>
                                <MessageSquare size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                  <span>WhatsApp</span>
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">Mais Eficaz</span>
                                </div>
                                <div className="text-[10px] text-on-surface-variant">Mensagem direta com chave PIX e valor</div>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                              (tempNotificationSettings.paymentDue?.channels as any)?.whatsapp ?? true
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-outline text-transparent"
                            )}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>

                          {/* E-mail */}
                          <div 
                            onClick={() => setTempNotificationSettings(prev => {
                              const currChannels = prev.paymentDue?.channels || {} as any;
                              return {
                                ...prev,
                                paymentDue: {
                                  ...prev.paymentDue,
                                  channels: {
                                    ...currChannels,
                                    email: !((currChannels as any).email ?? true)
                                  }
                                } as any
                              };
                            })}
                            className={cn(
                              "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                              (tempNotificationSettings.paymentDue?.channels as any)?.email ?? true
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-outline"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-sm",
                                (tempNotificationSettings.paymentDue?.channels as any)?.email ?? true
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-surface-container-high text-on-surface-variant"
                              )}>
                                <Mail size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                  <span>E-mail Cadastrado</span>
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">Fatura Detalhada</span>
                                </div>
                                <div className="text-[10px] text-on-surface-variant">Fatura com código de barras e comprovante</div>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                              (tempNotificationSettings.paymentDue?.channels as any)?.email ?? true
                                ? "bg-amber-500 border-amber-500 text-white"
                                : "border-outline text-transparent"
                            )}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>

                          {/* Notificação Push */}
                          <div 
                            onClick={() => setTempNotificationSettings(prev => {
                              const currChannels = prev.paymentDue?.channels || {} as any;
                              return {
                                ...prev,
                                paymentDue: {
                                  ...prev.paymentDue,
                                  channels: {
                                    ...currChannels,
                                    push: !currChannels.push
                                  }
                                } as any
                              };
                            })}
                            className={cn(
                              "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                              tempNotificationSettings.paymentDue?.channels?.push
                                ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                                : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-outline"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-sm",
                                tempNotificationSettings.paymentDue?.channels?.push
                                  ? "bg-sky-500/20 text-sky-400"
                                  : "bg-surface-container-high text-on-surface-variant"
                              )}>
                                <Smartphone size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold">Notificação Push</div>
                                <div className="text-[10px] text-on-surface-variant">Alerta no app do aluno e na web</div>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                              tempNotificationSettings.paymentDue?.channels?.push
                                ? "bg-sky-500 border-sky-500 text-white"
                                : "border-outline text-transparent"
                            )}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>

                          {/* SMS */}
                          <div 
                            onClick={() => setTempNotificationSettings(prev => {
                              const currChannels = prev.paymentDue?.channels || {} as any;
                              return {
                                ...prev,
                                paymentDue: {
                                  ...prev.paymentDue,
                                  channels: {
                                    ...currChannels,
                                    sms: !currChannels.sms
                                  }
                                } as any
                              };
                            })}
                            className={cn(
                              "p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between",
                              tempNotificationSettings.paymentDue?.channels?.sms
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-surface-container border-outline/70 text-on-surface-variant hover:border-outline"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-sm",
                                tempNotificationSettings.paymentDue?.channels?.sms
                                  ? "bg-primary/20 text-primary"
                                  : "bg-surface-container-high text-on-surface-variant"
                              )}>
                                <Send size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold">SMS Tradicional</div>
                                <div className="text-[10px] text-on-surface-variant">Mensagem curta de texto por operadora</div>
                              </div>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                              tempNotificationSettings.paymentDue?.channels?.sms
                                ? "bg-primary border-primary text-white"
                                : "border-outline text-transparent"
                            )}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          </div>
                        </div>

                        {/* Alerta se nenhum canal estiver selecionado */}
                        {!((tempNotificationSettings.paymentDue?.channels as any)?.whatsapp ?? true) &&
                         !((tempNotificationSettings.paymentDue?.channels as any)?.email ?? true) &&
                         !tempNotificationSettings.paymentDue?.channels?.push &&
                         !tempNotificationSettings.paymentDue?.channels?.sms && (
                          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>Atenção: Selecione ao menos um canal para o envio do lembrete de mensalidade.</span>
                          </div>
                        )}
                      </div>

                      {/* OPÇÕES ADICIONAIS DE COBRANÇA */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div 
                          onClick={() => setTempNotificationSettings(prev => ({
                            ...prev,
                            paymentDue: {
                              ...prev.paymentDue,
                              includePix: !((prev.paymentDue as any)?.includePix ?? true)
                            } as any
                          }))}
                          className={cn(
                            "p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all",
                            (tempNotificationSettings.paymentDue as any)?.includePix ?? true
                              ? "bg-amber-500/10 border-amber-500/30 text-on-surface"
                              : "bg-surface-container border-outline text-on-surface-variant"
                          )}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>Incluir Chave PIX e Link</span>
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">PIX Copia e Cola</span>
                            </div>
                            <div className="text-[10px] text-on-surface-variant">
                              Gera chave do estúdio para pagamento instantâneo.
                            </div>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ml-3",
                            (tempNotificationSettings.paymentDue as any)?.includePix ?? true
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "border-outline text-transparent"
                          )}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        </div>

                        <div 
                          onClick={() => setTempNotificationSettings(prev => ({
                            ...prev,
                            paymentDue: {
                              ...prev.paymentDue,
                              sendOnDueDate: !((prev.paymentDue as any)?.sendOnDueDate ?? true)
                            } as any
                          }))}
                          className={cn(
                            "p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all",
                            (tempNotificationSettings.paymentDue as any)?.sendOnDueDate ?? true
                              ? "bg-primary/10 border-primary/30 text-on-surface"
                              : "bg-surface-container border-outline text-on-surface-variant"
                          )}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>Reforço no Dia do Vencimento</span>
                              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-bold">Hoje Vence</span>
                            </div>
                            <div className="text-[10px] text-on-surface-variant">
                              Reenvia lembrete matinal caso a fatura ainda conste pendente.
                            </div>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ml-3",
                            (tempNotificationSettings.paymentDue as any)?.sendOnDueDate ?? true
                              ? "bg-primary border-primary text-white"
                              : "border-outline text-transparent"
                          )}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        </div>
                      </div>

                      {/* TESTAR LEMBRETE */}
                      <div className="pt-2 flex items-center justify-between border-t border-outline/30">
                        <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                          <DollarSign size={13} className="text-amber-400" />
                          <span>Simular notificação de vencimento com chave PIX</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const channels: string[] = [];
                            const ch = tempNotificationSettings.paymentDue?.channels as any;
                            if (ch?.whatsapp ?? true) channels.push('WhatsApp');
                            if (ch?.email ?? true) channels.push('E-mail');
                            if (ch?.push) channels.push('Push');
                            if (ch?.sms) channels.push('SMS');

                            const timeVal = tempNotificationSettings.paymentDue?.timing ?? '3';
                            const unitVal = (tempNotificationSettings.paymentDue as any)?.timeUnit === 'weeks' ? 'semana(s)' : 'dia(s)';
                            const sendTime = (tempNotificationSettings.paymentDue as any)?.sendTime || '09:00';
                            const hasPix = (tempNotificationSettings.paymentDue as any)?.includePix ?? true;

                            if (channels.length === 0) {
                              toast.error("Selecione ao menos um canal de envio antes de testar!");
                              return;
                            }

                            const timingText = Number(timeVal) === 0 
                              ? "no próprio dia do vencimento" 
                              : `${timeVal} ${unitVal} antes do vencimento`;

                            toast.success("Lembrete de vencimento simulado! 💳", {
                              description: `Disparo agendado para ${timingText} às ${sendTime} via [${channels.join(', ')}] ${hasPix ? 'com chave PIX incluída' : ''}.`
                            });
                          }}
                          className="px-3.5 py-1.5 bg-surface-container border border-amber-500/30 hover:bg-amber-500/10 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <Send size={12} />
                          <span>Testar Disparo de Cobrança</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-surface-container-low p-6 rounded-3xl border border-outline space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag size={18} className="text-primary" />
                      <span className="text-sm font-bold">Promoções e Avisos</span>
                    </div>
                    <div 
                      onClick={() => setTempNotificationSettings(prev => ({
                        ...prev,
                        promotions: { ...prev.promotions, enabled: !prev.promotions.enabled }
                      }))}
                      className={cn(
                        "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                        tempNotificationSettings.promotions.enabled ? "bg-primary" : "bg-surface-container-high"
                      )}
                    >
                      <motion.div 
                        animate={{ x: tempNotificationSettings.promotions.enabled ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Canais</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setTempNotificationSettings(prev => ({
                          ...prev,
                          promotions: { ...prev.promotions, channels: { ...prev.promotions.channels, sms: !prev.promotions.channels.sms } }
                        }))}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all", tempNotificationSettings.promotions.channels.sms ? "bg-primary/20 border-primary text-primary" : "border-outline text-on-surface-variant")}
                      >SMS</button>
                      <button 
                        onClick={() => setTempNotificationSettings(prev => ({
                          ...prev,
                          promotions: { ...prev.promotions, channels: { ...prev.promotions.channels, push: !prev.promotions.channels.push } }
                        }))}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all", tempNotificationSettings.promotions.channels.push ? "bg-primary/20 border-primary text-primary" : "border-outline text-on-surface-variant")}
                      >Push</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Configuração do Provedor SMS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                        <Server size={16} className="text-sky-400" />
                        <span>Configuração do Provedor SMS</span>
                      </h3>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Defina o gateway de SMS e credenciais para disparo direto aos alunos.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('smsGateway')}
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1 hover:underline"
                    >
                      <span>Painel Completo SMS</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="bg-surface-container-low p-5 rounded-3xl border border-outline/70 space-y-4 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Provedor SMS</label>
                        <select 
                          value={tempNotificationSettings?.smsProvider?.name || 'Twilio'}
                          onChange={(e) => setTempNotificationSettings(prev => ({ 
                            ...prev, 
                            smsProvider: { ...prev?.smsProvider, name: e.target.value } 
                          }))}
                          className="w-full bg-surface-container border border-outline rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                        >
                          <option value="Twilio">Twilio (Recomendado)</option>
                          <option value="Zenvia">Zenvia (Líder Brasil)</option>
                          <option value="MessageBird">MessageBird (Bird)</option>
                          <option value="TotalVoice">TotalVoice</option>
                          <option value="AWS SNS">AWS SNS (Amazon)</option>
                          <option value="Custom">Custom Webhook / HTTP</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                          Remetente ({tempNotificationSettings?.smsProvider?.name === 'Twilio' ? 'Número Twilio' : 'Sender ID'})
                        </label>
                        <input 
                          type="text"
                          placeholder={tempNotificationSettings?.smsProvider?.name === 'Twilio' ? "+12025550192 ou STYLU" : "STYLU"}
                          value={tempNotificationSettings?.smsProvider?.fromNumber || ''}
                          onChange={(e) => setTempNotificationSettings(prev => ({ 
                            ...prev, 
                            smsProvider: { ...prev?.smsProvider, fromNumber: e.target.value } 
                          }))}
                          className="w-full bg-surface-container border border-outline rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center justify-between">
                        <span>API Key / Account SID</span>
                        <span className="text-[9px] text-sky-400 font-mono">
                          {tempNotificationSettings?.smsProvider?.name === 'Twilio' ? 'Ex: AC...' : 'Chave pública'}
                        </span>
                      </label>
                      <input 
                        type="text"
                        placeholder={tempNotificationSettings?.smsProvider?.name === 'Twilio' ? "Ex: AC8a7b9c1d2e3f4a5b6c7d8e9f..." : "Chave de acesso da API"}
                        value={tempNotificationSettings?.smsProvider?.apiKey || ''}
                        onChange={(e) => setTempNotificationSettings(prev => ({ 
                          ...prev, 
                          smsProvider: { ...prev?.smsProvider, apiKey: e.target.value } 
                        }))}
                        className="w-full bg-surface-container border border-outline rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center justify-between">
                        <span>API Secret / Auth Token</span>
                        <span className="text-[9px] text-on-surface-variant font-mono">Confidencial</span>
                      </label>
                      <div className="relative">
                        <input 
                          type={showSmsSecret ? "text" : "password"}
                          placeholder="••••••••••••••••••••••••••••••••"
                          value={tempNotificationSettings?.smsProvider?.apiSecret || ''}
                          onChange={(e) => setTempNotificationSettings(prev => ({ 
                            ...prev, 
                            smsProvider: { ...prev?.smsProvider, apiSecret: e.target.value } 
                          }))}
                          className="w-full bg-surface-container border border-outline rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmsSecret(!showSmsSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          {showSmsSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Específico de Mensagem para SMS (Diferente do WhatsApp) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                        <Smartphone size={16} className="text-sky-400" />
                        <span>Template Específico de Mensagem para SMS</span>
                      </h3>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Diferente do WhatsApp: formato enxuto GSM-7 sem markdown e de até 160 caracteres.
                      </p>
                    </div>
                    <span className="text-[9px] bg-sky-500/15 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                      GSM-7 Puro
                    </span>
                  </div>

                  {/* Banner explicativo rápido */}
                  <div className="bg-sky-500/10 border border-sky-500/25 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-on-surface-variant">
                    <Info size={16} className="text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sky-300 font-bold">Por que o template de SMS é diferente do WhatsApp?</span>
                      <p className="text-[11px] mt-0.5 leading-relaxed">
                        O SMS cobra por bloco de 160 caracteres e não suporta asteriscos de negrito (<code className="bg-black/20 px-1 rounded text-sky-300">*texto*</code>) ou emojis longos. O WhatsApp mantém a mensagem formatada e detalhada, enquanto o SMS envia um texto direto com link rápido.
                      </p>
                    </div>
                  </div>

                  {/* Template selector tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-outline/50">
                    {[
                      { key: 'paymentDue', label: 'Mensalidade', icon: DollarSign },
                      { key: 'upcomingClasses', label: 'Início de Aula', icon: Clock },
                      { key: 'overduePayment', label: 'Cobrança', icon: AlertCircle },
                      { key: 'promotions', label: 'Promoções', icon: Sparkles }
                    ].map(t => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setSelectedSmsTemplateKey(t.key as any)}
                        className={cn(
                          "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all truncate",
                          selectedSmsTemplateKey === t.key
                            ? "bg-surface-container text-sky-400 shadow-sm border border-outline/50"
                            : "text-on-surface-variant hover:text-on-surface"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* SMS Template Textarea with Character Counter */}
                  <div className="bg-surface-container-low p-4 rounded-3xl border border-outline/70 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-sky-400 uppercase tracking-wider">
                        Template SMS: {
                          selectedSmsTemplateKey === 'paymentDue' ? 'Vencimento de Mensalidade' :
                          selectedSmsTemplateKey === 'upcomingClasses' ? 'Lembrete de Início de Aula' :
                          selectedSmsTemplateKey === 'overduePayment' ? 'Mensalidade Pendente' : 'Promoções & Avisos'
                        }
                      </span>
                      <span className="text-on-surface-variant font-mono">
                        {(tempNotificationSettings?.smsTemplates?.[selectedSmsTemplateKey] || DEFAULT_SMS_TEMPLATES[selectedSmsTemplateKey]).length} / 160 carac.
                      </span>
                    </div>

                    <textarea 
                      rows={3}
                      value={tempNotificationSettings?.smsTemplates?.[selectedSmsTemplateKey] || DEFAULT_SMS_TEMPLATES[selectedSmsTemplateKey]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempNotificationSettings(prev => ({
                          ...prev,
                          smsTemplates: {
                            ...DEFAULT_SMS_TEMPLATES,
                            ...prev?.smsTemplates,
                            [selectedSmsTemplateKey]: val
                          },
                          templates: {
                            ...prev?.templates,
                            [selectedSmsTemplateKey]: val
                          }
                        }));
                      }}
                      placeholder="Digite o texto conciso para SMS..."
                      className="w-full bg-surface-container border border-outline rounded-xl px-3.5 py-2.5 text-xs font-sans leading-relaxed focus:ring-1 focus:ring-sky-500 outline-none transition-all resize-none"
                    />

                    {/* Tag chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">
                        Variáveis Rápidas (Clique para Inserir):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          '{aluno}', '{modalidade}', '{hora}', '{data}', '{mes}', '{valor}', '{link}'
                        ].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const currentVal = tempNotificationSettings?.smsTemplates?.[selectedSmsTemplateKey] || DEFAULT_SMS_TEMPLATES[selectedSmsTemplateKey];
                              const newVal = currentVal + (currentVal.endsWith(' ') ? '' : ' ') + tag;
                              setTempNotificationSettings(prev => ({
                                ...prev,
                                smsTemplates: {
                                  ...DEFAULT_SMS_TEMPLATES,
                                  ...prev?.smsTemplates,
                                  [selectedSmsTemplateKey]: newVal
                                },
                                templates: {
                                  ...prev?.templates,
                                  [selectedSmsTemplateKey]: newVal
                                }
                              }));
                            }}
                            className="px-2 py-0.5 bg-surface-container hover:bg-sky-500/15 border border-outline/70 hover:border-sky-500/40 text-[10px] font-mono rounded text-on-surface-variant hover:text-sky-300 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onUpdateNotificationSettings(tempNotificationSettings)}
                  className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Salvar Regras de Notificação & SMS
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {isInstructorModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInstructorModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl z-10 glass-panel overflow-y-auto max-h-[90vh] custom-scrollbar space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-headline font-black uppercase tracking-tight">
                    {editingInstructor ? 'Editar Instrutor' : 'Novo Instrutor'}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">Informações Técnicas e Disponibilidade</p>
                </div>
                <button 
                  onClick={() => setIsInstructorModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <XCircle size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-4">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Foto de Perfil</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-outline flex items-center justify-center overflow-hidden bg-surface-container-low relative group">
                      {instructorData.avatar ? (
                        <img src={instructorData.avatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={32} className="text-on-surface-variant/30" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, false)}
                        className="hidden" 
                        id="instructor-photo-upload"
                      />
                      <label 
                        htmlFor="instructor-photo-upload"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:scale-105 transition-all shadow-lg shadow-primary/20"
                      >
                        <Upload size={16} />
                        Carregar Foto
                      </label>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">JPG, PNG ou GIF. Recomendado 1:1.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <InputGroup 
                    label="Nome Completo" 
                    placeholder="Ex: Rick Soul" 
                    value={instructorData.name}
                    onChange={(e) => setInstructorData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <InputGroup 
                    label="E-mail" 
                    placeholder="instrutor@estudio.com" 
                    type="email"
                    value={instructorData.email}
                    onChange={(e) => setInstructorData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <InputGroup 
                    label="Telefone / WhatsApp" 
                    placeholder="(11) 99999-9999" 
                    value={instructorData.phone}
                    onChange={(e) => setInstructorData(prev => ({ ...prev, phone: e.target.value }))}
                  />

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Especialidades</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        placeholder="Ex: Hip Hop, Jazz..."
                        className="flex-1 bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSpecialty()}
                      />
                      <button 
                        onClick={handleAddSpecialty}
                        className="p-3 bg-primary text-white rounded-xl hover:scale-105 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {instructorData.specialties.map(spec => (
                        <div key={spec} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                          {spec}
                          <button 
                            onClick={() => setInstructorData(prev => ({ ...prev, specialties: prev.specialties.filter(s => s !== spec) }))}
                            className="hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Dias da Semana (Pretendidos)</label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setInstructorData(prev => {
                                const current = prev.preferredDays || [];
                                const next = current.includes(day)
                                  ? current.filter(d => d !== day)
                                  : current.length < 6 
                                    ? [...current, day]
                                    : current;
                                return { ...prev, preferredDays: next };
                              });
                            }}
                            className={cn(
                              "flex-1 min-w-[50px] py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                              (instructorData.preferredDays || []).includes(day)
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-surface-container-low border-outline text-on-surface-variant hover:border-primary/50"
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest italic opacity-60">Escolha de 1 a 6 dias da semana.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Horários de Disponibilidade</label>
                    <div className="grid grid-cols-1 gap-3 p-4 bg-surface-container-low border border-outline rounded-2xl">
                      <div className="grid grid-cols-3 gap-2">
                        <select 
                          value={newSchedule.day}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, day: e.target.value }))}
                          className="bg-surface-container border border-outline rounded-xl px-3 py-2 text-[10px] font-bold uppercase outline-none"
                        >
                          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <input 
                          type="time" 
                          value={newSchedule.start}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, start: e.target.value }))}
                          className="bg-surface-container border border-outline rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                        />
                        <input 
                          type="time" 
                          value={newSchedule.end}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, end: e.target.value }))}
                          className="bg-surface-container border border-outline rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleAddSchedule}
                        className="w-full py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                      >
                        Adicionar Horário
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {instructorData.schedules.map((sched, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-outline">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-primary">{sched.day}</span>
                            <span className="text-[10px] font-bold text-on-surface-variant">{sched.start} - {sched.end}</span>
                          </div>
                          <button 
                            onClick={() => handleRemoveSchedule(idx)}
                            className="text-on-surface-variant hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsInstructorModalOpen(false)}
                  className="flex-1 py-4 bg-surface-container-low border border-outline text-on-surface-variant rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveInstructor}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
                >
                  {editingInstructor ? 'Salvar Alterações' : 'Cadastrar Instrutor'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isAddingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingUser(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container p-8 rounded-[40px] border border-outline shadow-2xl relative z-10 glass-panel"
            >
              <h2 className="text-2xl font-headline font-black mb-6">Novo Usuário</h2>
              <div className="space-y-4">
                <InputGroup 
                  label="Nome Completo" 
                  placeholder="Ex: João Silva" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
                <InputGroup 
                  label="Email" 
                  placeholder="Ex: joao@email.com" 
                  value={newUser.email || ''}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
                <InputGroup 
                  label="Telefone / WhatsApp" 
                  placeholder="Ex: (11) 99999-9999" 
                  value={newUser.phone || ''}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                />
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Foto de Perfil</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-outline flex items-center justify-center overflow-hidden bg-surface-container-low">
                        {newUser.avatar ? (
                          <img src={newUser.avatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={24} className="text-on-surface-variant/30" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, true)}
                          className="hidden" 
                          id="user-photo-upload"
                        />
                        <label 
                          htmlFor="user-photo-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-white transition-all"
                        >
                          <Upload size={14} />
                          Escolher Foto
                        </label>
                        <p className="text-[8px] text-on-surface-variant uppercase tracking-widest">JPG, PNG ou GIF. Máx 1MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Perfil de Acesso</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    >
                      <option value="Gerente">Gerente</option>
                      <option value="Recepcionista">Recepcionista</option>
                      <option value="Auxiliar de Gerência">Auxiliar de Gerência</option>
                      <option value="Instrutor">Instrutor</option>
                      <option value="Aluno">Aluno</option>
                    </select>
                  </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAddingUser(false)}
                    className="flex-1 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest border border-outline hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddUser}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'financeiro' && (
          <motion.div 
            key="financeiro"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="bg-surface-container p-8 rounded-[40px] border border-outline space-y-8 glass-panel kinetic-glow max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-black uppercase tracking-tight">Dados Bancários e PIX</h3>
                  <p className="text-xs text-on-surface-variant">Configure sua conta para receber pagamentos via PIX.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Nome do Banco</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Nubank, Itaú, Banco do Brasil"
                    value={tempBankInfo.bankName}
                    onChange={(e) => setTempBankInfo(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Chave PIX (CPF, Email, Telefone ou Aleatória)</label>
                  <input 
                    type="text" 
                    placeholder="Sua chave PIX"
                    value={tempBankInfo.pixKey}
                    onChange={(e) => setTempBankInfo(prev => ({ ...prev, pixKey: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Nome do Titular</label>
                  <input 
                    type="text" 
                    placeholder="Nome completo do titular da conta"
                    value={tempBankInfo.holderName}
                    onChange={(e) => setTempBankInfo(prev => ({ ...prev, holderName: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <button 
                  onClick={() => onUpdateBankInfo(tempBankInfo)}
                  className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Salvar Dados Bancários
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'parceiros' && (
          <motion.div 
            key="parceiros"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <PartnerIntegrationSettings
              config={partnerConfig}
              onSaveConfig={onUpdatePartnerConfig || (async () => {})}
              studentsCountByPartner={{
                wellhub: students.filter(s => s.planType === 'WellHub').length,
                gurupass: students.filter(s => s.planType === 'GuruPass').length,
                totalpass: students.filter(s => s.planType === 'TotalPass').length
              }}
              studioName={studioName}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AccessLevelItem({ role, description }: { role: string, description: string }) {
  return (
    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <UserCheck size={20} />
      </div>
      <div>
        <h4 className="text-sm font-bold">{role}</h4>
        <p className="text-[10px] text-on-surface-variant leading-tight">{description}</p>
      </div>
    </div>
  );
}


function PreferenceToggle({ label, description, active, onToggle }: { label: string, description: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-6 bg-surface-container-low border border-outline rounded-3xl hover:border-primary/30 transition-all group">
      <div className="space-y-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[10px] text-on-surface-variant leading-tight max-w-[200px]">{description}</p>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "w-12 h-6 rounded-full relative transition-all duration-300",
          active ? "bg-primary" : "bg-surface-container-high"
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
          active ? "left-7" : "left-1"
        )} />
      </button>
    </div>
  );
}

function EventsScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([
    { id: '1', title: 'Workshop de Locking', date: '2024-04-15', type: 'Evento', status: 'Confirmado' },
    { id: '2', title: 'Feriado: Tiradentes', date: '2024-04-21', type: 'Feriado', status: 'Fechado' },
    { id: '3', title: 'Alteração: Aula de Hip Hop', date: '2024-03-25', type: 'Alteração', status: 'Aviso Enviado' },
  ]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'Evento',
    status: 'Pendente'
  });

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error('Preencha todos os campos');
      return;
    }
    const event = {
      ...newEvent,
      id: `ev-${Date.now()}`
    };
    setEvents([event, ...events]);
    setIsModalOpen(false);
    setNewEvent({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'Evento',
      status: 'Pendente'
    });
    toast.success('Evento criado com sucesso!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tighter uppercase">Eventos & Programação</h1>
          <p className="text-on-surface-variant text-xs sm:text-sm mt-1">Calendário de feriados, workshops e comunicados extras.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-full text-[10px] sm:text-sm font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95 shadow-lg kinetic-glow self-start sm:self-auto"
        >
          <Plus size={18} />
          Criar Informe
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface-container p-8 rounded-3xl border border-outline shadow-2xl space-y-6 kinetic-glow"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-headline font-black uppercase tracking-tight">Novo Informe</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <XCircle size={24} className="text-on-surface-variant" />
                </button>
              </div>

              <div className="space-y-4">
                <InputGroup 
                  label="Título" 
                  placeholder="Ex: Workshop de Jazz" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                />
                <InputGroup 
                  label="Data" 
                  type="date"
                  placeholder="" 
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Tipo</label>
                  <select 
                    value={newEvent.type}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="Evento">Evento</option>
                    <option value="Feriado">Feriado</option>
                    <option value="Alteração">Alteração</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleAddEvent}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Salvar Informe
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-surface-container p-6 rounded-[32px] border border-outline space-y-4 glass-panel kinetic-glow">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest",
                event.type === 'Evento' ? "bg-blue-500/10 text-blue-500" : 
                event.type === 'Feriado' ? "bg-red-500/10 text-red-500" : 
                "bg-amber-500/10 text-amber-500"
              )}>
                {event.type}
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant">{event.date}</span>
            </div>
            <h3 className="text-lg font-bold">{event.title}</h3>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{event.status}</span>
              <button className="text-primary hover:underline text-xs font-bold">Editar</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container p-10 rounded-[40px] border border-outline space-y-6 glass-panel kinetic-glow">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <Calendar size={24} className="text-primary" />
          Calendário de Feriados 2024
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HolidayCard month="Abril" day="21" name="Tiradentes" />
          <HolidayCard month="Maio" day="01" name="Dia do Trabalho" />
          <HolidayCard month="Maio" day="30" name="Corpus Christi" />
          <HolidayCard month="Setembro" day="07" name="Independência" />
        </div>
      </div>
    </motion.div>
  );
}

function HolidayCard({ month, day, name }: { month: string, day: string, name: string }) {
  return (
    <div className="p-4 bg-white/5 rounded-2xl border border-outline text-center space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{month}</p>
      <p className="text-2xl font-black text-primary">{day}</p>
      <p className="text-[10px] font-bold uppercase tracking-tight">{name}</p>
    </div>
  );
}

// --- Helper Functions ---

const generatePixPayload = (key: string, name: string, city: string, amount: number, description: string) => {
  const pad = (s: string) => s.length.toString().padStart(2, '0');
  
  const payloadFormatIndicator = "000201";
  const merchantAccountInfo = `26${pad(`0014br.gov.bcb.pix01${pad(key)}${key}`)}0014br.gov.bcb.pix01${pad(key)}${key}`;
  const merchantCategoryCode = "52040000";
  const transactionCurrency = "5303986";
  const transactionAmount = amount > 0 ? `54${pad(amount.toFixed(2))}${amount.toFixed(2)}` : "";
  const countryCode = "5802BR";
  const merchantName = `59${pad(name.substring(0, 25))}${name.substring(0, 25)}`;
  const merchantCity = `60${pad(city.substring(0, 15))}${city.substring(0, 15)}`;
  const additionalDataFieldTemplate = `62${pad(`0503***`)}0503***`;
  
  const payload = `${payloadFormatIndicator}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalDataFieldTemplate}6304`;
  
  // Simple CRC16 CCITT (Kermit) - Simplified for this context
  // In a real app, use a robust crc16 library. 
  // For now, we'll just return the payload without CRC or a dummy one if needed.
  // Most PIX apps require the CRC. Let's add a basic one.
  const crc16 = (data: string) => {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
        else crc <<= 1;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  return `${payload}${crc16(payload)}`;
};

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group relative overflow-hidden",
        active ? "bg-primary text-white shadow-lg shadow-primary/20 kinetic-glow" : "text-on-surface-variant hover:bg-outline/10 hover:text-on-surface"
      )}
    >
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="absolute inset-0 bg-primary z-0"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className={cn("transition-transform group-hover:scale-110 relative z-10", active && "text-white")}>{icon}</span>
      <span className="text-sm font-bold tracking-tight relative z-10">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-60 relative z-10" />}
    </button>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string, trend: string }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-surface-container p-4 sm:p-6 rounded-3xl border border-outline space-y-3 sm:space-y-4 hover:border-primary/30 transition-all hover:translate-y-[-4px] kinetic-glow">
      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-2xl sm:text-3xl font-headline font-black">{value}</span>
        <span className={cn(
          "text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-lg",
          isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-on-surface-variant"
        )}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function InputGroup({ 
  label, 
  placeholder = "", 
  type = "text", 
  value, 
  onChange, 
  error,
  required = false
}: { 
  label: string, 
  placeholder?: string, 
  type?: string,
  value?: string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  error?: string,
  required?: boolean
}) {
  const isDirty = value && value.trim().length > 0;
  const isValid = isDirty && !error;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
          {label}
          {required && <span className="text-primary font-black animate-pulse">*</span>}
        </label>
        {error && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[9px] sm:text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1"
          >
            <AlertCircle size={10} />
            {error}
          </motion.span>
        )}
        {isValid && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-emerald-500"
          >
            <CheckCircle2 size={12} />
          </motion.span>
        )}
      </div>
      <div className="relative group">
        <input 
          type={type} 
          value={value}
          onChange={onChange}
          placeholder={placeholder} 
          className={cn(
            "w-full bg-surface-container-low border rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-white/5",
            error 
              ? "border-red-500/50 focus:border-red-500 ring-4 ring-red-500/5" 
              : isValid
                ? "border-emerald-500/30 focus:border-emerald-500 ring-4 ring-emerald-500/5"
                : "border-outline focus:border-primary ring-4 ring-primary/5 focus:ring-primary/10"
          )}
        />
        {isDirty && !error && !isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30">
            <CheckCircle2 size={16} />
          </div>
        )}
      </div>
    </div>
  );
}

function DocItem({ label, date }: { label: string, date: string }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-3">
        <FileText size={16} className="text-on-surface-variant/40 group-hover:text-primary transition-colors" />
        <div>
          <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{label}</p>
          <p className="text-[10px] text-on-surface-variant/60">{date}</p>
        </div>
      </div>
      <Download size={14} className="text-on-surface-variant/40 opacity-0 group-hover:opacity-100 transition-all" />
    </div>
  );
}
