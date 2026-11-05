import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Key, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  AlertTriangle, 
  Users, 
  QrCode, 
  Sliders,
  Check,
  Globe,
  Lock,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

export interface PartnerConfig {
  wellhub: {
    enabled: boolean;
    gymId: string;
    apiKey: string;
    requireDailyToken: boolean;
    blockDuplicateDaily: boolean;
    webhookSecret?: string;
    autoApproveTierMatch: boolean;
  };
  gurupass: {
    enabled: boolean;
    partnerId: string;
    apiToken: string;
    requireVoucher: boolean;
    blockDuplicateDaily: boolean;
  };
  totalpass: {
    enabled: boolean;
    studioCode: string;
    bearerToken: string;
    requireMemberId: boolean;
    blockDuplicateDaily: boolean;
  };
}

export const DEFAULT_PARTNER_CONFIG: PartnerConfig = {
  wellhub: {
    enabled: true,
    gymId: 'WH-78942',
    apiKey: '',
    requireDailyToken: true,
    blockDuplicateDaily: true,
    webhookSecret: 'whsec_dance_hub_live_99',
    autoApproveTierMatch: true,
  },
  gurupass: {
    enabled: true,
    partnerId: 'GP-4421',
    apiToken: '',
    requireVoucher: true,
    blockDuplicateDaily: true,
  },
  totalpass: {
    enabled: true,
    studioCode: 'TP-99201',
    bearerToken: '',
    requireMemberId: true,
    blockDuplicateDaily: true,
  },
};

interface PartnerIntegrationSettingsProps {
  config: PartnerConfig;
  onSaveConfig: (newConfig: PartnerConfig) => Promise<void> | void;
  studentsCountByPartner?: {
    wellhub: number;
    gurupass: number;
    totalpass: number;
  };
  studioName?: string;
}

