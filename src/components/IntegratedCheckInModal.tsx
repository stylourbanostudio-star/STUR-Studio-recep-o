import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Zap, 
  Key, 
  RefreshCw, 
  ShieldCheck, 
  Building2, 
  Clock, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { calculateStudentClassUsage, StudentUsageStats } from '../utils/planUsage';
import { toast } from 'sonner';

export interface IntegratedCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    document?: string;
    avatar?: string;
    planType: 'Studio' | 'WellHub' | 'GuruPass' | 'TotalPass';
    contractedPlan: string;
    attendance?: { id?: string; date: string; present: boolean; className?: string; instructor?: string }[];
    partnerMemberId?: string;
    customClassLimit?: number;
    customWeeklyLimit?: number;
  } | null;
  selectedClass: string;
  onConfirmCheckIn: (studentId: string, className: string, metadata?: { partnerToken?: string; isExtraClass?: boolean }) => Promise<void> | void;
}

export function IntegratedCheckInModal({
  isOpen,
  onClose,
  student,
  selectedClass,
  onConfirmCheckIn
}: IntegratedCheckInModalProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [memberIdInput, setMemberIdInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [bypassDailyWarning, setBypassDailyWarning] = useState(false);

  if (!isOpen || !student) return null;

  const usage: StudentUsageStats = calculateStudentClassUsage(student);
  const isPartner = usage.isPartner;
  const partnerName = student.planType;

  const handleValidateAndConfirm = async (isExtra = false) => {
    setIsValidating(true);
    try {
      if (isPartner && tokenInput.trim().length > 0 && tokenInput.trim().length < 4) {
        toast.error('O token informado é muito curto. Verifique o código no aplicativo do parceiro.');
        setIsValidating(false);
        return;
      }

      // Simulate instantaneous validation with partner API
      if (isPartner) {
        await new Promise(r => setTimeout(r, 600));
      }

      await onConfirmCheckIn(student.id, selectedClass, {
        partnerToken: tokenInput.trim() || undefined,
        isExtraClass: isExtra
      });

      toast.success(
        isPartner 
          ? `Check-in ${partnerName} validado e liberado com sucesso!`
          : `Check-in confirmado para ${student.name}!`
      );
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao confirmar check-in.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-surface-container border border-outline rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl space-y-6 p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shrink-0 ${
              isPartner 
                ? partnerName === 'WellHub' ? 'bg-rose-500' : partnerName === 'GuruPass' ? 'bg-purple-600' : 'bg-amber-500'
                : 'bg-primary'
            }`}>
              {isPartner ? partnerName.charAt(0) : <Zap size={22} />}
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                isPartner
                  ? partnerName === 'WellHub' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                  : partnerName === 'GuruPass' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                {isPartner ? `Check-in Integrado ${partnerName}` : 'Controle de Aulas do Plano'}
              </span>
              <h3 className="text-lg font-bold text-on-surface mt-1">{student.name}</h3>
              <p className="text-xs text-on-surface-variant">Aula: <span className="text-on-surface font-semibold">{selectedClass}</span></p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container-high transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* CLASS COUNTER SECTION */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Contador do Plano ({student.contractedPlan || student.planType})
            </span>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
              usage.isExceeded
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : usage.isNearLimit
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            }`}>
              {usage.monthlyClasses} / {usage.monthlyLimit} no mês
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              className={`h-full transition-all rounded-full ${
                usage.isExceeded ? 'bg-red-500' : usage.isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, usage.percentageUsed)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Esta semana: <b className="text-on-surface">{usage.weeklyClasses} aulas</b></span>
            <span>Restantes no mês: <b className="text-on-surface">{usage.classesRemaining}</b></span>
          </div>
        </div>

        {/* WARNINGS OR PARTNER VALIDATION */}
        {isPartner ? (
          <div className="space-y-4">
            {usage.todayClasses > 0 && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-500">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Atenção: Aluno já registrou check-in hoje!</p>
                  <p className="text-[11px] text-amber-500/80 mt-0.5">
                    A maioria dos planos de parceiros ({partnerName}) cobre apenas 1 acesso diário.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
                <span>Token / Código de Check-in Diário ({partnerName})</span>
                <span className="text-[10px] text-primary font-normal">Exibido no app do aluno</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={partnerName === 'WellHub' ? 'Código de 6 dígitos (ex: 849102)' : 'Código ou Voucher do parceiro'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline focus:border-primary rounded-2xl px-4 py-3.5 text-sm text-on-surface font-mono tracking-wider outline-none transition-all"
                  autoFocus
                />
                <Key size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Se o aluno já realizou o check-in por geolocalização no app do parceiro, você pode liberar diretamente abaixo.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {usage.isExceeded && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-500 text-xs">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Limite de Aulas do Plano Atingido!</p>
                  <p className="text-[11px] text-red-400 mt-1">
                    O aluno já realizou <span className="font-bold">{usage.monthlyClasses} de {usage.monthlyLimit} aulas</span> permitidas no plano <b>{student.contractedPlan}</b> neste mês.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-outline text-on-surface-variant hover:text-on-surface text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Cancelar
          </button>

          {isPartner ? (
            <button
              type="button"
              onClick={() => handleValidateAndConfirm(false)}
              disabled={isValidating}
              className={`px-6 py-3.5 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                partnerName === 'WellHub' 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                  : partnerName === 'GuruPass' 
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20' 
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
              }`}
            >
              {isValidating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Validando no Parceiro...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Validar e Liberar Check-in</span>
                </>
              )}
            </button>
          ) : usage.isExceeded ? (
            <button
              type="button"
              onClick={() => handleValidateAndConfirm(true)}
              disabled={isValidating}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap size={16} />
              <span>Autorizar Aula Extra / Reposição</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleValidateAndConfirm(false)}
              disabled={isValidating}
              className="px-6 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>Confirmar Presença</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
