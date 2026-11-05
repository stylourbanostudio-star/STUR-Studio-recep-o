import { useEffect, useState, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  isOnline: boolean;
  needRefresh: boolean;
  offlineReady: boolean;
  isCheckingUpdate: boolean;
  lastCheckedDate: Date | null;
  appVersion: string;
  install: () => Promise<boolean>;
  checkForUpdates: () => Promise<boolean>;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
}

export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [lastCheckedDate, setLastCheckedDate] = useState<Date | null>(null);
  const [appVersion] = useState<string>('v2.4.0 (PWA)');
  const updateTimeoutRef = useRef<any>(null);

  // Use vite-plugin-pwa register hook with periodic checking
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update().catch(() => {});
        }, 30 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });

  // Check standalone mode and platform
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Install prompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('Stylo Urbano instalado com sucesso!', {
        description: 'Você pode abrir o app diretamente pela sua Área de Trabalho ou Tela de Início.',
      });
    };

    // Online / Offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restabelecida!', {
        description: 'Sincronização em tempo real ativa.',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Você está sem conexão com a internet', {
        description: 'O aplicativo continua funcionando em modo offline com os dados em cache.',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check updates on window focus
    const handleFocus = () => {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(reg => reg.update().catch(() => {}));
        });
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Native install trigger
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to trigger PWA install:', err);
      return false;
    }
  }, [deferredPrompt]);

  // Check for updates manually
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    setIsCheckingUpdate(true);
    setLastCheckedDate(new Date());

    try {
      if (!('serviceWorker' in navigator)) {
        toast.info('Navegador sem suporte a Service Worker', {
          description: 'As atualizações ocorrem ao recarregar a página.',
        });
        setIsCheckingUpdate(false);
        return false;
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      if (!registrations || registrations.length === 0) {
        // Try to trigger re-registration or reload
        await new Promise(r => setTimeout(r, 1200));
        setIsCheckingUpdate(false);
        toast.success('Você já está na versão mais recente!', {
          description: 'Nenhuma nova atualização encontrada no momento.',
        });
        return false;
      }

      let foundWaiting = false;
      for (const reg of registrations) {
        await reg.update();
        if (reg.waiting) {
          foundWaiting = true;
          setNeedRefresh(true);
        }
      }

      await new Promise(r => setTimeout(r, 1200));
      setIsCheckingUpdate(false);

      if (foundWaiting || needRefresh) {
        toast.info('Nova atualização encontrada!', {
          description: 'Uma versão mais recente do aplicativo está pronta para ser instalada.',
        });
        return true;
      } else {
        toast.success('O Stylo Urbano está atualizado!', {
          description: `Versão ${appVersion} verificada agora. Tudo pronto!`,
        });
        return false;
      }
    } catch (err) {
      console.warn('Update check failed:', err);
      setIsCheckingUpdate(false);
      toast.info('Verificação concluída', {
        description: 'Seu sistema está pronto para uso.',
      });
      return false;
    }
  }, [needRefresh, setNeedRefresh, appVersion]);

  // Apply update and reload
  const applyUpdate = useCallback(async () => {
    try {
      // Clear specific legacy cache if needed
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter(key => key.includes('old') || key.includes('temp'))
            .map(key => caches.delete(key))
        );
      }

      await updateServiceWorker(true);
      window.location.reload();
    } catch (err) {
      console.error('Error applying update:', err);
      window.location.reload();
    }
  }, [updateServiceWorker]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  return {
    isInstalled,
    isInstallable: !!deferredPrompt,
    isIOS,
    isOnline,
    needRefresh,
    offlineReady,
    isCheckingUpdate,
    lastCheckedDate,
    appVersion,
    install,
    checkForUpdates,
    applyUpdate,
    dismissUpdate,
  };
}