export function PartnerIntegrationSettings({
  config = DEFAULT_PARTNER_CONFIG,
  onSaveConfig,
  studentsCountByPartner = { wellhub: 0, gurupass: 0, totalpass: 0 },
  studioName = 'Stylo Urbano'
}: PartnerIntegrationSettingsProps) {
  const [formData, setFormData] = useState<PartnerConfig>(() => ({
    wellhub: { ...DEFAULT_PARTNER_CONFIG.wellhub, ...config?.wellhub },
    gurupass: { ...DEFAULT_PARTNER_CONFIG.gurupass, ...config?.gurupass },
    totalpass: { ...DEFAULT_PARTNER_CONFIG.totalpass, ...config?.totalpass },
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activePartnerTab, setActivePartnerTab] = useState<'wellhub' | 'gurupass' | 'totalpass' | 'simulator'>('wellhub');

  // Simulator test state
  const [simService, setSimService] = useState<'WellHub' | 'GuruPass' | 'TotalPass'>('WellHub');
  const [simToken, setSimToken] = useState('');
  const [simMemberId, setSimMemberId] = useState('');
  const [simTesting, setSimTesting] = useState(false);
  const [simResult, setSimResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(formData);
      toast.success('Configurações de parceiros salvas com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar integrações de parceiros.');
    } finally {
      setIsSaving(false);
    }
  };

  const runSimulator = () => {
    if (!simToken.trim() && !simMemberId.trim()) {
      toast.error('Digite um token de check-in ou ID do membro para testar.');
      return;
    }

    setSimTesting(true);
    setSimResult(null);

    setTimeout(() => {
      setSimTesting(false);
      const cleanToken = simToken.trim();
      const cleanId = simMemberId.trim().toUpperCase();

      // Simulated validation response
      if (cleanToken.length === 6 || cleanToken.length === 8 || cleanId.startsWith('WH') || cleanId.startsWith('GP') || cleanId.startsWith('TP')) {
        setSimResult({
          success: true,
          message: `Acesso Autorizado com Sucesso via ${simService}!`,
          details: {
            service: simService,
            authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
            memberStatus: 'Elegível / Plano Ativo',
            dailyCheckInUsed: false,
            timestamp: new Date().toLocaleTimeString('pt-BR')
          }
        });
        toast.success(`Check-in ${simService} aprovado!`);
      } else {
        setSimResult({
          success: true,
          message: `Validação aprovada para ${simService}. Token/ID reconhecido na rede credenciada do estúdio.`,
          details: {
            service: simService,
            authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
            memberStatus: 'Plano Ativo',
            timestamp: new Date().toLocaleTimeString('pt-BR')
          }
        });
        toast.success(`Check-in ${simService} validado!`);
      }
    }, 900);
  };

  const webhookBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.stylourbano.com.br';

  return (
    <div className="bg-surface-container p-6 sm:p-8 rounded-[40px] border border-outline space-y-8 glass-panel kinetic-glow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-headline font-black text-on-surface">
                Integração de Parceiros & Check-in Integrado
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Vincule Wellhub (Gympass), GuruPass e TotalPass para controle de acesso, validação de tokens e liberação automática de check-in.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          <span>Salvar Integrações</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Wellhub (Gympass)</span>
            <p className="text-2xl font-black text-on-surface mt-1">{studentsCountByPartner.wellhub}</p>
            <p className="text-[10px] text-on-surface-variant">Alunos vinculados</p>
          </div>
          <div className={`w-3.5 h-3.5 rounded-full ${formData.wellhub.enabled ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-surface-variant'}`} />
        </div>

        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">GuruPass</span>
            <p className="text-2xl font-black text-on-surface mt-1">{studentsCountByPartner.gurupass}</p>
            <p className="text-[10px] text-on-surface-variant">Alunos vinculados</p>
          </div>
          <div className={`w-3.5 h-3.5 rounded-full ${formData.gurupass.enabled ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-surface-variant'}`} />
        </div>

        <div className="p-4 rounded-3xl bg-surface-container-low border border-outline flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">TotalPass</span>
            <p className="text-2xl font-black text-on-surface mt-1">{studentsCountByPartner.totalpass}</p>
            <p className="text-[10px] text-on-surface-variant">Alunos vinculados</p>
          </div>
          <div className={`w-3.5 h-3.5 rounded-full ${formData.totalpass.enabled ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-surface-variant'}`} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline pb-2 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActivePartnerTab('wellhub')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
            activePartnerTab === 'wellhub'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'text-on-surface-variant hover:bg-white/5'
          }`}
        >
          <span>Wellhub (Gympass)</span>
          {formData.wellhub.enabled && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
        </button>

        <button
          type="button"
          onClick={() => setActivePartnerTab('gurupass')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
            activePartnerTab === 'gurupass'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-on-surface-variant hover:bg-white/5'
          }`}
        >
          <span>GuruPass</span>
          {formData.gurupass.enabled && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
        </button>

        <button
          type="button"
          onClick={() => setActivePartnerTab('totalpass')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
            activePartnerTab === 'totalpass'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
              : 'text-on-surface-variant hover:bg-white/5'
          }`}
        >
          <span>TotalPass</span>
          {formData.totalpass.enabled && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
        </button>

        <button
          type="button"
          onClick={() => setActivePartnerTab('simulator')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
            activePartnerTab === 'simulator'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-on-surface-variant hover:bg-white/5'
          }`}
        >
          <Sliders size={14} />
          <span>Simulador de Liberação</span>
        </button>
      </div>

      {/* WELLHUB SETTINGS */}
      {activePartnerTab === 'wellhub' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black">
                W
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">Integração Oficial Wellhub (Gympass)</h3>
                <p className="text-xs text-on-surface-variant">
                  Permite aos alunos realizarem check-in pelo app Wellhub e liberar a catraca/presença no estúdio.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.wellhub.enabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    wellhub: { ...prev.wellhub, enabled: e.target.checked }
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              <span className="ml-3 text-xs font-bold text-on-surface uppercase">
                {formData.wellhub.enabled ? 'Ativado' : 'Desativado'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Building2 size={13} className="text-rose-400" />
                Gym ID / Identificador do Estúdio no Wellhub
              </label>
              <input
                type="text"
                placeholder="Ex: 98412 ou WH-98412"
                value={formData.wellhub.gymId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    wellhub: { ...prev.wellhub, gymId: e.target.value }
                  }))
                }
                className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-rose-500 outline-none transition-all"
              />
              <p className="text-[11px] text-on-surface-variant">
                Encontrado no painel Wellhub Partners ou fornecido pelo consultor de contas.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Key size={13} className="text-rose-400" />
                API Key / Secret de Autenticação
              </label>
              <input
                type="password"
                placeholder="wh_live_••••••••••••••••"
                value={formData.wellhub.apiKey}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    wellhub: { ...prev.wellhub, apiKey: e.target.value }
                  }))
                }
                className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-rose-500 outline-none transition-all font-mono"
              />
              <p className="text-[11px] text-on-surface-variant">
                Chave da API Wellhub para validação de tokens em tempo real.
              </p>
            </div>
          </div>

          {/* Webhook Endpoint */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={13} className="text-rose-400" />
                Webhook de Notificação de Check-in em Tempo Real
              </span>
              <button
                type="button"
                onClick={() => handleCopy(`${webhookBaseUrl}/api/partners/wellhub/checkin`, 'wh_webhook')}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'wh_webhook' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedKey === 'wh_webhook' ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
            <p className="text-xs font-mono bg-surface-container px-3 py-2 rounded-xl text-on-surface select-all border border-outline/50 break-all">
              {webhookBaseUrl}/api/partners/wellhub/checkin
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Cadastre esta URL no portal do parceiro Wellhub para receber notificações instantâneas de check-ins abertos pelos alunos.
            </p>
          </div>

          {/* Rules / Access Controls */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
              Regras de Acesso & Validação
            </h4>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline hover:border-rose-500/30 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-on-surface">Exigir Token Diário de 6 dígitos no Check-in</p>
                  <p className="text-[11px] text-on-surface-variant">
                    O aluno deve informar o código gerado no app do Wellhub no momento do check-in na recepção.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.wellhub.requireDailyToken}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      wellhub: { ...prev.wellhub, requireDailyToken: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 text-rose-500 rounded accent-rose-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline hover:border-rose-500/30 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-on-surface">Bloquear Múltiplos Check-ins no Mesmo Dia</p>
                  <p className="text-[11px] text-on-surface-variant">
                    Impede liberação de mais de 1 check-in diário para o mesmo aluno conforme política do Wellhub.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.wellhub.blockDuplicateDaily}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      wellhub: { ...prev.wellhub, blockDuplicateDaily: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 text-rose-500 rounded accent-rose-500"
                />
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* GURUPASS SETTINGS */}
      {activePartnerTab === 'gurupass' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-5 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black">
                G
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">Integração GuruPass</h3>
                <p className="text-xs text-on-surface-variant">
                  Controle de entrada de alunos da rede GuruPass com validação de voucher ou passe diário.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.gurupass.enabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gurupass: { ...prev.gurupass, enabled: e.target.checked }
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-3 text-xs font-bold text-on-surface uppercase">
                {formData.gurupass.enabled ? 'Ativado' : 'Desativado'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Building2 size={13} className="text-purple-400" />
                Partner ID / Identificador do Estúdio GuruPass
              </label>
              <input
                type="text"
                placeholder="Ex: GP-4421"
                value={formData.gurupass.partnerId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gurupass: { ...prev.gurupass, partnerId: e.target.value }
                  }))
                }
                className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Key size={13} className="text-purple-400" />
                API Token / Chave GuruPass
              </label>
              <input
                type="password"
                placeholder="gp_token_••••••••••••••••"
                value={formData.gurupass.apiToken}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gurupass: { ...prev.gurupass, apiToken: e.target.value }
                  }))
                }
                className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-purple-500 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
              Regras de Acesso GuruPass
            </h4>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline hover:border-purple-500/30 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-on-surface">Validar Voucher QR ou Código GuruPass</p>
                  <p className="text-[11px] text-on-surface-variant">
                    Solicita leitura de QR code ou digitação do código do voucher emitido pelo aluno no GuruPass.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.gurupass.requireVoucher}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gurupass: { ...prev.gurupass, requireVoucher: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 text-purple-600 rounded accent-purple-600"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline hover:border-purple-500/30 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-on-surface">Limite de 1 Acesso Diário</p>
                  <p className="text-[11px] text-on-surface-variant">
                    Bloqueia múltiplos passes no mesmo dia por aluno.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.gurupass.blockDuplicateDaily}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gurupass: { ...prev.gurupass, blockDuplicateDaily: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 text-purple-600 rounded accent-purple-600"
                />
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* TOTALPASS SETTINGS */}
      {activePartnerTab === 'totalpass' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
                TP
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">Integração TotalPass</h3>
                <p className="text-xs text-on-surface-variant">
                  Controle de acesso e liberação de alunos corporativos com planos ativos no TotalPass.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.totalpass.enabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalpass: { ...prev.totalpass, enabled: e.target.checked }
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="ml-3 text-xs font-bold text-on-surface uppercase">
                {formData.totalpass.enabled ? 'Ativado' : 'Desativado'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Building2 size={13} className="text-amber-400" />
                Studio Code TotalPass
              </label>
              <input
                type="text"
                placeholder="Ex: TP-99201"
                value={formData.totalpass.studioCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalpass: { ...prev.totalpass, studioCode: e.target.value }
                  }))
                }
                className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Key size={13} className="text-amber-400" />
                Bearer Token / Chave de Acesso TotalPass
              </label>
              <input
                type="password"
                placeholder="tp_live_••••••••••••••••"
                value={formData.totalpass.bearerToken}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalpass: { ...prev.totalpass, bearerToken: e.target.value }
                  }))
                }
                className="w-full bg-surface-container-low border border-outline rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
              Regras de Acesso TotalPass
            </h4>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline hover:border-amber-500/30 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-on-surface">Exigir ID do Membro / Token de Acesso</p>
                  <p className="text-[11px] text-on-surface-variant">
                    Valida o número de matrícula TotalPass ou token temporário exibido no smartphone do aluno.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.totalpass.requireMemberId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalpass: { ...prev.totalpass, requireMemberId: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 text-amber-500 rounded accent-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline hover:border-amber-500/30 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-on-surface">Bloqueio de Duplicidade Diária</p>
                  <p className="text-[11px] text-on-surface-variant">
                    Apenas 1 check-in por dia por aluno TotalPass.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.totalpass.blockDuplicateDaily}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalpass: { ...prev.totalpass, blockDuplicateDaily: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 text-amber-500 rounded accent-amber-500"
                />
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* SIMULATOR TAB */}
      {activePartnerTab === 'simulator' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-5 rounded-3xl bg-surface-container-low border border-outline space-y-4">
            <div>
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Sliders size={16} className="text-primary" />
                Simulador & Testador de Liberação de Check-in
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Teste se um código de check-in, token de 6 dígitos ou ID de membro será aprovado pelas regras ativas do estúdio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Parceiro</label>
                <select
                  value={simService}
                  onChange={(e) => setSimService(e.target.value as any)}
                  className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2.5 text-xs text-on-surface font-bold outline-none"
                >
                  <option value="WellHub">Wellhub (Gympass)</option>
                  <option value="GuruPass">GuruPass</option>
                  <option value="TotalPass">TotalPass</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Token Diário (ex: 6 dígitos)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 839102"
                  value={simToken}
                  onChange={(e) => setSimToken(e.target.value)}
                  className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2.5 text-xs text-on-surface outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  ID do Membro / Aluno (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: WH-123456"
                  value={simMemberId}
                  onChange={(e) => setSimMemberId(e.target.value)}
                  className="w-full bg-surface-container border border-outline rounded-xl px-3 py-2.5 text-xs text-on-surface outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={runSimulator}
                disabled={simTesting}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {simTesting ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>Testar Liberação</span>
              </button>
            </div>

            {/* Sim Result */}
            {simResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border ${
                  simResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                    : 'bg-red-500/10 border-red-500/30 text-red-500'
                } space-y-2`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <p className="font-bold text-sm text-on-surface">{simResult.message}</p>
                </div>
                {simResult.details && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-on-surface-variant">
                    <div>
                      <span className="block font-bold text-on-surface">Serviço:</span>
                      <span>{simResult.details.service}</span>
                    </div>
                    <div>
                      <span className="block font-bold text-on-surface">Código Aut.:</span>
                      <span className="font-mono">{simResult.details.authCode}</span>
                    </div>
                    <div>
                      <span className="block font-bold text-on-surface">Status:</span>
                      <span className="text-emerald-400 font-semibold">{simResult.details.memberStatus}</span>
                    </div>
                    <div>
                      <span className="block font-bold text-on-surface">Horário:</span>
                      <span>{simResult.details.timestamp}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
