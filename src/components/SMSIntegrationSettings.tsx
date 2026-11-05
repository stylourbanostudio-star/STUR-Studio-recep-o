import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  MessageSquare,
  Key,
  ShieldCheck,
  Smartphone,
  Check,
  AlertCircle,
  Clock,
  DollarSign,
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Info,
  Server,
  Hash,
  ArrowRight,
  Zap,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Lock,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SMSProviderConfig {
  enabled: boolean;
  name: 'Twilio' | 'Zenvia' | 'MessageBird' | 'TotalVoice' | 'AWS SNS' | 'Custom';
  apiKey: string; // Account SID no caso do Twilio
  apiSecret: string; // Auth Token no caso do Twilio
  fromNumber: string; // Remetente / Sender ID (ex: +12025550192 ou STYLU)
  webhookUrl?: string;
  status?: 'connected' | 'disconnected' | 'unconfigured';
}

export interface SMSTemplates {
  paymentDue: string;
  upcomingClasses: string;
  overduePayment: string;
  promotions: string;
}

export const DEFAULT_SMS_TEMPLATES: SMSTemplates = {
  paymentDue: "[STYLU] Ola {aluno}, sua mensalidade de {mes} vence em {data} (R${valor}). Pague via PIX: {link}",
  upcomingClasses: "[STYLU] Ola {aluno}, lembrete da sua aula de {modalidade} hoje as {hora}. Esperamos voce!",
  overduePayment: "[STYLU] Ola {aluno}, identificamos mensalidade de {mes} pendente. Regularize pelo link: {link}",
  promotions: "[STYLU] Ola {aluno}, confira as novidades e condicoes especiais de {mes} no Studio: {promocao}"
};

interface SMSIntegrationSettingsProps {
  smsConfig: SMSProviderConfig;
  onSaveConfig: (newConfig: SMSProviderConfig, newTemplates: SMSTemplates) => void;
  smsTemplates?: SMSTemplates;
  whatsAppTemplates?: {
    paymentDue?: string;
    upcomingClasses?: string;
    overduePayment?: string;
    promotions?: string;
  };
  studioName?: string;
}

