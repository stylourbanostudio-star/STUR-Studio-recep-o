import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Upload, 
  Clock, 
  Bell, 
  Mail, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink,
  Save,
  Check,
  FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { sendBackupFailureAlertEmail } from '../services/emailService';

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: '6h' | 'daily' | 'weekly' | 'monthly';
  time: string;
  notifyOnFailure: boolean;
  channels: {
    push: boolean;
    email: boolean;
  };
  alertEmail: string;
  folderName: string;
}

export interface BackupLogItem {
  id?: string;
  timestamp: string;
  status: 'success' | 'failure';
  fileName?: string;
  fileId?: string;
  link?: string;
  sizeBytes?: number;
  errorReason?: string;
  triggeredBy?: string;
  notifiedEmail?: string;
  channels?: { push: boolean; email: boolean };
}

interface GoogleDriveBackupSettingsProps {
  isGoogleConnected: boolean;
  googleEmail?: string | null;
  onConnectGoogle: () => void;
  lastBackupDate: string | null;
  lastBackupStatus?: 'success' | 'failure' | null;
  lastBackupError?: string | null;
  autoBackupSettings: AutoBackupConfig;
  onSaveAutoBackupSettings: (settings: AutoBackupConfig) => Promise<void>;
  onExecuteDriveBackup: () => Promise<void>;
  isBackingUp: boolean;
  onExportLocalBackup: () => void;
  onImportLocalBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentUserEmail?: string;
  studioName?: string;
}

