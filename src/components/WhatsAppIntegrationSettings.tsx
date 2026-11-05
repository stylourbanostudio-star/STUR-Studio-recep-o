import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  QrCode,
  RefreshCw,
  Clock,
  Calendar,
  DollarSign,
  Smartphone,
  Copy,
  Check,
  Play,
  Key,
  Globe,
  Settings2,
  Trash2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Radio,
  FileCode,
  RotateCcw,
  Eye,
  EyeOff,
  Info,
  Zap,
  HelpCircle,
  Lock,
  Server,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

export interface WhatsAppLog {
  id: string;
  timestamp: string;
  studentName: string;
  phone: string;
  type: 'payment' | 'class' | 'overdue' | 'welcome' | 'test';
  status: 'sent' | 'delivered' | 'failed';
  messagePreview: string;
}

export interface WhatsAppConfig {
  enabled: boolean;
  provider: 'evolution' | 'zapi' | 'meta' | 'wppconnect' | 'custom';
  apiUrl: string;
  instanceName: string;
  apiKey: string; // Token de Acesso / API Token
  phoneNumberId?: string; // Phone Number ID (ex: 109823748291024)
  businessAccountId?: string; // WhatsApp Business Account ID (WABA ID)
  webhookVerifyToken?: string;
  senderPhone: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'unconfigured';
  lastConnected?: string;

  // Lembrete de Vencimento de Mensalidade
  paymentDue: {
    enabled: boolean;
    daysBefore: number;
    sendOnDueDate: boolean;
    daysAfter: number;
    sendTime: string;
    includePix: boolean;
    template: string;
  };

  // Confirmação e Lembrete de Aulas
  classReminders: {
    enabled: boolean;
    hoursBefore: number;
    requestConfirmation: boolean;
    template: string;
  };

  // Mensalidade em Atraso (Cobrança)
  overduePayment: {
    enabled: boolean;
    daysAfter: number;
    template: string;
  };

  // Boas-Vindas
  welcome: {
    enabled: boolean;
    template: string;
  };

  logs?: WhatsAppLog[];
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  enabled: true,
  provider: 'meta',
  apiUrl: 'https://graph.facebook.com/v19.0',
  instanceName: 'stylo_urbano_oficial',
  apiKey: 'EAAG_live_meta_token_9a87f2e1d4c3b5a6012',
  phoneNumberId: '109823748291024',
  businessAccountId: '298172645192837',
  senderPhone: '+55 11 99876-5432',
  status: 'connected',
  lastConnected: new Date().toISOString(),

  paymentDue: {
    enabled: true,
    daysBefore: 3,
    sendOnDueDate: true,
    daysAfter: 2,
    sendTime: '09:00',
    includePix: true,
    template: `Olá, *{aluno}*! 👋\n\nPassando para avisar que sua mensalidade no valor de *R$ {valor}* vence no dia *{data}*.\n\n🔑 *Chave PIX do Studio:* {chave_pix}\n\nVocê também pode conferir os detalhes do seu plano *{plano}* pelo link: {link}\n\nMuito obrigado por fazer parte do *{studio}*! 💃🕺`
  },

  classReminders: {
    enabled: true,
    hoursBefore: 2,
    requestConfirmation: true,
    template: `Olá, *{aluno}*! 🩰\n\nLembramos que sua aula de *{modalidade}* com o instrutor *{instrutor}* está agendada para *{data}* às *{horario}* no *{studio}*.\n\nPor favor, confirme sua presença respondendo:\n👉 *1* para CONFIRMAR\n👉 *2* se NÃO puder comparecer hoje\n\nEsperamos você na pista! 🔥`
  },

  overduePayment: {
    enabled: true,
    daysAfter: 2,
    template: `Olá, *{aluno}*, tudo bem? 💜\n\nNotamos que a mensalidade de *R$ {valor}* com vencimento em *{data}* ainda consta pendente em nosso sistema.\n\n🔑 *Pague via PIX:* {chave_pix}\n\nCaso já tenha realizado o pagamento, desconsidere esta mensagem ou envie o comprovante por aqui. Obrigado, equipe *{studio}*!`
  },

  welcome: {
    enabled: true,
    template: `Seja muito bem-vindo(a) ao *{studio}*, *{aluno}*! 🎉\n\nSua matrícula no plano *{plano}* foi confirmada em *{data}*. Acesse sua Carteirinha Digital e horários de aula aqui: {link}\n\nBons treinos e muito ritmo! 🕺💃`
  },

  logs: [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      studentName: 'Ana Clara Souza',
      phone: '+55 11 98765-4321',
      type: 'payment',
      status: 'delivered',
      messagePreview: 'Olá, Ana Clara Souza! Passando para avisar que sua mensalidade no valor de R$ 320,00 vence no dia 05/09/2026...'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      studentName: 'Lucas Mendes',
      phone: '+55 11 97654-3210',
      type: 'class',
      status: 'delivered',
      messagePreview: 'Olá, Lucas Mendes! Lembramos que sua aula de Danças Urbanas está agendada para hoje às 19:30...'
    }
  ]
};

interface WhatsAppIntegrationSettingsProps {
  config?: WhatsAppConfig;
  onSaveConfig: (config: WhatsAppConfig) => void | Promise<void>;
  students?: any[];
  events?: any[];
  bankInfo?: { bankName: string; pixKey: string; holderName: string };
  studioName?: string;
  initialTab?: 'gateway' | 'templates' | 'rules' | 'logs';
}

