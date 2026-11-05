import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  SlidersHorizontal, 
  AlertTriangle, 
  Check, 
  Users, 
  Sparkles, 
  Plus, 
  Minus,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface TurmaCapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmas: string[];
  students: { id: string; name: string; turmas?: string[] }[];
  capacities: Record<string, number>;
  onSave: (newCapacities: Record<string, number>) => Promise<void> | void;
  getTurmaColor?: (turma: string) => string;
}

export function TurmaCapacityModal({
  isOpen,
  onClose,
  turmas,
  students,
  capacities,
  onSave,
  getTurmaColor
}: TurmaCapacityModalProps) {
  const [localCapacities, setLocalCapacities] = useState<Record<string, number>>({});
  const [bulkValue, setBulkValue] = useState<number>(20);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, number> = {};
      turmas.forEach(t => {
        initial[t] = capacities[t] !== undefined ? capacities[t] : 20;
      });
      setLocalCapacities(initial);
    }
  }, [isOpen, turmas, capacities]);

  if (!isOpen) return null;

  const handleUpdate = (turma: string, value: number) => {
    const valid = Math.max(1, Math.min(500, value));
    setLocalCapacities(prev => ({
      ...prev,
      [turma]: valid
    }));
  };

  const handleApplyBulk = () => {
    if (bulkValue < 1) return;
    const updated: Record<string, number> = {};
    turmas.forEach(t => {
      updated[t] = bulkValue;
    });
    setLocalCapacities(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localCapacities);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Compute stats
  const statsList = turmas.map(turmaName => {
    const enrolled = students.filter(s => (s.turmas || []).some(t => t.toLowerCase() === turmaName.toLowerCase())).length;
    const capacity = localCapacities[turmaName] || 20;
    const occupancyRate = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
    const isCritical = occupancyRate >= 90;
    const isFull = occupancyRate >= 100;
    const remaining = capacity - enrolled;

    return {
      turmaName,
      enrolled,
      capacity,
      occupancyRate,
      isCritical,
      isFull,
      remaining
    };
  });

  const criticalCount = statsList.filter(s => s.isCritical).length;
  const totalCapacity = statsList.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalEnrolled = statsList.reduce((acc, curr) => acc + curr.enrolled, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-surface-container border border-outline rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-outline flex items-center justify-between bg-surface-container-high/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-headline font-bold text-on-surface">
                  Capacidade Máxima das Turmas
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Defina o limite de vagas para alertar a recepção ao atingir 90% de ocupação
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-xl border border-outline transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
            {/* Info notice about 90% threshold */}
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-xs text-on-surface">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-400">Regra de Alerta de Lotação (90%+)</p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Quando uma turma tiver 90% ou mais das vagas ocupadas por alunos matriculados, o widget de Check-in exibirá alertas visuais em destaque (banner, filtros e lista) para evitar superlotação nas salas.
                </p>
              </div>
            </div>

            {/* Bulk set controls */}
            <div className="p-3.5 rounded-2xl border border-outline bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary shrink-0" />
                <span className="text-xs font-bold text-on-surface">
                  Capacidade padrão para todas:
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={bulkValue}
                  onChange={(e) => setBulkValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 bg-surface-container border border-outline rounded-xl px-3 py-1.5 text-center font-mono font-bold text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyBulk}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  Aplicar a Todas
                </button>
              </div>
            </div>

            {/* List of turmas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span>Turma & Ocupação</span>
                <span>Capacidade Máxima (Vagas)</span>
              </div>

              <div className="space-y-2.5">
                {statsList.map(item => {
                  const currentCap = localCapacities[item.turmaName] || item.capacity;
                  const occ = currentCap > 0 ? Math.round((item.enrolled / currentCap) * 100) : 0;
                  const isCrit = occ >= 90;
                  const isFull = occ >= 100;
                  const remaining = currentCap - item.enrolled;

                  return (
                    <div
                      key={item.turmaName}
                      className={cn(
                        "p-4 rounded-2xl border transition-all space-y-3",
                        isFull
                          ? "bg-red-500/10 border-red-500/40"
                          : isCrit
                            ? "bg-amber-500/10 border-amber-500/40"
                            : "bg-surface-container-low border-outline"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider",
                            getTurmaColor ? getTurmaColor(item.turmaName) : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {item.turmaName}
                          </span>

                          <span className="text-xs text-on-surface-variant font-medium">
                            {item.enrolled} matriculado{item.enrolled !== 1 ? 's' : ''}
                          </span>

                          {isCrit && (
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1",
                              isFull 
                                ? "bg-red-500 text-white animate-pulse" 
                                : "bg-amber-500 text-black"
                            )}>
                              <AlertTriangle size={11} />
                              {isFull ? '100%+ Lotada' : '≥ 90% Crítico'}
                            </span>
                          )}
                        </div>

                        {/* Stepper controls */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleUpdate(item.turmaName, currentCap - 5)}
                            className="px-2 py-1 bg-surface-container hover:bg-white/10 text-on-surface-variant hover:text-on-surface border border-outline rounded-lg text-xs font-mono font-bold transition-colors"
                            title="Diminuir 5 vagas"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(item.turmaName, currentCap - 1)}
                            className="p-1.5 bg-surface-container hover:bg-white/10 text-on-surface-variant hover:text-on-surface border border-outline rounded-lg transition-colors"
                            title="Diminuir 1 vaga"
                          >
                            <Minus size={14} />
                          </button>

                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={currentCap}
                            onChange={(e) => handleUpdate(item.turmaName, parseInt(e.target.value) || 1)}
                            className="w-16 text-center bg-surface-container border border-outline rounded-xl py-1 text-sm font-mono font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdate(item.turmaName, currentCap + 1)}
                            className="p-1.5 bg-surface-container hover:bg-white/10 text-on-surface-variant hover:text-on-surface border border-outline rounded-lg transition-colors"
                            title="Aumentar 1 vaga"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(item.turmaName, currentCap + 5)}
                            className="px-2 py-1 bg-surface-container hover:bg-white/10 text-on-surface-variant hover:text-on-surface border border-outline rounded-lg text-xs font-mono font-bold transition-colors"
                            title="Aumentar 5 vagas"
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar & Status */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className={cn(
                            "font-bold",
                            isFull ? "text-red-400" : isCrit ? "text-amber-400" : "text-on-surface-variant"
                          )}>
                            Ocupação: {occ}% ({item.enrolled}/{currentCap} vagas)
                          </span>
                          <span className={cn(
                            "text-[10px] font-medium",
                            remaining <= 0 ? "text-red-400 font-bold" : "text-on-surface-variant"
                          )}>
                            {remaining > 0 ? `${remaining} vaga(s) disponível(is)` : remaining === 0 ? 'Sem vagas restantes' : `${Math.abs(remaining)} aluno(s) excedente(s)`}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden border border-outline/40">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              isFull 
                                ? "bg-red-500" 
                                : isCrit 
                                  ? "bg-amber-500" 
                                  : occ >= 75 
                                    ? "bg-yellow-500" 
                                    : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, occ)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer with summary & save button */}
          <div className="p-5 sm:p-6 border-t border-outline bg-surface-container-high/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-mono text-on-surface-variant">
              <div>
                Total Vagas: <strong className="text-on-surface">{totalCapacity}</strong>
              </div>
              <div>
                Matriculados: <strong className="text-on-surface">{totalEnrolled}</strong>
              </div>
              {criticalCount > 0 && (
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle size={13} />
                  <span>{criticalCount} crítica(s)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-outline transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Salvar Capacidades</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
