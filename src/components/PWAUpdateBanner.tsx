import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Download, Sparkles, X, WifiOff, CheckCircle2 } from 'lucide-react';

interface PWAUpdateBannerProps {
  needRefresh: boolean;
  isOnline: boolean;
  onApplyUpdate: () => Promise<void>;
  onDismiss: () => void;
  appVersion?: string;
}

export const PWAUpdateBanner: React.FC<PWAUpdateBannerProps> = ({
  needRefresh,
  isOnline,
  onApplyUpdate,
  onDismiss,
  appVersion = 'v2.4.0',
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onApplyUpdate();
    } catch {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Offline Mode Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 z-[180] flex items-center gap-2.5 bg-amber-500/95 text-black px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md border border-amber-400 font-bold text-xs"
          >
            <WifiOff size={16} className="shrink-0 animate-pulse" />
            <span>Modo Offline: Usando dados armazenados em cache local</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Update Available Floating Banner */}
      <AnimatePresence>
        {needRefresh && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-4 sm:right-6 z-[220] max-w-md w-[calc(100vw-2rem)] bg-surface-container border-2 border-primary/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl font-body text-left text-on-surface"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-[#FF9E00] text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
                {isUpdating ? (
                  <RefreshCw size={22} className="animate-spin" />
                ) : (
                  <Sparkles size={22} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Atualização Disponível
                  </span>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    {appVersion}
                  </span>
                </div>

                <h4 className="text-sm font-headline font-black uppercase tracking-tight text-on-surface mt-1">
                  Nova versão pronta para instalar
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  Uma versão atualizada do Stylo Urbano foi baixada. Clique abaixo para aplicar as novidades instantaneamente sem perder seus dados.
                </p>

                <div className="flex items-center gap-2.5 mt-3.5">
                  <button
                    id="pwa-apply-update-btn"
                    disabled={isUpdating}
                    onClick={handleUpdate}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-primary to-[#FF9E00] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Reiniciando...</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>Atualizar Agora</span>
                      </>
                    )}
                  </button>

                  <button
                    id="pwa-dismiss-update-btn"
                    onClick={onDismiss}
                    className="py-2.5 px-3 rounded-xl border border-outline hover:bg-white/5 text-xs font-bold text-on-surface-variant transition-colors"
                  >
                    Depois
                  </button>
                </div>
              </div>

              <button
                onClick={onDismiss}
                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg transition-colors shrink-0"
                title="Fechar aviso"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
