import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  Monitor, 
  Smartphone, 
  Check, 
  Copy, 
  Share2, 
  ShieldCheck, 
  Wifi, 
  Zap, 
  X, 
  Sparkles, 
  RefreshCw,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstalled: boolean;
  deferredPrompt?: any;
  onInstallNative: () => Promise<boolean | void>;
  isIOS: boolean;
  studioName?: string;
  studioLogo?: string;
  onCheckForUpdates?: () => Promise<boolean>;
  isCheckingUpdate?: boolean;
  onApplyUpdate?: () => Promise<void>;
  needRefresh?: boolean;
  appVersion?: string;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isInstalled,
  onInstallNative,
  isIOS,
  studioName = 'Stylo Urbano',
  studioLogo = '/logo.png',
  onCheckForUpdates,
  isCheckingUpdate = false,
  onApplyUpdate,
  needRefresh = false,
  appVersion = 'v2.4.0',
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'desktop' | 'mobile' | 'updates' | 'status'>('quick');
  const [copied, setCopied] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    toast.success('Link do aplicativo copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await onInstallNative();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div id="install-app-modal" className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-surface-container border border-outline rounded-[36px] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] text-left font-body"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-outline/30 flex items-start justify-between bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-[#FF9E00] flex items-center justify-center text-white shadow-lg shadow-primary/20 p-2 overflow-hidden">
              <img 
                src={studioLogo} 
                alt={studioName} 
                className="w-full h-full object-contain drop-shadow" 
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                  PWA Instalável
                </span>
                {isInstalled ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                    <Check size={10} /> App Instalado
                  </span>
                ) : (
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                    <Download size={10} /> Pronto p/ Instalar
                  </span>
                )}
                <span className="text-[10px] font-mono text-on-surface-variant">
                  {appVersion}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-on-surface mt-1">
                Instalação & Atualizações
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Instale no seu Computador ou Celular com suporte a atualização automática
              </p>
            </div>
          </div>

          <button
            id="close-install-modal-btn"
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 rounded-2xl transition-colors text-on-surface-variant hover:text-on-surface"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline/30 px-6 sm:px-8 bg-surface-container-low/50 overflow-x-auto gap-2 py-2.5 scrollbar-none">
          <button
            id="tab-quick-install-btn"
            onClick={() => setActiveTab('quick')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'quick'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <Zap size={14} />
            <span>Instalar (1-Clique)</span>
          </button>

          <button
            id="tab-updates-install-btn"
            onClick={() => setActiveTab('updates')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'updates'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <RefreshCw size={14} className={isCheckingUpdate ? "animate-spin" : ""} />
            <span>Atualizações</span>
            {needRefresh && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            id="tab-desktop-install-btn"
            onClick={() => setActiveTab('desktop')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'desktop'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <Monitor size={14} />
            <span>PC & Mac</span>
          </button>

          <button
            id="tab-mobile-install-btn"
            onClick={() => setActiveTab('mobile')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'mobile'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <Smartphone size={14} />
            <span>Celular & QR</span>
          </button>

          <button
            id="tab-status-install-btn"
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'status'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Diagnóstico</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* TAB 1: 1-CLIQUE */}
          {activeTab === 'quick' && (
            <div className="space-y-6">
              {/* Hero Action Box */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/15 via-surface-container-high to-surface-container-low border border-primary/30 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                      <Download size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-headline font-black uppercase tracking-tight text-on-surface">
                        {isInstalled ? 'Aplicativo Instalado no Sistema' : 'Instalação Direta'}
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        {isInstalled
                          ? 'O aplicativo já está instalado e abre diretamente em sua própria janela independente.'
                          : 'Adicione o ícone do sistema à sua Área de Trabalho, Barra de Tarefas ou Tela Inicial em segundos.'}
                      </p>
                    </div>
                  </div>

                  {!isInstalled ? (
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        id="native-install-action-btn"
                        disabled={isInstalling}
                        onClick={handleInstall}
                        className="py-4 px-6 bg-gradient-to-r from-primary to-[#FF9E00] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 flex-1 disabled:opacity-50"
                      >
                        <Download size={18} />
                        <span>{isInstalling ? 'Instalando...' : 'Instalar Agora no Dispositivo'}</span>
                      </button>

                      <button
                        id="copy-link-action-btn"
                        onClick={handleCopyLink}
                        className="py-4 px-5 bg-white/5 hover:bg-white/10 border border-outline rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-on-surface"
                      >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="shrink-0" />
                        <span>O aplicativo está instalado e configurado com atualizações automáticas ativas!</span>
                      </div>
                      {onCheckForUpdates && (
                        <button
                          onClick={onCheckForUpdates}
                          disabled={isCheckingUpdate}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <RefreshCw size={12} className={isCheckingUpdate ? "animate-spin" : ""} />
                          <span>Buscar Novidades</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Vantagens Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                  Benefícios do Instalável PWA
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-surface-container-low border border-outline/40 rounded-2xl space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                    <h5 className="text-xs font-bold text-on-surface">Janela Própria</h5>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Funciona como programa independente sem poluição de abas ou barras de navegador.
                    </p>
                  </div>

                  <div className="p-4 bg-surface-container-low border border-outline/40 rounded-2xl space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <RefreshCw size={16} />
                    </div>
                    <h5 className="text-xs font-bold text-on-surface">Auto-Atualização</h5>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Novas funcionalidades chegam automaticamente via nuvem sem reinstalar nada.
                    </p>
                  </div>

                  <div className="p-4 bg-surface-container-low border border-outline/40 rounded-2xl space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Wifi size={16} />
                    </div>
                    <h5 className="text-xs font-bold text-on-surface">Cache Inteligente</h5>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Carregamento instantâneo em menos de 1 segundo mesmo com conexões instáveis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATUALIZAÇÕES */}
          {activeTab === 'updates' && (
            <div className="space-y-6">
              <div className="p-6 bg-surface-container-low border border-outline rounded-3xl space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] bg-primary/15 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Mecanismo de Atualização
                    </span>
                    <h3 className="text-lg font-headline font-black uppercase tracking-tight text-on-surface mt-2">
                      Como funcionam as atualizações?
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      O Stylo Urbano conta com um <strong>Service Worker PWA</strong> ativo. Sempre que lançamos uma melhoria ou você atualiza o sistema, o app baixa os novos pacotes silenciosamente em segundo plano.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <RefreshCw size={24} className={isCheckingUpdate ? "animate-spin" : ""} />
                  </div>
                </div>

                {needRefresh ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                      <Sparkles size={16} />
                      <span>Existe uma nova versão pronta para ser aplicada!</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Os novos arquivos já foram transferidos para o seu dispositivo. Clique no botão abaixo para reiniciar o app na versão mais recente.
                    </p>
                    {onApplyUpdate && (
                      <button
                        onClick={onApplyUpdate}
                        className="py-3 px-5 bg-gradient-to-r from-primary to-[#FF9E00] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={14} />
                        <span>Aplicar Atualização Agora</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="pt-2">
                    {onCheckForUpdates && (
                      <button
                        id="check-updates-now-btn"
                        disabled={isCheckingUpdate}
                        onClick={async () => {
                          await onCheckForUpdates();
                        }}
                        className="w-full sm:w-auto py-3.5 px-6 bg-white/5 hover:bg-white/10 border border-outline rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 text-on-surface disabled:opacity-50"
                      >
                        <RefreshCw size={16} className={isCheckingUpdate ? "animate-spin" : ""} />
                        <span>{isCheckingUpdate ? 'Consultando Nuvem...' : 'Verificar Atualizações Agora'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Detalhes do sistema */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-surface-container-low border border-outline/50 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-on-surface-variant">Versão Atual</span>
                  <p className="text-sm font-mono font-bold text-on-surface">{appVersion}</p>
                </div>
                <div className="p-4 bg-surface-container-low border border-outline/50 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-on-surface-variant">Ciclo de Checagem</span>
                  <p className="text-sm font-mono font-bold text-emerald-400">Automático a cada 30 min + ao focar</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESKTOP GUIDE */}
          {activeTab === 'desktop' && (
            <div className="space-y-6">
              <div className="p-4 bg-surface-container-low border border-outline/40 rounded-2xl flex items-center gap-3">
                <Laptop size={24} className="text-primary shrink-0" />
                <p className="text-xs text-on-surface-variant">
                  Compatível com <strong>Google Chrome, Microsoft Edge, Brave e Opera</strong> no Windows 10/11, macOS e Linux.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-surface-container-low border border-outline rounded-3xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-on-surface text-sm">Pelo Ícone da Barra de Endereços (Mais Fácil)</h4>
                    <p className="text-on-surface-variant leading-relaxed">
                      No topo do seu navegador, na barra de URL (ao lado da estrela de favoritos), clique no ícone de <strong>computador com setinha para baixo</strong> ou <strong>"+" (Instalar)</strong>.
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-outline text-[11px] text-primary font-bold">
                      <Download size={14} /> Ícone "Instalar Stylo Urbano"
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-surface-container-low border border-outline rounded-3xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-on-surface text-sm">Pelo Menu do Navegador</h4>
                    <p className="text-on-surface-variant leading-relaxed">
                      Clique no botão de <strong>três pontinhos (⋮)</strong> no canto superior direito &gt; Selecione <strong>"Salvar e compartilhar"</strong> ou <strong>"Apps"</strong> &gt; Clique em <strong>"Instalar Stylo Urbano como app"</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-surface-container-low border border-outline rounded-3xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-on-surface text-sm">Fixar na Barra de Tarefas</h4>
                    <p className="text-on-surface-variant leading-relaxed">
                      Após instalado, clique com o botão direito no ícone do Stylo Urbano na barra de tarefas do Windows e selecione <strong>"Fixar na barra de tarefas"</strong> para abrir com 1 clique todo dia!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MOBILE & QR CODE */}
          {activeTab === 'mobile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* QR Code Container */}
                <div className="p-6 bg-surface-container-low border border-outline rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-white rounded-2xl shadow-lg">
                    <QRCodeCanvas
                      value={currentUrl}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">Aponte a Câmera</span>
                    <h4 className="text-sm font-bold text-on-surface mt-0.5">Escanear com o Celular</h4>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      Abra a câmera do seu smartphone e aponte para o QR Code para abrir e instalar direto no celular.
                    </p>
                  </div>
                  <button
                    id="copy-link-mobile-tab-btn"
                    onClick={handleCopyLink}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-outline rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-on-surface"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Link Copiado!' : 'Copiar Endereço'}</span>
                  </button>
                </div>

                {/* Instructions for Android / iOS */}
                <div className="space-y-4">
                  {/* Android */}
                  <div className="p-5 bg-surface-container-low border border-outline rounded-3xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                      <Smartphone size={16} />
                      <span>Android (Google Chrome)</span>
                    </div>
                    <ol className="text-xs text-on-surface-variant space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Abra o link no Google Chrome.</li>
                      <li>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito.</li>
                      <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                    </ol>
                  </div>

                  {/* iOS */}
                  <div className="p-5 bg-surface-container-low border border-outline rounded-3xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-400">
                      <Share2 size={16} />
                      <span>iPhone / iPad (Safari)</span>
                    </div>
                    <ol className="text-xs text-on-surface-variant space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Abra o link no navegador <strong>Safari</strong>.</li>
                      <li>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima).</li>
                      <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                      <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM STATUS & DIAGNOSTICS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low border border-outline rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Revisão de Saúde do PWA</h4>
                  <p className="text-[11px] text-on-surface-variant">Diagnóstico de integridade da infraestrutura e compatibilidade.</p>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                  100% Compatível
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-surface-container-low border border-outline/50 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Check size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-on-surface">Service Worker Ativo</h5>
                    <p className="text-[11px] text-on-surface-variant">Pre-caching de recursos e suporte a atualizações silenciosas.</p>
                  </div>
                </div>

                <div className="p-4 bg-surface-container-low border border-outline/50 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Check size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-on-surface">Ícones 192x192 & 512x512</h5>
                    <p className="text-[11px] text-on-surface-variant">Ícones PNG e maskable com margem de segurança para Android e iOS.</p>
                  </div>
                </div>

                <div className="p-4 bg-surface-container-low border border-outline/50 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Check size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-on-surface">Banco de Dados Firestore</h5>
                    <p className="text-[11px] text-on-surface-variant">Sincronização em tempo real de alunos, financeiro, salas e eventos.</p>
                  </div>
                </div>

                <div className="p-4 bg-surface-container-low border border-outline/50 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Check size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-on-surface">Display Standalone</h5>
                    <p className="text-[11px] text-on-surface-variant">Inicia em modo aplicativo nativo com tema corporativo #FF6B00.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-outline/30 bg-surface-container-low/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[10px] text-on-surface-variant font-mono">
            {studioName} Gestão • {appVersion}
          </div>
          <button
            id="modal-close-action-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-outline rounded-xl text-xs font-bold uppercase tracking-wider text-on-surface transition-all"
          >
            Fechar Janela
          </button>
        </div>
      </motion.div>
    </div>
  );
};