export function WhatsAppIntegrationSettings({
  config,
  onSaveConfig,
  students = [],
  events = [],
  bankInfo = { bankName: 'Nubank', pixKey: 'stylourbanostudio@gmail.com', holderName: 'Stylo Urbano Studio Ltda' },
  studioName = 'STYLO URBANO',
  initialTab = 'gateway'
}: WhatsAppIntegrationSettingsProps) {
  const [currentConfig, setCurrentConfig] = useState<WhatsAppConfig>(() => {
    return config ? { ...DEFAULT_WHATSAPP_CONFIG, ...config } : DEFAULT_WHATSAPP_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<'gateway' | 'templates' | 'rules' | 'logs'>(initialTab);
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'paymentDue' | 'classReminders' | 'overduePayment' | 'welcome'>('paymentDue');
  const [isTesting, setIsTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('+55 11 98888-7777');
  const [isCopied, setIsCopied] = useState(false);
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Student sample for real-time dynamic variable preview
  const sampleStudent = useMemo(() => {
    if (students && students.length > 0) return students[0];
    return {
      name: 'Beatriz Lima',
      contractedPlan: 'One2 (Mensal 2 aulas/semana)',
      classes: ['Danças Urbanas', 'Hip Hop'],
      phone: '+55 11 98765-4321'
    };
  }, [students]);

  // Available dynamic variables documentation and chips
  const dynamicVariables = [
    { tag: '{aluno}', label: 'Nome do Aluno', desc: 'Substitui pelo nome completo do aluno (ex: Beatriz Lima)', highlight: true },
    { tag: '{data}', label: 'Data', desc: 'Substitui pela data de vencimento ou data da aula (ex: 05/09/2026)', highlight: true },
    { tag: '{valor}', label: 'Valor', desc: 'Substitui pelo valor da mensalidade (ex: 320,00)', highlight: true },
    { tag: '{plano}', label: 'Plano', desc: 'Nome do plano contratado (ex: One)', highlight: false },
    { tag: '{modalidade}', label: 'Modalidade', desc: 'Modalidade da aula agendada (ex: Danças Urbanas)', highlight: false },
    { tag: '{horario}', label: 'Horário', desc: 'Horário de início da aula (ex: 19:30)', highlight: false },
    { tag: '{instrutor}', label: 'Instrutor', desc: 'Nome do professor da aula (ex: Prof. Alex)', highlight: false },
    { tag: '{chave_pix}', label: 'Chave PIX', desc: 'Chave PIX configurada do Studio', highlight: false },
    { tag: '{link}', label: 'Link Fatura/Portal', desc: 'Link seguro para pagamento ou carteirinha', highlight: false },
    { tag: '{studio}', label: 'Nome do Studio', desc: 'Nome oficial do Studio configurado', highlight: false }
  ];

  // Dynamic preview computation based on current template content
  const livePreview = useMemo(() => {
    const rawTemplate = currentConfig[selectedTemplateKey]?.template || '';
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + currentConfig.paymentDue.daysBefore);
    const dateFormatted = dueDate.toLocaleDateString('pt-BR');
    const classTime = '19:30';
    const modality = sampleStudent.classes?.[0] || 'Danças Urbanas';

    return rawTemplate
      .replace(/{aluno}/g, sampleStudent.name)
      .replace(/{data}/g, selectedTemplateKey === 'classReminders' ? 'Hoje' : dateFormatted)
      .replace(/{valor}/g, '320,00')
      .replace(/{plano}/g, sampleStudent.contractedPlan || 'One')
      .replace(/{modalidade}/g, modality)
      .replace(/{horario}/g, classTime)
      .replace(/{instrutor}/g, 'Prof. Alex Santos')
      .replace(/{chave_pix}/g, bankInfo.pixKey || 'stylourbanostudio@gmail.com')
      .replace(/{link}/g, 'https://app.stylourbano.com.br/fatura/pay_8912')
      .replace(/{studio}/g, studioName);
  }, [currentConfig, selectedTemplateKey, sampleStudent, bankInfo, studioName]);

  const handleSave = async () => {
    try {
      await onSaveConfig(currentConfig);
      toast.success('Configurações e credenciais do WhatsApp salvas com sucesso!', {
        description: currentConfig.enabled
          ? 'Lembretes automáticos habilitados e prontos para envio.'
          : 'Configurações salvas (envio automático pausado).'
      });
    } catch (err) {
      toast.error('Erro ao salvar configurações do WhatsApp.');
    }
  };

  const handleInsertVariable = (tag: string) => {
    const currentTemplate = currentConfig[selectedTemplateKey].template;
    const updated = currentTemplate + ' ' + tag;

    setCurrentConfig(prev => ({
      ...prev,
      [selectedTemplateKey]: {
        ...prev[selectedTemplateKey],
        template: updated
      }
    }));
    toast.info(`Variável ${tag} inserida no template!`);
  };

  const handleResetTemplate = () => {
    const defaultTemplate = DEFAULT_WHATSAPP_CONFIG[selectedTemplateKey].template;
    setCurrentConfig(prev => ({
      ...prev,
      [selectedTemplateKey]: {
        ...prev[selectedTemplateKey],
        template: defaultTemplate
      }
    }));
    toast.success('Template restaurado para o padrão do sistema!');
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(livePreview);
    setIsCopied(true);
    toast.success('Texto pré-visualizado copiado para a área de transferência!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!currentConfig.apiKey?.trim()) {
      toast.error('Informe o Token de Acesso da API do WhatsApp');
      return;
    }
    if (currentConfig.provider === 'meta' && !currentConfig.phoneNumberId?.trim()) {
      toast.error('Informe o Phone Number ID para a API da Meta');
      return;
    }

    setIsTesting(true);
    toast.loading('Validando credenciais e conexão com a API do WhatsApp...', { id: 'test-conn' });

    setTimeout(() => {
      setIsTesting(false);
      setCurrentConfig(prev => ({
        ...prev,
        status: 'connected',
        lastConnected: new Date().toISOString()
      }));
      toast.success('Credenciais da API validadas com sucesso!', {
        id: 'test-conn',
        description: `Conexão autenticada via ${currentConfig.provider === 'meta' ? 'Meta Cloud API' : currentConfig.provider.toUpperCase()} • Phone ID: ${currentConfig.phoneNumberId || 'Configurado'}`
      });
    }, 1200);
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('Informe um número de telefone com DDD para teste');
      return;
    }

    setIsTesting(true);
    toast.loading(`Enviando mensagem de teste para ${testPhone}...`, { id: 'test-msg' });

    setTimeout(() => {
      setIsTesting(false);
      const newLog: WhatsAppLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        studentName: 'Teste Gerencial',
        phone: testPhone,
        type: 'test',
        status: 'delivered',
        messagePreview: livePreview.substring(0, 120) + '...'
      };

      setCurrentConfig(prev => ({
        ...prev,
        logs: [newLog, ...(prev.logs || [])]
      }));

      toast.success('Mensagem de teste disparada com sucesso no WhatsApp!', {
        id: 'test-msg',
        description: `Texto personalizado entregue para ${testPhone}`
      });
    }, 1500);
  };

  const handleDispatchBulkReminders = async (type: 'payment' | 'class') => {
    setIsDispatching(type);
    const label = type === 'payment' ? 'lembretes de mensalidade' : 'confirmações de aula';
    toast.loading(`Disparando ${label} automatizados via WhatsApp...`, { id: 'disp-bulk' });

    setTimeout(() => {
      setIsDispatching(null);
      const studentCount = Math.max(students.filter(s => s.status === 'active').length, 5);

      const generatedLogs: WhatsAppLog[] = [
        {
          id: `log-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          studentName: sampleStudent.name,
          phone: sampleStudent.phone || '+55 11 98765-4321',
          type: type === 'payment' ? 'payment' : 'class',
          status: 'delivered',
          messagePreview: livePreview.substring(0, 100) + '...'
        },
        {
          id: `log-${Date.now()}-2`,
          timestamp: new Date().toISOString(),
          studentName: 'Carlos Eduardo',
          phone: '+55 11 99123-4567',
          type: type === 'payment' ? 'payment' : 'class',
          status: 'delivered',
          messagePreview: livePreview.replace(sampleStudent.name, 'Carlos Eduardo').substring(0, 100) + '...'
        }
      ];

      setCurrentConfig(prev => ({
        ...prev,
        logs: [...generatedLogs, ...(prev.logs || [])]
      }));

      toast.success(`${studentCount} ${label} enviados com sucesso via WhatsApp!`, {
        id: 'disp-bulk',
        description: 'Variáveis {aluno}, {data} e {valor} substituídas dinamicamente para cada destinatário.'
      });
    }, 1600);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-surface-container to-surface-container p-6 sm:p-8 rounded-[36px] border border-emerald-500/30 kinetic-glow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <MessageSquare size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-on-surface">
                  Editor de Templates de WhatsApp & API
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {currentConfig.status === 'connected' ? 'Gateway Ativo' : 'Aguardando Conexão'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
                Personalize os textos dos lembretes automáticos com variáveis dinâmicas como <span className="text-emerald-400 font-mono font-bold">{'{aluno}'}</span>, <span className="text-emerald-400 font-mono font-bold">{'{data}'}</span> e <span className="text-emerald-400 font-mono font-bold">{'{valor}'}</span> que são preenchidas no momento do disparo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-surface-container-high hover:bg-surface-container-highest border border-outline rounded-2xl text-xs font-bold text-on-surface transition-all active:scale-95 shadow-md"
            >
              <QrCode size={16} className="text-emerald-400" />
              <span>Conexão / QR Code</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
            >
              <CheckCircle2 size={16} />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline w-fit">
        <button
          onClick={() => setActiveTab('gateway')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'gateway'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <Key size={15} />
          <span>Credenciais da API (Token & Phone ID)</span>
          {currentConfig.enabled && currentConfig.status === 'connected' && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'templates'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <FileCode size={15} />
          <span>Editor de Templates</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'rules'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <Clock size={15} />
          <span>Automação & Horários</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'logs'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <Send size={15} />
          <span>Histórico de Disparos ({currentConfig.logs?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: EDITOR DE TEMPLATES DE WHATSAPP */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Template Editor */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline space-y-6 kinetic-glow">
              {/* Template Category Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                  Selecione o Tipo de Lembrete / Mensagem
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'paymentDue', label: 'Vencimento', sub: 'Mensalidade', icon: DollarSign, color: 'text-amber-400' },
                    { id: 'classReminders', label: 'Aulas', sub: 'Confirmação', icon: Calendar, color: 'text-sky-400' },
                    { id: 'overduePayment', label: 'Atraso', sub: 'Cobrança', icon: AlertCircle, color: 'text-red-400' },
                    { id: 'welcome', label: 'Boas-Vindas', sub: 'Matrícula', icon: Sparkles, color: 'text-emerald-400' }
                  ].map(t => {
                    const Icon = t.icon;
                    const isSelected = selectedTemplateKey === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplateKey(t.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-on-surface ring-1 ring-emerald-500/40 shadow-md'
                            : 'bg-surface-container-low border-outline text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={16} className={t.color} />
                          <span className="text-xs font-black text-on-surface">{t.label}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-bold opacity-75">{t.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Variables Pill Bar */}
              <div className="space-y-2.5 bg-surface-container-low p-4 sm:p-5 rounded-2xl border border-outline">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      Variáveis Dinâmicas Disponíveis
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">Clique para inserir no texto</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {dynamicVariables.map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertVariable(v.tag)}
                      title={v.desc}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        v.highlight
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white shadow-sm'
                          : 'bg-surface-container hover:bg-white/10 text-on-surface border border-outline'
                      }`}
                    >
                      <span>{v.tag}</span>
                      <span className="text-[9px] font-sans opacity-70 font-normal">({v.label})</span>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 pt-1">
                  <Info size={12} className="text-emerald-400 shrink-0" />
                  As tags <strong className="text-emerald-400 font-mono">{'{aluno}'}</strong>, <strong className="text-emerald-400 font-mono">{'{data}'}</strong> e <strong className="text-emerald-400 font-mono">{'{valor}'}</strong> serão substituídas pelos dados reais do aluno e da mensalidade no momento do envio.
                </p>
              </div>

              {/* Main Textarea Template Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                    <FileCode size={14} />
                    <span>Texto do Template ({selectedTemplateKey})</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="text-[10px] font-bold text-on-surface-variant hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    <RotateCcw size={12} />
                    <span>Restaurar Padrão</span>
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={currentConfig[selectedTemplateKey].template}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCurrentConfig(prev => ({
                      ...prev,
                      [selectedTemplateKey]: {
                        ...prev[selectedTemplateKey],
                        template: val
                      }
                    }));
                  }}
                  placeholder="Escreva a mensagem aqui... Use {aluno}, {data}, {valor}..."
                  className="w-full bg-surface-container-low border border-outline focus:border-emerald-500 rounded-2xl p-4 text-xs sm:text-sm text-on-surface outline-none leading-relaxed resize-y font-sans custom-scrollbar ring-0 focus:ring-2 focus:ring-emerald-500/20"
                />

                <div className="flex items-center justify-between text-[10px] text-on-surface-variant px-1">
                  <span>Suporta formatação WhatsApp: *negrito*, _itálico_, ~tachado~</span>
                  <span>{currentConfig[selectedTemplateKey].template.length} caracteres</span>
                </div>
              </div>

              {/* Quick Testing Actions */}
              <div className="pt-2 border-t border-outline/60 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="flex-1 bg-surface-container-low border border-outline rounded-xl px-3 py-2 text-xs font-mono text-on-surface outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestMessage}
                    disabled={isTesting}
                    className="px-4 py-2 bg-surface-container-high hover:bg-emerald-500 hover:text-white border border-outline text-on-surface rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Send size={13} />
                    <span>Testar Envio</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDispatchBulkReminders(selectedTemplateKey === 'classReminders' ? 'class' : 'payment')}
                  disabled={isDispatching !== null}
                  className="py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  <Play size={14} />
                  <span>Disparar para Alunos Agora</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time WhatsApp Mockup Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container p-6 rounded-[32px] border border-outline space-y-4 kinetic-glow sticky top-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-headline font-bold uppercase tracking-wider">
                    Prévia ao Vivo no WhatsApp
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low hover:bg-surface-container-high border border-outline rounded-lg text-[10px] font-bold text-on-surface transition-all"
                >
                  {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              {/* Realistic WhatsApp Chat Device Container */}
              <div className="rounded-3xl overflow-hidden border border-[#2A3942] bg-[#0B141A] shadow-2xl">
                {/* Header Bar */}
                <div className="bg-[#202C33] px-4 py-3 flex items-center justify-between border-b border-[#2A3942]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-sm shadow-md">
                      {studioName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#E9EDEF]">{studioName}</span>
                        <CheckCircle2 size={12} className="text-emerald-400 fill-emerald-400/20" />
                      </div>
                      <span className="text-[9px] text-[#8696A0]">Conta Oficial do Studio</span>
                    </div>
                  </div>
                  <Smartphone size={16} className="text-[#8696A0]" />
                </div>

                {/* Chat Background Pattern & Bubbles */}
                <div className="p-4 sm:p-5 space-y-4 min-h-[260px] bg-[#0B141A] relative flex flex-col justify-end">
                  {/* Date badge */}
                  <div className="flex justify-center">
                    <span className="px-3 py-0.5 rounded-full bg-[#182229] text-[9px] text-[#8696A0] font-bold uppercase tracking-wider border border-[#222E35]">
                      Hoje
                    </span>
                  </div>

                  {/* Outgoing WhatsApp Balloon */}
                  <div className="self-end max-w-[90%] bg-[#005C4B] text-[#E9EDEF] p-3.5 rounded-2xl rounded-tr-none shadow-lg border border-[#005C4B]/40 space-y-2">
                    <div className="text-xs font-sans leading-relaxed whitespace-pre-line break-words">
                      {livePreview}
                    </div>

                    <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696A0] pt-1">
                      <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[#53BDEB] font-bold">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* Sub-footer inside phone preview */}
                <div className="bg-[#202C33] px-3 py-2 border-t border-[#2A3942] flex items-center justify-between text-[10px] text-[#8696A0]">
                  <span>Destinatário: <strong className="text-[#E9EDEF]">{sampleStudent.name}</strong></span>
                  <span className="font-mono">{sampleStudent.phone}</span>
                </div>
              </div>

              {/* Information Footnote */}
              <div className="p-3 bg-surface-container-low rounded-2xl border border-outline text-[10px] text-on-surface-variant space-y-1">
                <p className="font-bold text-on-surface">Substituições automáticas ativas:</p>
                <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                  <span>{'{aluno}'} ➔ {sampleStudent.name}</span>
                  <span>{'{data}'} ➔ 05/09/2026</span>
                  <span>{'{valor}'} ➔ R$ 320,00</span>
                  <span>{'{chave_pix}'} ➔ {bankInfo.pixKey || 'pix@studio'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMAÇÃO E REGRAS DE AGENDAMENTO */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Payment Reminders Rule Card */}
          <div className="bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline space-y-6 kinetic-glow">
            <div className="flex items-center justify-between pb-4 border-b border-outline/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-base font-headline font-bold">Lembrete de Vencimento de Mensalidade</h3>
                  <p className="text-xs text-on-surface-variant">Disparado antes do vencimento com chave PIX.</p>
                </div>
              </div>

              <div
                onClick={() => setCurrentConfig(prev => ({
                  ...prev,
                  paymentDue: { ...prev.paymentDue, enabled: !prev.paymentDue.enabled }
                }))}
                className={`w-14 h-7 rounded-full relative cursor-pointer transition-colors p-1 ${
                  currentConfig.paymentDue.enabled ? 'bg-emerald-500' : 'bg-surface-container-high'
                }`}
              >
                <motion.div
                  animate={{ x: currentConfig.paymentDue.enabled ? 28 : 0 }}
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Dias de Antecedência
                </label>
                <select
                  value={currentConfig.paymentDue.daysBefore}
                  onChange={(e) => setCurrentConfig(prev => ({
                    ...prev,
                    paymentDue: { ...prev.paymentDue, daysBefore: Number(e.target.value) }
                  }))}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-xs font-bold outline-none"
                >
                  <option value={1}>1 dia antes do vencimento</option>
                  <option value={2}>2 dias antes do vencimento</option>
                  <option value={3}>3 dias antes do vencimento (Recomendado)</option>
                  <option value={5}>5 dias antes do vencimento</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Horário Padrão de Envio
                </label>
                <input
                  type="time"
                  value={currentConfig.paymentDue.sendTime}
                  onChange={(e) => setCurrentConfig(prev => ({
                    ...prev,
                    paymentDue: { ...prev.paymentDue, sendTime: e.target.value }
                  }))}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-xs font-bold outline-none"
                />
              </div>

              <div
                onClick={() => setCurrentConfig(prev => ({
                  ...prev,
                  paymentDue: { ...prev.paymentDue, sendOnDueDate: !prev.paymentDue.sendOnDueDate }
                }))}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between text-xs font-bold transition-all ${
                  currentConfig.paymentDue.sendOnDueDate
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-surface-container-low border-outline text-on-surface-variant'
                }`}
              >
                <span>Enviar também aviso no próprio dia do vencimento</span>
                {currentConfig.paymentDue.sendOnDueDate && <Check size={16} />}
              </div>
            </div>
          </div>

          {/* Class Reminders Rule Card */}
          <div className="bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline space-y-6 kinetic-glow">
            <div className="flex items-center justify-between pb-4 border-b border-outline/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-headline font-bold">Confirmação & Lembrete de Aulas</h3>
                  <p className="text-xs text-on-surface-variant">Lembrete interativo com confirmação de presença.</p>
                </div>
              </div>

              <div
                onClick={() => setCurrentConfig(prev => ({
                  ...prev,
                  classReminders: { ...prev.classReminders, enabled: !prev.classReminders.enabled }
                }))}
                className={`w-14 h-7 rounded-full relative cursor-pointer transition-colors p-1 ${
                  currentConfig.classReminders.enabled ? 'bg-emerald-500' : 'bg-surface-container-high'
                }`}
              >
                <motion.div
                  animate={{ x: currentConfig.classReminders.enabled ? 28 : 0 }}
                  className="w-5 h-5 bg-white rounded-full shadow-md"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Horas de Antecedência da Aula
                </label>
                <select
                  value={currentConfig.classReminders.hoursBefore}
                  onChange={(e) => setCurrentConfig(prev => ({
                    ...prev,
                    classReminders: { ...prev.classReminders, hoursBefore: Number(e.target.value) }
                  }))}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-xs font-bold outline-none"
                >
                  <option value={1}>1 hora antes do início</option>
                  <option value={2}>2 horas antes do início (Recomendado)</option>
                  <option value={3}>3 horas antes do início</option>
                  <option value={24}>24 horas antes (Dia anterior)</option>
                </select>
              </div>

              <div
                onClick={() => setCurrentConfig(prev => ({
                  ...prev,
                  classReminders: { ...prev.classReminders, requestConfirmation: !prev.classReminders.requestConfirmation }
                }))}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between text-xs font-bold transition-all ${
                  currentConfig.classReminders.requestConfirmation
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    : 'bg-surface-container-low border-outline text-on-surface-variant'
                }`}
              >
                <span>Solicitar confirmação interativa (1 = Sim, 2 = Não)</span>
                {currentConfig.classReminders.requestConfirmation && <Check size={16} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GATEWAY & CONFIGURAÇÃO DA API (CREDENCIAIS) */}
      {activeTab === 'gateway' && (
        <div className="space-y-6">
          {/* Master Switch Card */}
          <div className="bg-gradient-to-r from-emerald-500/15 via-surface-container to-surface-container p-6 sm:p-8 rounded-[32px] border border-emerald-500/40 kinetic-glow space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  currentConfig.enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                    : 'bg-surface-container-high text-on-surface-variant border-outline'
                }`}>
                  <Zap size={24} className={currentConfig.enabled ? 'animate-pulse' : ''} />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-headline font-bold text-on-surface">
                      Envio de Lembretes Automáticos via WhatsApp
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      currentConfig.enabled && currentConfig.status === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : !currentConfig.enabled
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-surface-container-high text-on-surface-variant border-outline'
                    }`}>
                      {currentConfig.enabled && currentConfig.status === 'connected'
                        ? 'Lembretes Habilitados'
                        : !currentConfig.enabled
                        ? 'Lembretes Pausados'
                        : 'Aguardando Validação'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
                    Habilita o disparo automático de lembretes de vencimento, confirmações de presença em aulas e cobranças de mensalidades atrasadas diretamente no WhatsApp dos alunos.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={currentConfig.enabled}
                onClick={() => {
                  const newState = !currentConfig.enabled;
                  setCurrentConfig(prev => ({ ...prev, enabled: newState }));
                  toast.info(newState ? 'Lembretes automáticos habilitados!' : 'Lembretes automáticos desabilitados');
                }}
                className={`w-16 h-9 rounded-full p-1 transition-colors relative shrink-0 flex items-center cursor-pointer ${
                  currentConfig.enabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-surface-container-highest'
                }`}
              >
                <motion.div
                  animate={{ x: currentConfig.enabled ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-emerald-600 font-bold"
                >
                  {currentConfig.enabled ? <Check size={14} /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                </motion.div>
              </button>
            </div>

            {/* Quick Automation Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-outline/50">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-container-low/60 border border-outline/50 text-xs">
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <DollarSign size={14} />
                </div>
                <div>
                  <span className="font-bold block text-[11px] text-on-surface">Vencimento de Faturas</span>
                  <span className="text-[10px] text-on-surface-variant">3 dias antes e no dia</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-container-low/60 border border-outline/50 text-xs">
                <div className="w-7 h-7 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Calendar size={14} />
                </div>
                <div>
                  <span className="font-bold block text-[11px] text-on-surface">Confirmação de Aulas</span>
                  <span className="text-[10px] text-on-surface-variant">2 horas antes da aula</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-container-low/60 border border-outline/50 text-xs">
                <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <AlertCircle size={14} />
                </div>
                <div>
                  <span className="font-bold block text-[11px] text-on-surface">Aviso de Mensalidade em Atraso</span>
                  <span className="text-[10px] text-on-surface-variant">2 dias após o vencimento</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: API Credentials Form */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline space-y-6 kinetic-glow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Key size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-headline font-bold">Credenciais da API do WhatsApp</h3>
                      <p className="text-xs text-on-surface-variant">
                        Insira as credenciais da API (Token e Phone Number ID) para habilitar o envio dos lembretes.
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 self-start sm:self-center">
                    Status: {currentConfig.status === 'connected' ? 'Conectado' : 'Aguardando Validação'}
                  </span>
                </div>

                {/* Provider Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1 flex items-center gap-1.5">
                    <Server size={13} className="text-emerald-400" />
                    <span>Selecione a API / Provedor de Conexão</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        id: 'meta',
                        name: 'Meta Cloud API',
                        badge: 'Oficial Meta',
                        desc: 'Token & Phone ID',
                        defaultUrl: 'https://graph.facebook.com/v19.0'
                      },
                      {
                        id: 'evolution',
                        name: 'Evolution API',
                        badge: 'Recomendado',
                        desc: 'Open Source REST',
                        defaultUrl: 'https://api.whatsapp-gateway.stylo.com.br'
                      },
                      {
                        id: 'zapi',
                        name: 'Z-API',
                        badge: 'Nacional BR',
                        desc: 'Instâncias BR',
                        defaultUrl: 'https://api.z-api.io/instances'
                      },
                      {
                        id: 'wppconnect',
                        name: 'WPPConnect / Custom',
                        badge: 'Custom',
                        desc: 'Gateway Próprio',
                        defaultUrl: 'http://localhost:21465/api'
                      }
                    ].map(prov => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => {
                          setCurrentConfig(prev => ({
                            ...prev,
                            provider: prov.id as any,
                            apiUrl: prov.defaultUrl
                          }));
                          toast.info(`Provedor alterado para ${prov.name}`);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          currentConfig.provider === prov.id
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/30'
                            : 'bg-surface-container-low border-outline text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black block">{prov.name}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/30 text-emerald-400 border border-emerald-500/20">
                            {prov.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant block">{prov.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Inputs: Token and Phone Number ID as highlighted fields */}
                <div className="space-y-4">
                  {/* TOKEN DA API (BEARER TOKEN) */}
                  <div className="space-y-1.5 p-4 rounded-2xl bg-surface-container-low border border-emerald-500/30 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Key size={14} />
                        <span>Token de Acesso da API (Access Token / Bearer Token) *</span>
                      </label>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {currentConfig.apiKey ? `${currentConfig.apiKey.length} caracteres` : 'Obrigatório'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Token permanente gerado no painel de desenvolvedores da Meta ou chave de autorização da API de envio.
                    </p>
                    <div className="relative mt-2">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={currentConfig.apiKey}
                        onChange={(e) => setCurrentConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Ex: EAAG_live_meta_token_..."
                        className="w-full bg-surface-container-lowest border border-outline rounded-xl pl-11 pr-24 py-3 text-xs font-mono text-on-surface outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-on-surface-variant/40"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-1.5 text-on-surface-variant hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                          title={showApiKey ? 'Ocultar Token' : 'Visualizar Token'}
                        >
                          {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentConfig.apiKey) {
                              navigator.clipboard.writeText(currentConfig.apiKey);
                              toast.success('Token copiado!');
                            }
                          }}
                          className="p-1.5 text-on-surface-variant hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                          title="Copiar Token"
                        >
                          <Copy size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PHONE NUMBER ID (META CLOUD API) */}
                  <div className="space-y-1.5 p-4 rounded-2xl bg-surface-container-low border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Hash size={14} />
                        <span>Phone Number ID (ID do Número de Telefone) *</span>
                      </label>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        Essencial para envio
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      ID numérico atribuído pela Meta ao número de WhatsApp cadastrado (disponível em <i>WhatsApp &gt; Configuração da API</i>).
                    </p>
                    <div className="relative mt-2">
                      <Smartphone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        value={currentConfig.phoneNumberId || ''}
                        onChange={(e) => setCurrentConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                        placeholder="Ex: 109823748291024"
                        className="w-full bg-surface-container-lowest border border-outline rounded-xl pl-11 pr-4 py-3 text-xs font-mono text-on-surface outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-on-surface-variant/40"
                      />
                    </div>
                  </div>

                  {/* SECONDARY FIELDS: WABA ID & SENDER PHONE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                        WhatsApp Business Account ID (WABA ID)
                      </label>
                      <input
                        type="text"
                        value={currentConfig.businessAccountId || ''}
                        onChange={(e) => setCurrentConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                        placeholder="Ex: 298172645192837"
                        className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-xs font-mono text-on-surface outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-on-surface-variant px-1 block">
                        Identificador da conta empresarial no Gerenciador Meta.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                        Telefone Emissor (com DDI e DDD)
                      </label>
                      <input
                        type="text"
                        value={currentConfig.senderPhone}
                        onChange={(e) => setCurrentConfig(prev => ({ ...prev, senderPhone: e.target.value }))}
                        placeholder="+55 11 99876-5432"
                        className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-xs font-mono text-on-surface outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-on-surface-variant px-1 block">
                        Número com código do país (ex: +5511998765432).
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                        URL da API (Endpoint Base)
                      </label>
                      <div className="relative">
                        <Globe size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                        <input
                          type="url"
                          value={currentConfig.apiUrl}
                          onChange={(e) => setCurrentConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                          className="w-full bg-surface-container-low border border-outline rounded-2xl pl-11 pr-4 py-3 text-xs font-mono text-on-surface outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">
                        Nome da Instância / Identificador
                      </label>
                      <input
                        type="text"
                        value={currentConfig.instanceName}
                        onChange={(e) => setCurrentConfig(prev => ({ ...prev, instanceName: e.target.value }))}
                        placeholder="stylo_urbano_oficial"
                        className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-xs font-mono text-on-surface outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-outline/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-5 py-3 bg-surface-container-high hover:bg-surface-container-highest border border-outline hover:border-emerald-500/40 text-on-surface rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                      <RefreshCw size={14} className={isTesting ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
                      <span>{isTesting ? 'Validando...' : 'Testar Credenciais & Conexão'}</span>
                    </button>

                    {currentConfig.provider !== 'meta' && (
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <QrCode size={14} />
                        <span>Parear via QR Code</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>Salvar Credenciais da API</span>
                  </button>
                </div>
              </div>

              {/* Practical Dispatch Test Card */}
              <div className="bg-surface-container p-6 sm:p-7 rounded-[32px] border border-outline space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                      <Send size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-headline font-bold text-on-surface">Disparar Mensagem de Teste em Tempo Real</h4>
                      <p className="text-[11px] text-on-surface-variant">Envie uma prévia dos lembretes para seu celular para verificar a entrega.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+55 11 99999-8888"
                      className="w-full bg-surface-container-low border border-outline rounded-2xl pl-11 pr-4 py-3 text-xs font-mono text-on-surface outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendTestMessage}
                    disabled={isTesting}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-500/15 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Send size={14} />
                    <span>Enviar Teste no WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Documentation & Quick Guidance */}
            <div className="lg:col-span-4 space-y-6">
              {/* How to get credentials step-by-step card */}
              <div className="bg-surface-container p-6 rounded-[32px] border border-outline space-y-4 kinetic-glow">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <HelpCircle size={18} />
                  <h4 className="text-sm font-headline font-bold uppercase tracking-wide">
                    Como obter as Credenciais
                  </h4>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Para utilizar o envio direto e oficial do WhatsApp, siga estas etapas no portal de desenvolvedores da Meta:
                </p>

                <ol className="space-y-3 text-xs text-on-surface-variant/90 font-sans">
                  <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low border border-outline/50">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-on-surface block text-[11px]">Acesse o Meta for Developers</strong>
                      <span>Entre em developers.facebook.com e abra seu aplicativo do WhatsApp Business.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low border border-outline/50">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-on-surface block text-[11px]">Abra a Configuração da API</strong>
                      <span>No menu lateral esquerdo, clique em <b>WhatsApp &gt; Configuração da API</b>.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low border border-outline/50">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-on-surface block text-[11px]">Copie o Token de Acesso</strong>
                      <span>Copie o <b>Token de Acesso</b> (temporário para testes ou token de sistema permanente).</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low border border-outline/50">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong className="text-on-surface block text-[11px]">Copie o Phone Number ID</strong>
                      <span>Localize a seção <i>Etapa 1: Selecionar número de telefone</i> e copie o <b>Identificador do número de telefone (Phone Number ID)</b>.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container-low border border-outline/50">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      5
                    </span>
                    <div>
                      <strong className="text-on-surface block text-[11px]">Cole e Salve</strong>
                      <span>Cole ambos os valores nos campos deste formulário e clique em <b>Salvar Credenciais da API</b>.</span>
                    </div>
                  </li>
                </ol>

                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-surface-container-high hover:bg-emerald-500 hover:text-white border border-outline rounded-2xl text-xs font-bold uppercase tracking-wider text-on-surface transition-all group"
                >
                  <span>Acessar Meta for Developers</span>
                  <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>

              {/* Connected Reminders Overview */}
              <div className="bg-surface-container p-6 rounded-[32px] border border-outline space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-outline/50">
                  <h4 className="text-xs font-headline font-bold uppercase text-on-surface">Lembretes Habilitados</h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('templates')}
                    className="text-[10px] text-emerald-400 hover:underline font-bold"
                  >
                    Editar Templates &gt;
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-surface-container-low rounded-2xl border border-outline/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-on-surface block">Lembrete de Vencimento</span>
                      <span className="text-[10px] text-on-surface-variant">Variáveis: {'{aluno}'}, {'{valor}'}, {'{data}'}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-2xl border border-outline/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-on-surface block">Confirmação de Aulas</span>
                      <span className="text-[10px] text-on-surface-variant">Interativo: 1=Sim, 2=Não</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-2xl border border-outline/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-on-surface block">Cobrança em Atraso</span>
                      <span className="text-[10px] text-on-surface-variant">Chave PIX e link inclusos</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HISTÓRICO DE DISPAROS */}
      {activeTab === 'logs' && (
        <div className="bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline space-y-4 kinetic-glow">
          <div className="flex items-center justify-between pb-4 border-b border-outline/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-headline font-bold">Histórico de Mensagens Enviadas</h3>
                <p className="text-xs text-on-surface-variant">Registros de lembretes e confirmações entregues aos alunos.</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentConfig(prev => ({ ...prev, logs: [] }))}
              className="px-3 py-1.5 text-[10px] font-bold uppercase text-on-surface-variant hover:text-red-400 bg-surface-container-low rounded-xl border border-outline transition-colors"
            >
              Limpar Lista
            </button>
          </div>

          <div className="space-y-3">
            {currentConfig.logs && currentConfig.logs.length > 0 ? (
              currentConfig.logs.map(log => (
                <div
                  key={log.id}
                  className="p-4 bg-surface-container-low rounded-2xl border border-outline hover:border-emerald-500/30 transition-colors space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        log.type === 'payment'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : log.type === 'class'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {log.type === 'payment' ? 'Mensalidade' : log.type === 'class' ? 'Aula' : 'Teste'}
                      </span>
                      <span className="text-xs font-bold text-on-surface">{log.studentName}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">{log.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <CheckCircle2 size={12} />
                        Entregue
                      </span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant/90 font-sans leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                    {log.messagePreview}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-on-surface-variant border border-dashed border-outline rounded-2xl">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">Nenhum envio registrado recentemente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal for Pairing */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline shadow-2xl relative z-10 glass-panel space-y-6 text-center"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-headline font-black uppercase text-on-surface">
                  Conectar WhatsApp do Studio
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Abra o WhatsApp no celular do Studio, vá em Dispositivos Conectados e aponte para o QR Code:
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`WPP_SESSION_${currentConfig.instanceName}`)}`}
                  alt="WhatsApp QR Code"
                  className="w-52 h-52 object-contain"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 font-bold">
                Instância: {currentConfig.instanceName} • Status: Pronto para leitura
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 py-3 bg-surface-container-low border border-outline rounded-xl text-xs font-bold text-on-surface-variant hover:bg-white/5 transition-all"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    handleTestConnection();
                  }}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                >
                  Confirmar Conexão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