export const GoogleDriveBackupSettings: React.FC<GoogleDriveBackupSettingsProps> = ({
  isGoogleConnected,
  googleEmail,
  onConnectGoogle,
  lastBackupDate,
  lastBackupStatus,
  lastBackupError,
  autoBackupSettings,
  onSaveAutoBackupSettings,
  onExecuteDriveBackup,
  isBackingUp,
  onExportLocalBackup,
  onImportLocalBackup,
  currentUserEmail = 'stylourbanostudio@gmail.com',
  studioName = 'Stylo Urbano'
}) => {
  const [config, setConfig] = useState<AutoBackupConfig>(autoBackupSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [logs, setLogs] = useState<BackupLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfig(autoBackupSettings);
  }, [autoBackupSettings]);

  // Fetch recent backup logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch('/api/backup/logs');
      if (response.ok) {
        const data = await response.json();
        if (data.logs) {
          setLogs(data.logs);
        }
      }
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [lastBackupDate]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await onSaveAutoBackupSettings(config);
      toast.success('Configurações de backup automático salvas com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar configurações de backup.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestFailureAlert = async () => {
    setIsTestingAlert(true);
    const targetEmail = config.alertEmail || currentUserEmail || 'stylourbanostudio@gmail.com';

    try {
      // 1. Call server test endpoint
      const res = await fetch('/api/backup/test-failure-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          reason: 'Simulação de falha: Conexão interrompida com Google Drive (Teste de Verificação)'
        })
      });

      // 2. Client-side simulated email alert for immediate visual confirmation
      if (config.channels.email) {
        await sendBackupFailureAlertEmail({
          to: targetEmail,
          studioName,
          timestamp: format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }),
          errorReason: 'Simulação manual de teste de alerta acionada nas configurações.',
          frequency: config.frequency === '6h' ? 'A cada 6 horas' : config.frequency === 'daily' ? 'Diário' : config.frequency === 'weekly' ? 'Semanal' : 'Mensal'
        });
      }

      if (res.ok) {
        toast.success('Alerta de teste enviado com sucesso via Notificação Push e E-mail!');
      } else {
        toast.warning('Alerta gerado com aviso no painel.');
      }
      
      // Refresh logs
      fetchLogs();
    } catch (err) {
      console.error('Error testing alert:', err);
      toast.error('Erro ao disparar teste de alerta.');
    } finally {
      setIsTestingAlert(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '--';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div id="google-drive-backup-settings" className="space-y-6">
      {/* Header card with Drive status */}
      <div className="bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline glass-panel kinetic-glow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-outline">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Cloud size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold uppercase tracking-tight text-on-surface">
                  Backup Automático & Google Drive
                </h3>
                {isGoogleConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20">
                    <CheckCircle2 size={12} /> Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                    <AlertTriangle size={12} /> Não Conectado
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {isGoogleConnected 
                  ? `Sincronização em nuvem ativa com: ${googleEmail || currentUserEmail}`
                  : 'Conecte sua conta do Google para habilitar backups periódicos e exportação contínua.'}
              </p>
            </div>
          </div>

          {!isGoogleConnected ? (
            <button
              onClick={onConnectGoogle}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Cloud size={16} />
              <span>Conectar Google Drive</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onConnectGoogle}
                className="px-3.5 py-2 rounded-xl text-[11px] font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 border border-outline transition-all flex items-center gap-1.5"
                title="Reconectar ou alterar conta Google"
              >
                <RefreshCw size={13} />
                <span>Reconectar</span>
              </button>
              <button
                onClick={onExecuteDriveBackup}
                disabled={isBackingUp}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isBackingUp ? 'animate-spin' : ''} />
                <span>{isBackingUp ? 'Salvando...' : 'Fazer Backup Agora'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Status indicator bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <Clock size={12} className="text-primary" /> Último Backup
            </span>
            <p className="text-xs font-bold text-on-surface mt-1">
              {lastBackupDate 
                ? format(new Date(lastBackupDate), "dd 'de' MMMM, HH:mm", { locale: ptBR }) 
                : 'Nenhum backup realizado'}
            </p>
            {lastBackupStatus === 'failure' && (
              <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle size={11} /> {lastBackupError || 'Última tentativa falhou'}
              </p>
            )}
          </div>

          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-primary" /> Automação
            </span>
            <p className="text-xs font-bold text-on-surface mt-1">
              {config.enabled ? (
                <span className="text-green-500">Ativo ({config.frequency === '6h' ? 'A cada 6h' : config.frequency === 'daily' ? 'Diário' : config.frequency === 'weekly' ? 'Semanal' : 'Mensal'})</span>
              ) : (
                <span className="text-on-surface-variant">Desativado</span>
              )}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              Horário base: {config.time || '23:00'}
            </p>
          </div>

          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <Bell size={12} className="text-primary" /> Alertas de Falha
            </span>
            <p className="text-xs font-bold text-on-surface mt-1">
              {config.notifyOnFailure ? (
                <span className="text-primary">
                  {[
                    config.channels.push ? 'Push' : null,
                    config.channels.email ? 'E-mail' : null
                  ].filter(Boolean).join(' + ')}
                </span>
              ) : (
                <span className="text-on-surface-variant">Alertas desligados</span>
              )}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
              {config.alertEmail || currentUserEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Periodic Schedule settings */}
        <div className="bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline space-y-6 glass-panel">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-tight text-on-surface">
                  Agendamento Automático
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Gere cópias de segurança em segundo plano
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className={`space-y-4 transition-opacity duration-300 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Frequency selection */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block mb-2">
                Frequência do Backup
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '6h', label: '6 Horas', desc: '4x ao dia' },
                  { id: 'daily', label: 'Diário', desc: 'Todo dia' },
                  { id: 'weekly', label: 'Semanal', desc: 'Aos Domingos' },
                  { id: 'monthly', label: 'Mensal', desc: '1º do mês' }
                ].map((freq) => (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => setConfig({ ...config, frequency: freq.id as any })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      config.frequency === freq.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                        : 'border-outline bg-surface-container-low text-on-surface-variant hover:border-primary/40'
                    }`}
                  >
                    <p className="text-xs font-bold">{freq.label}</p>
                    <p className="text-[9px] opacity-70 mt-0.5">{freq.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Execution Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block mb-1.5">
                  Horário Preferencial
                </label>
                <input
                  type="time"
                  value={config.time}
                  onChange={(e) => setConfig({ ...config, time: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-2.5 text-xs text-on-surface font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block mb-1.5">
                  Pasta no Google Drive
                </label>
                <div className="relative">
                  <FolderOpen size={14} className="absolute left-3.5 top-3.5 text-on-surface-variant" />
                  <input
                    type="text"
                    value={config.folderName}
                    onChange={(e) => setConfig({ ...config, folderName: e.target.value })}
                    placeholder="Stylo Urbano - Backups"
                    className="w-full bg-surface-container-low border border-outline rounded-xl pl-9 pr-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Failure Alerts Configuration */}
        <div className="bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline space-y-6 glass-panel">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-tight text-on-surface">
                  Alertas de Falha no Backup
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Receba avisos imediatos se o backup falhar
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifyOnFailure}
                onChange={(e) => setConfig({ ...config, notifyOnFailure: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className={`space-y-4 transition-opacity duration-300 ${!config.notifyOnFailure ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Channels Selection */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block mb-2">
                Canais de Alerta
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  config.channels.push 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-outline bg-surface-container-low text-on-surface-variant'
                }`}>
                  <input
                    type="checkbox"
                    checked={config.channels.push}
                    onChange={(e) => setConfig({
                      ...config,
                      channels: { ...config.channels, push: e.target.checked }
                    })}
                    className="sr-only"
                  />
                  <Smartphone size={18} />
                  <div>
                    <p className="text-xs font-bold">Notificação Push</p>
                    <p className="text-[9px] opacity-70">No celular e navegador</p>
                  </div>
                  {config.channels.push && <Check size={14} className="ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  config.channels.email 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-outline bg-surface-container-low text-on-surface-variant'
                }`}>
                  <input
                    type="checkbox"
                    checked={config.channels.email}
                    onChange={(e) => setConfig({
                      ...config,
                      channels: { ...config.channels, email: e.target.checked }
                    })}
                    className="sr-only"
                  />
                  <Mail size={18} />
                  <div>
                    <p className="text-xs font-bold">E-mail de Alerta</p>
                    <p className="text-[9px] opacity-70">Com detalhes do erro</p>
                  </div>
                  {config.channels.email && <Check size={14} className="ml-auto" />}
                </label>
              </div>
            </div>

            {/* Target Email Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  E-mail para Receber Alertas
                </label>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, alertEmail: currentUserEmail })}
                  className="text-[10px] text-primary hover:underline font-bold"
                >
                  Usar meu e-mail
                </button>
              </div>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-3.5 text-on-surface-variant" />
                <input
                  type="email"
                  value={config.alertEmail}
                  onChange={(e) => setConfig({ ...config, alertEmail: e.target.value })}
                  placeholder="exemplo@gmail.com"
                  className="w-full bg-surface-container-low border border-outline rounded-xl pl-9 pr-4 py-2.5 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Test Alert Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestFailureAlert}
                disabled={isTestingAlert}
                className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={13} className={isTestingAlert ? 'animate-spin' : ''} />
                <span>{isTestingAlert ? 'Disparando Teste de Alerta...' : '🧪 Testar Alerta de Falha (Push + E-mail)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Settings Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-surface-container rounded-2xl border border-outline">
        <p className="text-xs text-on-surface-variant">
          As configurações são salvas em nuvem e aplicadas a todas as rotinas em segundo plano.
        </p>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={16} />
          <span>{isSaving ? 'Salvando...' : 'Salvar Configurações de Backup'}</span>
        </button>
      </div>

      {/* Manual Actions & Portability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={onExportLocalBackup}
          className="p-4 rounded-2xl border border-outline bg-surface-container hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Download size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-on-surface">Baixar JSON Manual</h5>
            <p className="text-[10px] text-on-surface-variant">Exportar arquivo no computador</p>
          </div>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-4 rounded-2xl border border-outline bg-surface-container hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Upload size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-on-surface">Restaurar do Arquivo</h5>
            <p className="text-[10px] text-on-surface-variant">Carregar dados de um JSON</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportLocalBackup}
            accept=".json"
            className="hidden"
          />
        </button>

        <button
          onClick={onExecuteDriveBackup}
          disabled={!isGoogleConnected || isBackingUp}
          className="p-4 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all flex items-center gap-3 text-left group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Cloud size={18} className={isBackingUp ? 'animate-spin' : ''} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-primary">Sincronizar no Drive</h5>
            <p className="text-[10px] text-on-surface-variant">Salvar cópia na nuvem agora</p>
          </div>
        </button>
      </div>

      {/* History and Logs Feed */}
      <div className="bg-surface-container p-6 sm:p-8 rounded-[32px] border border-outline space-y-4 glass-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock size={16} />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-tight text-on-surface">
              Histórico & Logs de Execução
            </h4>
          </div>
          <button
            onClick={fetchLogs}
            disabled={isLoadingLogs}
            className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all"
            title="Atualizar logs"
          >
            <RefreshCw size={14} className={isLoadingLogs ? 'animate-spin' : ''} />
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-outline rounded-2xl">
            <Cloud size={32} className="mx-auto text-on-surface-variant/40 mb-2" />
            <p className="text-xs text-on-surface-variant">Nenhum log de backup registrado ainda.</p>
            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
              Os registros automáticos e manuais aparecerão aqui em tempo real.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {logs.map((log, idx) => (
              <div
                key={log.id || idx}
                className="p-3.5 bg-surface-container-low rounded-2xl border border-outline flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    log.status === 'success' 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {log.status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold uppercase text-[10px] tracking-wider ${
                        log.status === 'success' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {log.status === 'success' ? 'Sucesso' : 'Falha'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        • {log.timestamp ? format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }) : '--'}
                      </span>
                      {log.triggeredBy && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-surface rounded text-on-surface-variant uppercase font-mono">
                          {log.triggeredBy}
                        </span>
                      )}
                    </div>
                    {log.status === 'success' ? (
                      <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                        {log.fileName || 'Arquivo de backup'} ({formatBytes(log.sizeBytes)})
                      </p>
                    ) : (
                      <p className="text-[11px] text-red-400 truncate mt-0.5">
                        {log.errorReason || 'Erro durante a operação'}
                      </p>
                    )}
                  </div>
                </div>

                {log.link && (
                  <a
                    href={log.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-primary hover:bg-primary/10 border border-primary/20 transition-all flex items-center gap-1 text-[10px] font-bold shrink-0"
                  >
                    <span>Abrir Drive</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
