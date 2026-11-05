import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  X, 
  Download, 
  Share2, 
  ShieldCheck, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  CreditCard 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { calculateStudentClassUsage } from '../utils/planUsage';

export interface DigitalCardStudent {
  id: string;
  name: string;
  email: string;
  document: string;
  classes: string[];
  turmas: string[];
  status: 'active' | 'inactive';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  planType: 'Studio' | 'WellHub' | 'GuruPass' | 'TotalPass';
  contractedPlan: string;
  avatar?: string;
  joinDate?: string;
  attendance?: any[];
  customClassLimit?: number;
  partnerMemberId?: string;
}

interface StudentDigitalCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: DigitalCardStudent | null;
  studioName?: string;
  studioLogo?: string | null;
}

export function StudentDigitalCardModal({
  isOpen,
  onClose,
  student,
  studioName = "STYLO URBANO",
  studioLogo = null
}: StudentDigitalCardModalProps) {
  if (!isOpen || !student) return null;

  // Standard check-in QR payload JSON
  const qrPayload = JSON.stringify({
    type: "student_checkin",
    studentId: student.id,
    name: student.name,
    document: student.document,
    plan: student.planType
  });

  const downloadCardImage = () => {
    const canvas = document.getElementById(`student-card-qr-${student.id}`) as HTMLCanvasElement;
    if (!canvas) {
      toast.error('Não foi possível gerar a imagem do QR Code.');
      return;
    }
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `carteirinha-qr-${student.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success('QR Code da carteirinha baixado com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-surface-container border border-outline rounded-[36px] shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline/50 flex items-center justify-between bg-surface-container-high/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <h3 className="text-sm font-headline font-black uppercase tracking-wider text-on-surface">
              Carteirinha Digital do Aluno
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Digital Badge Card */}
        <div className="p-6 space-y-6">
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#1E1E24] via-[#151518] to-[#0A0A0C] border border-primary/30 shadow-[0_0_30px_rgba(255,107,0,0.15)] text-white space-y-6 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Studio Branding */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                {studioLogo ? (
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20">
                    <img src={studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-base shadow-md">
                    {studioName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white leading-tight">
                    {studioName}
                  </h4>
                  <p className="text-[9px] text-primary font-bold uppercase tracking-widest">
                    Passe de Acesso Digital
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck size={12} />
                {student.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {/* QR Code Block */}
            <div className="flex flex-col items-center justify-center py-2 relative z-10">
              <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-white/90">
                <QRCodeCanvas
                  id={`student-card-qr-${student.id}`}
                  value={qrPayload}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-3 flex items-center gap-1">
                <Sparkles size={12} className="text-primary" />
                Apresente na recepção para check-in
              </p>
            </div>

            {/* Student Info */}
            <div className="pt-2 border-t border-white/10 space-y-2 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Aluno</p>
                  <p className="text-sm font-black uppercase tracking-tight text-white">{student.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Plano</p>
                  <span className="text-[10px] font-black text-primary uppercase">
                    {student.planType} {student.contractedPlan ? `• ${student.contractedPlan}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/70">
                <span>CPF: <strong className="text-white">{student.document || '---'}</strong></span>
                <span>Matrícula: <strong className="text-white">#{student.id.slice(-6).toUpperCase()}</strong></span>
              </div>

              {/* Class Usage Badge */}
              {(() => {
                const usage = calculateStudentClassUsage(student);
                return (
                  <div className="flex items-center justify-between pt-1 text-[10px] bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10">
                    <span className="text-white/60 font-semibold">Contador de Aulas:</span>
                    <div className="flex items-center gap-1.5">
                      {student.partnerMemberId && (
                        <span className="font-mono text-[9px] text-white/80 bg-white/10 px-1 rounded">
                          ID: {student.partnerMemberId}
                        </span>
                      )}
                      <span className={`font-black px-1.5 py-0.5 rounded text-[9px] ${
                        usage.isExceeded ? 'bg-red-500/20 text-red-400' :
                        usage.isNearLimit ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {usage.monthlyClasses}/{usage.monthlyLimit} aulas
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={downloadCardImage}
              className="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>Baixar QR Code</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-3 bg-surface-container-high border border-outline hover:border-primary text-on-surface rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-surface-container-highest transition-all flex items-center gap-2"
              title="Imprimir"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