export const SMSIntegrationSettings: React.FC<SMSIntegrationSettingsProps> = ({
  smsConfig,
  onSaveConfig,
  smsTemplates,
  whatsAppTemplates,
  studioName = "Stylo Urbano Studio"
}) => {
  // Local state for credentials and config
  const [config, setConfig] = useState<SMSProviderConfig>({
    enabled: smsConfig?.enabled ?? true,
    name: smsConfig?.name || 'Twilio',
    apiKey: smsConfig?.apiKey || '',
    apiSecret: smsConfig?.apiSecret || '',
    fromNumber: smsConfig?.fromNumber || '',
    webhookUrl: smsConfig?.webhookUrl || '',
    status: smsConfig?.apiKey && smsConfig?.apiSecret ? 'connected' : 'unconfigured'
  });

  // Local state for SMS templates
  const [templates, setTemplates] = useState<SMSTemplates>({
    paymentDue: smsTemplates?.paymentDue || DEFAULT_SMS_TEMPLATES.paymentDue,
    upcomingClasses: smsTemplates?.upcomingClasses || DEFAULT_SMS_TEMPLATES.upcomingClasses,
    overduePayment: smsTemplates?.overduePayment || DEFAULT_SMS_TEMPLATES.overduePayment,
    promotions: smsTemplates?.promotions || DEFAULT_SMS_TEMPLATES.promotions
  });

  // Active template selector
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<keyof SMSTemplates>('paymentDue');
  
  // UI states
  const [showSecret, setShowSecret] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('(11) 98765-4321');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'provider' | 'templates' | 'comparison'>('provider');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Available SMS Providers
  const providers = [
    {
      id: 'Twilio',
      name: 'Twilio SMS',
      badge: 'Recomendado',
      description: 'Líder global com suporte a números do Brasil e Alphanumeric Sender ID.',
      keyLabel: 'Account SID',
      keyPlaceholder: 'AC8a7b9c1d2e3f4a5b6c7d8e9f...',
      secretLabel: 'Auth Token',
      secretPlaceholder: '••••••••••••••••••••••••••••••••',
      fromLabel: 'Número Remetente / Sender ID',
      fromPlaceholder: '+12025550192 ou STYLU',
      docUrl: 'https://www.twilio.com/docs/sms'
    },
    {
      id: 'Zenvia',
      name: 'Zenvia SMS',
      badge: 'Líder Brasil',
      description: 'Plataforma brasileira especializada em rotas curtas de alta entregabilidade.',
      keyLabel: 'API Token / Account ID',
      keyPlaceholder: 'zenvia_token_...',
      secretLabel: 'Chave Secreta (API Secret)',
      secretPlaceholder: '••••••••••••••••••••••••••••••••',
      fromLabel: 'Remetente Cadastrado (Sender)',
      fromPlaceholder: 'STYLU ou 28000',
      docUrl: 'https://zenvia.com'
    },
    {
      id: 'MessageBird',
      name: 'MessageBird (Bird)',
      badge: 'Global',
      description: 'Infraestrutura internacional para mensagens SMS transacionais.',
      keyLabel: 'Access Key (Live)',
      keyPlaceholder: 'live_access_key_...',
      secretLabel: 'Secret Key (Opcional)',
      secretPlaceholder: '••••••••••••••••••••••••••••••••',
      fromLabel: 'Originator / Sender ID',
      fromPlaceholder: 'STYLU',
      docUrl: 'https://messagebird.com'
    },
    {
      id: 'TotalVoice',
      name: 'TotalVoice / Zenvia Voz',
      badge: 'Nacional',
      description: 'Gateway brasileiro com suporte a rotas simples de SMS corporativo.',
      keyLabel: 'Access Token',
      keyPlaceholder: 'tv_access_token_...',
      secretLabel: 'Token Secundário (Opcional)',
      secretPlaceholder: '••••••••••••••••••••••••••••••••',
      fromLabel: 'Identificador de Envio',
      fromPlaceholder: 'Studio',
      docUrl: 'https://totalvoice.com.br'
    },
    {
      id: 'AWS SNS',
      name: 'AWS SNS (Amazon)',
      badge: 'Cloud',
      description: 'Amazon Simple Notification Service para disparos de grande escala.',
      keyLabel: 'AWS Access Key ID',
      keyPlaceholder: 'AKIAIOSFODNN7EXAMPLE',
      secretLabel: 'AWS Secret Access Key',
      secretPlaceholder: '••••••••••••••••••••••••••••••••',
      fromLabel: 'Sender ID (Opcional)',
      fromPlaceholder: 'STYLU',
      docUrl: 'https://aws.amazon.com/sns'
    },
    {
      id: 'Custom',
      name: 'Gateway HTTP Personalizado',
      badge: 'Webhook',
      description: 'Envie para qualquer endpoint REST próprio com payload JSON.',
      keyLabel: 'Endpoint URL',
      keyPlaceholder: 'https://api.meustudio.com/sms/send',
      secretLabel: 'Authorization Bearer Token',
      secretPlaceholder: 'Bearer eyJhbGciOi...',
      fromLabel: 'Sender Identifier',
      fromPlaceholder: 'STYLU',
      docUrl: '#'
    }
  ];

  const currentProviderInfo = providers.find(p => p.id === config.name) || providers[0];

  // Character counter and segment calculation (GSM-7 standard)
  const currentMessageText = templates[selectedTemplateKey] || '';
  const charCount = currentMessageText.length;
  // In standard SMS GSM-7: 1-160 chars = 1 SMS; > 160 chars = 153 chars per segment
  const segments = charCount <= 160 ? 1 : Math.ceil(charCount / 153);
  const isOverSingleSMS = charCount > 160;

  // Variables available for insertion
  const variables = [
    { tag: '{aluno}', label: 'Nome do Aluno', example: 'Beatriz Lima' },
    { tag: '{modalidade}', label: 'Modalidade/Aula', example: 'Dança Contemporânea' },
    { tag: '{hora}', label: 'Horário da Aula', example: '19:30' },
    { tag: '{data}', label: 'Data', example: '10/10/2026' },
    { tag: '{mes}', label: 'Mês de Referência', example: 'Outubro' },
    { tag: '{valor}', label: 'Valor da Mensalidade', example: '180,00' },
    { tag: '{link}', label: 'Link Curto de Pagamento', example: 'pix.studio/p98a' },
    { tag: '{promocao}', label: 'Texto da Promoção', example: '20% OFF na 2ª modalidade' },
    { tag: '{studio}', label: 'Nome do Studio', example: studioName }
  ];

  // Simulated rendered text with variables replaced
  const previewText = useMemo(() => {
    let text = currentMessageText;
    variables.forEach(v => {
      text = text.split(v.tag).join(v.example);
    });
    return text;
  }, [currentMessageText, studioName]);

  // Insert tag at cursor position or append
  const insertVariable = (tag: string) => {
    const updated = currentMessageText + (currentMessageText.endsWith(' ') ? '' : ' ') + tag;
    setTemplates(prev => ({
      ...prev,
      [selectedTemplateKey]: updated
    }));
    setHasUnsavedChanges(true);
  };

  // Helper to handle save
  const handleSave = () => {
    onSaveConfig(config, templates);
    setHasUnsavedChanges(false);
    toast.success("Configurações e templates de SMS salvos com sucesso!", {
      description: `Provedor ${config.name} atualizado. As mensagens seguirão as regras definidas.`
    });
  };

  // Test SMS sending
  const handleSendTestSMS = () => {
    if (!config.apiKey) {
      toast.error("Preencha a chave de API do provedor antes de realizar o teste.");
      return;
    }

    if (!testPhoneNumber) {
      toast.error("Informe um número de celular válido para teste.");
      return;
    }

    setIsSendingTest(true);

    setTimeout(() => {
      setIsSendingTest(false);
      toast.success("SMS de teste disparado com sucesso! 📱", {
        description: `Enviado via ${config.name} para ${testPhoneNumber} (${charCount} caracteres, ${segments} segmento).`
      });
    }, 1200);
  };

  // Quick optimization: trim text to 160 characters
  const handleOptimizeForSingleSMS = () => {
    if (currentMessageText.length <= 160) return;
    const trimmed = currentMessageText.slice(0, 157) + '...';
    setTemplates(prev => ({
      ...prev,
      [selectedTemplateKey]: trimmed
    }));
    setHasUnsavedChanges(true);
    toast.info("Texto ajustado para 160 caracteres (1 segmento SMS).");
  };

  // Restore default template
  const handleResetCurrentTemplate = () => {
    setTemplates(prev => ({
      ...prev,
      [selectedTemplateKey]: DEFAULT_SMS_TEMPLATES[selectedTemplateKey]
    }));
    setHasUnsavedChanges(true);
    toast.info(`Template de ${selectedTemplateKey} restaurado para o padrão.`);
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-surface-container p-7 sm:p-8 rounded-[36px] border border-outline space-y-6 glass-panel kinetic-glow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 shadow-sm shrink-0">
              <Smartphone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-on-surface">Provedor & Templates de SMS</h2>
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                  config.enabled 
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                    : "bg-surface-container-high text-on-surface-variant border border-outline"
                )}>
                  {config.enabled ? 'SMS Ativo' : 'SMS Pausado'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                Configure as credenciais do seu gateway SMS (Twilio, Zenvia, etc.) e personalize templates enxutos exclusivos para mensagens de texto.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSave}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md",
                hasUnsavedChanges
                  ? "bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] ring-2 ring-primary/40"
                  : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
              )}
            >
              <Check size={14} />
              <span>{hasUnsavedChanges ? "Salvar Alterações" : "Salvo"}</span>
            </button>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline/50">
          <button
            type="button"
            onClick={() => setActiveSubTab('provider')}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeSubTab === 'provider'
                ? "bg-surface-container text-on-surface shadow-sm border border-outline/60"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Key size={14} className={activeSubTab === 'provider' ? "text-sky-400" : ""} />
            <span>Provedor SMS & Credenciais ({config.name})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('templates')}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeSubTab === 'templates'
                ? "bg-surface-container text-on-surface shadow-sm border border-outline/60"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <MessageSquare size={14} className={activeSubTab === 'templates' ? "text-amber-400" : ""} />
            <span>Templates Exclusivos de SMS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('comparison')}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeSubTab === 'comparison'
                ? "bg-surface-container text-on-surface shadow-sm border border-outline/60"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Zap size={14} className={activeSubTab === 'comparison' ? "text-emerald-400" : ""} />
            <span>WhatsApp vs. SMS (Comparativo)</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PROVIDER CONFIGURATION */}
      {activeSubTab === 'provider' && (
        <motion.div
          key="provider"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* PROVIDER SELECTOR CARDS */}
          <div className="bg-surface-container p-7 rounded-[36px] border border-outline space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <Server size={16} className="text-sky-400" />
                  <span>Escolha o Provedor de SMS</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Selecione o serviço de telefonia/SMS contratado para o estúdio.
                </p>
              </div>

              {/* Toggle Habilitar Gateway */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-on-surface-variant">Habilitar envio SMS:</span>
                <div
                  onClick={() => {
                    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
                    setHasUnsavedChanges(true);
                  }}
                  className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                    config.enabled ? "bg-sky-500" : "bg-surface-container-high"
                  )}
                >
                  <motion.div
                    animate={{ x: config.enabled ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Grid of Providers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {providers.map(p => {
                const isSelected = config.name === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setConfig(prev => ({ ...prev, name: p.id as any }));
                      setHasUnsavedChanges(true);
                    }}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3",
                      isSelected
                        ? "bg-sky-500/10 border-sky-500/50 shadow-md ring-1 ring-sky-500/30"
                        : "bg-surface-container-low border-outline hover:border-outline-variant hover:bg-surface-container-high/40"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn("text-xs font-bold", isSelected ? "text-sky-300" : "text-on-surface")}>
                          {p.name}
                        </span>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          isSelected ? "bg-sky-500/20 text-sky-300" : "bg-surface-container-high text-on-surface-variant"
                        )}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-outline/30 text-[10px]">
                      <span className="text-on-surface-variant opacity-70">
                        {p.id === 'Twilio' ? 'Account SID & Auth Token' : 'API Token & Sender ID'}
                      </span>
                      {isSelected ? (
                        <span className="text-sky-400 font-bold flex items-center gap-1">
                          <Check size={12} strokeWidth={3} /> Ativo
                        </span>
                      ) : (
                        <span className="text-on-surface-variant hover:text-on-surface">Selecionar</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CREDENTIALS FORM */}
          <div className="bg-surface-container p-7 rounded-[36px] border border-outline space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <Key size={16} className="text-sky-400" />
                  <span>Credenciais de Autenticação - {currentProviderInfo.name}</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Insira as chaves de acesso obtidas no painel de controle do seu provedor.
                </p>
              </div>

              {currentProviderInfo.docUrl !== '#' && (
                <a
                  href={currentProviderInfo.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 font-bold"
                >
                  <span>Documentação Oficial</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Account SID / API Key */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key size={13} className="text-sky-400" />
                    {currentProviderInfo.keyLabel}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono">Obrigatório</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={currentProviderInfo.keyPlaceholder}
                    value={config.apiKey}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, apiKey: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-on-surface-variant/40"
                  />
                  {config.apiKey && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-on-surface-variant">
                  {config.name === 'Twilio' 
                    ? 'Encontrado no dashboard principal do console Twilio (começa com AC).'
                    : 'Chave pública ou token de autenticação da conta.'}
                </p>
              </div>

              {/* Auth Token / API Secret */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock size={13} className="text-sky-400" />
                    {currentProviderInfo.secretLabel}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono">Confidencial</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    placeholder={currentProviderInfo.secretPlaceholder}
                    value={config.apiSecret}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, apiSecret: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-surface-container-low border border-outline rounded-2xl pl-4 pr-11 py-3 text-xs font-mono focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-on-surface-variant/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant">
                  Token secreto de autenticação da API. Mantido criptografado de ponta a ponta.
                </p>
              </div>

              {/* Sender ID / From Number */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} className="text-sky-400" />
                    {currentProviderInfo.fromLabel}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono">Recomendado</span>
                </label>
                <input
                  type="text"
                  placeholder={currentProviderInfo.fromPlaceholder}
                  value={config.fromNumber}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, fromNumber: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-on-surface-variant/40"
                />
                <p className="text-[10px] text-on-surface-variant">
                  Número Twilio contratado em formato E.164 (ex: +12025550192) ou Alphanumeric ID de até 11 caracteres (ex: STYLU).
                </p>
              </div>

              {/* Status / Webhook Callback */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap size={13} className="text-sky-400" />
                    Status Callback URL (Opcional)
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-mono">Webhook</span>
                </label>
                <input
                  type="text"
                  placeholder="https://api.studio.com/webhooks/sms-status"
                  value={config.webhookUrl || ''}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, webhookUrl: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-on-surface-variant/40"
                />
                <p className="text-[10px] text-on-surface-variant">
                  URL para receber confirmação de entrega e status de leitura do SMS pelas operadoras.
                </p>
              </div>
            </div>

            {/* TEST SMS DISPATCH */}
            <div className="pt-4 border-t border-outline/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-container-low/50 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Smartphone size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">Testar Conexão e Disparo Real de SMS</div>
                  <div className="text-[10px] text-on-surface-variant">Envie uma mensagem curta de validação das credenciais informadas.</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  className="w-36 bg-surface-container border border-outline rounded-xl px-3 py-2 text-xs font-mono text-center focus:ring-1 focus:ring-sky-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendTestSMS}
                  disabled={isSendingTest}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  {isSendingTest ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  <span>{isSendingTest ? "Disparando..." : "Enviar Teste"}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUB-TAB 2: SMS SPECIFIC TEMPLATES */}
      {activeSubTab === 'templates' && (
        <motion.div
          key="templates"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* NOTICE: WHY SMS TEMPLATES ARE UNIQUE */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Info size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Por que o Template de SMS é diferente do WhatsApp?
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Mensagens de SMS tradicionais operam no padrão <strong>GSM-7 (limite de 160 caracteres por envio)</strong> e não suportam formatação em negrito com asteriscos (<code className="text-[11px] bg-black/30 px-1 py-0.5 rounded">*texto*</code>) nem quebras de linha decorativas excessivas. Nossos templates de SMS são especialmente construídos para serem <strong>enxutos, objetivos e econômicos</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: TEMPLATE CATEGORIES & EDITOR */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category Selector */}
              <div className="bg-surface-container p-6 rounded-[32px] border border-outline space-y-4">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Selecione o Tipo de Notificação SMS
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'paymentDue', label: 'Vencimento', sub: 'Mensalidade', icon: DollarSign, color: 'text-amber-400' },
                    { id: 'upcomingClasses', label: 'Lembrete', sub: 'Início de Aula', icon: Clock, color: 'text-primary' },
                    { id: 'overduePayment', label: 'Cobrança', sub: 'Mensalidade Vencida', icon: AlertCircle, color: 'text-red-400' },
                    { id: 'promotions', label: 'Avisos & Promo', sub: 'Divulgações Gerais', icon: Sparkles, color: 'text-sky-400' }
                  ].map(tab => {
                    const isSelected = selectedTemplateKey === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedTemplateKey(tab.id as any)}
                        className={cn(
                          "p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3",
                          isSelected
                            ? "bg-surface-container-high border-sky-500/50 shadow-sm ring-1 ring-sky-500/30"
                            : "bg-surface-container-low border-outline/70 hover:border-outline text-on-surface-variant hover:text-on-surface"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-surface-container", tab.color)}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className={cn("text-xs font-bold", isSelected ? "text-on-surface" : "text-on-surface-variant")}>
                            {tab.label}
                          </div>
                          <div className="text-[10px] text-on-surface-variant opacity-70">
                            {tab.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea Editor */}
              <div className="bg-surface-container p-6 rounded-[32px] border border-outline space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">Texto do SMS</span>
                    <span className="text-[10px] bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded-md font-mono">
                      GSM-7 Plain Text
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetCurrentTemplate}
                      className="text-[11px] text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
                      title="Restaurar template padrão de fábrica"
                    >
                      <RotateCcw size={11} />
                      <span>Restaurar</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={templates[selectedTemplateKey]}
                    onChange={(e) => {
                      setTemplates(prev => ({
                        ...prev,
                        [selectedTemplateKey]: e.target.value
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    className={cn(
                      "w-full bg-surface-container-low border rounded-2xl p-4 text-xs font-sans leading-relaxed outline-none transition-all resize-none",
                      isOverSingleSMS 
                        ? "border-amber-500/50 focus:ring-1 focus:ring-amber-500" 
                        : "border-outline focus:ring-1 focus:ring-sky-500"
                    )}
                    placeholder="Digite o texto conciso do SMS..."
                  />
                </div>

                {/* Character Counter & Segment Indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-outline/30">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn("font-mono font-bold", isOverSingleSMS ? "text-amber-400" : "text-emerald-400")}>
                      {charCount} / 160 caracteres
                    </span>
                    <span className="text-on-surface-variant text-[11px]">
                      • {segments} {segments === 1 ? 'segmento (1 tarifa)' : 'segmentos (custo duplo)'}
                    </span>
                  </div>

                  {isOverSingleSMS && (
                    <button
                      type="button"
                      onClick={handleOptimizeForSingleSMS}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors self-start sm:self-auto"
                    >
                      <Sparkles size={12} />
                      <span>Encurtar para 160 caracteres</span>
                    </button>
                  )}
                </div>

                {/* Variable Tags insertion */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Inserir Variáveis Dinâmicas (Clique para adicionar):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.map(v => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => insertVariable(v.tag)}
                        className="px-2.5 py-1 bg-surface-container-low hover:bg-sky-500/15 border border-outline/70 hover:border-sky-500/40 text-on-surface-variant hover:text-sky-300 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 active:scale-95"
                      >
                        <span>{v.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: REALISTIC SMARTPHONE PREVIEW */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-surface-container p-6 rounded-[32px] border border-outline space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                    <Smartphone size={14} className="text-sky-400" />
                    <span>Pré-Visualização do SMS no Celular</span>
                  </h3>
                  <span className="text-[10px] text-on-surface-variant font-mono">Visão do Aluno</span>
                </div>

                {/* Phone Simulator Frame */}
                <div className="w-full max-w-[320px] mx-auto bg-stone-900 border-[6px] border-stone-800 rounded-[40px] p-3 shadow-2xl space-y-3">
                  {/* Top Notch / Speaker */}
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <div className="w-12 h-3.5 bg-stone-950 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-stone-800" />
                    </div>
                  </div>

                  {/* SMS Header */}
                  <div className="text-center pb-2 border-b border-stone-800/80">
                    <div className="w-9 h-9 rounded-full bg-stone-800 text-stone-300 font-bold mx-auto flex items-center justify-center text-xs mb-1">
                      {config.fromNumber ? config.fromNumber.slice(0, 3) : 'STY'}
                    </div>
                    <div className="text-[11px] font-bold text-stone-200">
                      {config.fromNumber || studioName}
                    </div>
                    <div className="text-[9px] text-stone-400">
                      Mensagem de Texto • SMS
                    </div>
                  </div>

                  {/* Message Bubble Area */}
                  <div className="py-4 space-y-2 min-h-[190px] flex flex-col justify-end">
                    <div className="text-center">
                      <span className="text-[9px] text-stone-500 bg-stone-950/60 px-2 py-0.5 rounded-full">
                        Hoje às 09:15
                      </span>
                    </div>

                    {/* Classic Grey/Blue SMS bubble */}
                    <div className="max-w-[90%] bg-stone-800 text-stone-100 rounded-2xl rounded-bl-sm p-3 text-xs leading-relaxed shadow-sm space-y-1.5">
                      <p className="whitespace-pre-wrap break-words font-sans">
                        {previewText || "Digite o texto no editor ao lado..."}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-stone-400 pt-1">
                        <span>Recebido via SMS</span>
                        <span>{charCount} carac.</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Home Indicator */}
                  <div className="pt-2 flex justify-center">
                    <div className="w-24 h-1 bg-stone-700 rounded-full" />
                  </div>
                </div>

                <div className="text-center pt-2">
                  <p className="text-[11px] text-on-surface-variant">
                    Variáveis como <code className="text-sky-300">Beatriz Lima</code> e <code className="text-sky-300">pix.studio/...</code> são preenchidas dinamicamente antes do disparo pelo provedor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUB-TAB 3: COMPARISON WHATSAPP VS. SMS */}
      {activeSubTab === 'comparison' && (
        <motion.div
          key="comparison"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-surface-container p-7 sm:p-8 rounded-[36px] border border-outline space-y-6">
            <div>
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Zap size={18} className="text-emerald-400" />
                <span>Comparativo Lado a Lado: WhatsApp vs. SMS</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Entenda visualmente como o mesmo evento (ex: Vencimento de Mensalidade) é formatado especificamente para cada canal de comunicação.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WhatsApp Column */}
              <div className="bg-surface-container-low p-6 rounded-3xl border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-outline/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-400">Canal WhatsApp</div>
                      <div className="text-[10px] text-on-surface-variant">Formatação Rica & Interativa</div>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    Sem limite de 160c
                  </span>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl text-xs leading-relaxed text-stone-200 font-sans whitespace-pre-wrap space-y-2">
                  <p>
                    Olá, <strong>Beatriz Lima</strong>! 👋
                  </p>
                  <p>
                    Passando para avisar que sua mensalidade no valor de <strong>R$ 180,00</strong> vence no dia <strong>10/10/2026</strong>.
                  </p>
                  <p className="bg-emerald-500/10 p-2 rounded-lg text-[11px] font-mono text-emerald-300">
                    🔑 <strong>Chave PIX:</strong> financeiro@stylourbano.com
                  </p>
                  <p className="text-[11px]">
                    Você também pode conferir os detalhes pelo link: https://app.stylourbano.com/fatura/98a
                  </p>
                </div>

                <ul className="text-[11px] text-on-surface-variant space-y-1.5">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-emerald-400 shrink-0" />
                    <span>Suporta <strong>negrito</strong>, <em>itálico</em> e quebras de linha</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-emerald-400 shrink-0" />
                    <span>Permite chave PIX extensa para Copia e Cola</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-emerald-400 shrink-0" />
                    <span>Suporta confirmação interativa com botões ou respostas numéricas (1 ou 2)</span>
                  </li>
                </ul>
              </div>

              {/* SMS Column */}
              <div className="bg-surface-container-low p-6 rounded-3xl border border-sky-500/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-outline/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-sky-400">Canal SMS Tradicional</div>
                      <div className="text-[10px] text-on-surface-variant">GSM-7 Puro & Ultra Objetivo</div>
                    </div>
                  </div>
                  <span className="text-[9px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full">
                    Até 160 caracteres
                  </span>
                </div>

                <div className="bg-sky-950/20 border border-sky-500/20 p-4 rounded-2xl text-xs leading-relaxed text-stone-200 font-sans whitespace-pre-wrap">
                  [STYLU] Ola Beatriz Lima, sua mensalidade de Outubro vence em 10/10 (R$180,00). Pague via PIX: pix.studio/p98a
                </div>

                <ul className="text-[11px] text-on-surface-variant space-y-1.5">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-sky-400 shrink-0" />
                    <span>Sem caracteres de markdown que poluem a leitura</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-sky-400 shrink-0" />
                    <span>Link curto para economizar espaço e evitar tarifa de 2 segmentos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-sky-400 shrink-0" />
                    <span>Funciona mesmo se o aluno estiver sem internet móvel ou WhatsApp desinstalado</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
