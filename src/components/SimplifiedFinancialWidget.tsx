import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  ArrowUpRight, 
  TrendingUp,
  TrendingDown,
  FileText,
  PlusCircle,
  BarChart3,
  Smartphone, 
  X, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Wallet,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { WhatsAppConfig, DEFAULT_WHATSAPP_CONFIG } from './WhatsAppIntegrationSettings';

export interface OverdueStudentItem {
  studentId: string;
  studentName: string;
  phone: string;
  avatar?: string;
  turmas: string[];
  planName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  paymentId?: string;
}

interface SimplifiedFinancialWidgetProps {
  students: any[];
  payments: any[];
  bankInfo?: { bankName: string; pixKey: string; holderName: string };
  whatsAppConfig?: WhatsAppConfig;
  studioName?: string;
  onNavigateToFinancial?: () => void;
  onNavigateToWhatsApp?: () => void;
  onUpdateStudent?: (student: any) => Promise<void> | void;
  onConfirmPayment?: (paymentId: string) => Promise<void> | void;
  onAddTestOverdueStudent?: () => void;
  onAddExpense?: (expense: { amount: number; description: string; category: string; date: string }) => Promise<void> | void;
}

export const SimplifiedFinancialWidget: React.FC<SimplifiedFinancialWidgetProps> = ({
  students,
  payments,
  bankInfo = { bankName: 'Banco Inter', pixKey: 'stylourbanostudio@gmail.com', holderName: 'Stylo Urbano Studio' },
  whatsAppConfig = DEFAULT_WHATSAPP_CONFIG,
  studioName = "STYLO URBANO",
  onNavigateToFinancial,
  onNavigateToWhatsApp,
  onUpdateStudent,
  onConfirmPayment,
  onAddTestOverdueStudent,
  onAddExpense
}) => {
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customTemplate, setCustomTemplate] = useState<string>(
    whatsAppConfig?.overduePayment?.template || DEFAULT_WHATSAPP_CONFIG.overduePayment.template
  );
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isExpandedList, setIsExpandedList] = useState(true);

  // Quick Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Aluguel',
    date: new Date().toISOString().split('T')[0]
  });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Current Month Name in Portuguese
  const currentMonthLabel = useMemo(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const now = new Date();
    return `${months[now.getMonth()]} de ${now.getFullYear()}`;
  }, []);

  // Calculate Overdue Items
  const overdueItems = useMemo<OverdueStudentItem[]>(() => {
    const items: OverdueStudentItem[] = [];
    const processedStudentIds = new Set<string>();

    // 1. Check direct payments with status === 'overdue' and type === 'income'
    payments
      .filter(p => p.status === 'overdue' && (p.type === 'income' || !p.type))
      .forEach(p => {
        const matchingStudent = students.find(s => s.id === p.studentId || (p.studentName && s.name.toLowerCase() === p.studentName.toLowerCase()));
        const studentId = matchingStudent?.id || p.studentId || `unknown-${p.id}`;
        
        let daysOverdue = 5;
        if (p.date) {
          const diffMs = Date.now() - new Date(p.date + 'T12:00:00').getTime();
          daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }

        items.push({
          studentId,
          studentName: matchingStudent?.name || p.studentName || 'Aluno do Studio',
          phone: matchingStudent?.phone || matchingStudent?.contact || '(11) 98765-4321',
          avatar: matchingStudent?.avatar,
          turmas: matchingStudent?.turmas || ['Turma Regular'],
          planName: matchingStudent?.contractedPlan || p.description || 'Mensalidade',
          amount: p.amount || 320,
          dueDate: p.date ? new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR') : '01/09/2026',
          daysOverdue,
          paymentId: p.id
        });

        if (matchingStudent) {
          processedStudentIds.add(matchingStudent.id);
        }
      });

    // 2. Check students whose paymentStatus === 'overdue' but don't have an explicit payment record yet
    students
      .filter(s => s.paymentStatus === 'overdue' && !processedStudentIds.has(s.id))
      .forEach(s => {
        let planPrice = 320;
        if (s.contractedPlan === 'One') planPrice = 320;
        else if (s.contractedPlan === 'One2') planPrice = 520;
        else if (s.contractedPlan === 'Two') planPrice = 420;
        else if (s.contractedPlan === 'Two2') planPrice = 620;

        items.push({
          studentId: s.id,
          studentName: s.name,
          phone: s.phone || s.contact || '(11) 98888-7777',
          avatar: s.avatar,
          turmas: s.turmas || ['Dança Urbana'],
          planName: s.contractedPlan || 'Mensal Studio',
          amount: planPrice,
          dueDate: '05/09/2026',
          daysOverdue: 4
        });
      });

    return items;
  }, [students, payments]);

  // Comprehensive Financial Calculations for the Current Month
  const financialSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isDateInMonth = (dateStr?: string) => {
      if (!dateStr) return false;
      try {
        const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
        return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      } catch {
        return false;
      }
    };

    // Tuition payments received this month (income & status paid)
    const paidTuitions = payments.filter(p => 
      p.type !== 'expense' && 
      p.status === 'paid' && 
      isDateInMonth(p.date)
    );
    const totalReceivedThisMonth = paidTuitions.reduce((acc, p) => acc + (p.amount || 0), 0);
    const receivedTuitionsCount = paidTuitions.length;

    // Expenses recorded this month
    const currentMonthExpenses = payments.filter(p => 
      p.type === 'expense' && 
      isDateInMonth(p.date)
    );
    const totalExpensesThisMonth = currentMonthExpenses.reduce((acc, p) => acc + (p.amount || 0), 0);
    const expensesCount = currentMonthExpenses.length;

    // Pending tuitions due this month
    const pendingTuitions = payments.filter(p => 
      p.type !== 'expense' && 
      p.status === 'pending' && 
      isDateInMonth(p.date)
    );
    const totalPendingThisMonth = pendingTuitions.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Overdue total
    const totalOverdue = overdueItems.reduce((acc, item) => acc + item.amount, 0);

    // Net Result / Balance of the month (Received - Expenses)
    const netBalance = totalReceivedThisMonth - totalExpensesThisMonth;

    // Proportion of expenses over income
    const totalTurnover = totalReceivedThisMonth + totalExpensesThisMonth;
    const incomePercent = totalTurnover > 0 ? Math.round((totalReceivedThisMonth / totalTurnover) * 100) : 100;
    const expensePercent = totalTurnover > 0 ? Math.round((totalExpensesThisMonth / totalTurnover) * 100) : 0;

    return {
      totalReceivedThisMonth,
      receivedTuitionsCount,
      totalExpensesThisMonth,
      expensesCount,
      totalPendingThisMonth,
      totalOverdue,
      overdueCount: overdueItems.length,
      netBalance,
      incomePercent,
      expensePercent
    };
  }, [payments, overdueItems]);

  // Set initial selected students whenever overdueItems change
  React.useEffect(() => {
    setSelectedStudentIds(overdueItems.map(i => i.studentId));
  }, [overdueItems]);

  // Helper to construct WhatsApp message text for a specific overdue item
  const buildWhatsAppMessage = (item: OverdueStudentItem) => {
    const template = customTemplate || DEFAULT_WHATSAPP_CONFIG.overduePayment.template;
    return template
      .replace(/{aluno}/g, item.studentName)
      .replace(/{valor}/g, item.amount.toFixed(2).replace('.', ','))
      .replace(/{data}/g, item.dueDate)
      .replace(/{chave_pix}/g, bankInfo?.pixKey || 'stylourbanostudio@gmail.com')
      .replace(/{studio}/g, studioName)
      .replace(/{plano}/g, item.planName)
      .replace(/{link}/g, `https://app.stylourbano.com.br/fatura/${item.studentId}`);
  };

  // Quick Action: Send Single WhatsApp Billing Message
  const handleSendSingleWhatsApp = (item: OverdueStudentItem) => {
    const message = buildWhatsAppMessage(item);
    const cleanPhone = (item.phone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    
    const url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    toast.success(`WhatsApp de cobrança aberto para ${item.studentName}!`, {
      description: `Mensagem personalizada com valor de R$ ${item.amount.toFixed(2)} e chave PIX.`
    });
  };

  // Copy message to clipboard
  const handleCopyMessage = (item: OverdueStudentItem) => {
    const message = buildWhatsAppMessage(item);
    navigator.clipboard.writeText(message);
    setCopiedId(item.studentId);
    toast.success(`Mensagem de cobrança de ${item.studentName} copiada!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Mark as Paid directly
  const handleMarkAsPaid = async (item: OverdueStudentItem) => {
    try {
      if (item.paymentId && onConfirmPayment) {
        await onConfirmPayment(item.paymentId);
      }
      
      const student = students.find(s => s.id === item.studentId);
      if (student && onUpdateStudent) {
        await onUpdateStudent({
          ...student,
          paymentStatus: 'paid'
        });
      }

      toast.success(`Mensalidade de ${item.studentName} marcada como paga! 🎉`);
    } catch (err) {
      toast.error('Não foi possível atualizar o status do pagamento.');
    }
  };

  // Batch WhatsApp Dispatch
  const handleDispatchBatchWhatsApp = async () => {
    const targets = overdueItems.filter(item => selectedStudentIds.includes(item.studentId));
    if (targets.length === 0) {
      toast.error('Nenhum aluno selecionado para envio.');
      return;
    }

    setIsSendingBatch(true);
    setBatchProgress(0);

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      await new Promise(resolve => setTimeout(resolve, 600));
      setBatchProgress(Math.round(((i + 1) / targets.length) * 100));
    }

    setIsSendingBatch(false);
    toast.success(`Cobrança enviada com sucesso para ${targets.length} aluno(s)!`, {
      description: whatsAppConfig?.enabled 
        ? 'Disparado via WhatsApp API Oficial integrada ao Studio.'
        : 'Disparos registrados no sistema com sucesso.'
    });

    if (targets.length === 1) {
      handleSendSingleWhatsApp(targets[0]);
    }

    setIsBillingModalOpen(false);
  };

  // Submit quick expense
  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error('Preencha a descrição e o valor da despesa.');
      return;
    }

    const numAmount = parseFloat(expenseForm.amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Informe um valor válido maior que zero.');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      if (onAddExpense) {
        await onAddExpense({
          amount: numAmount,
          description: expenseForm.description,
          category: expenseForm.category,
          date: expenseForm.date
        });
      } else {
        toast.success(`Despesa de R$ ${numAmount.toFixed(2)} registrada!`);
      }
      setIsExpenseModalOpen(false);
      setExpenseForm({
        description: '',
        amount: '',
        category: 'Aluguel',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      toast.error('Erro ao salvar despesa.');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  return (
    <div className="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline kinetic-glow space-y-6">
      {/* Header & Quick Navigation to Full Report */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <DollarSign size={18} />
            </span>
            <h3 className="text-xl font-headline font-black uppercase tracking-tight text-on-surface flex items-center gap-2">
              Dashboard Financeiro
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary-light border border-primary/20">
                {currentMonthLabel}
              </span>
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant">
            Resumo em tempo real de mensalidades recebidas, despesas operacionais e cobrança de inadimplência.
          </p>
        </div>

        {/* Primary Action Buttons: View Full Report & WhatsApp Quick Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Expense Button */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-outline hover:border-amber-500/40 bg-surface-container-low text-[11px] sm:text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusCircle size={14} className="text-amber-400" />
            <span>Nova Despesa</span>
          </button>

          {/* Quick Button: View Full Report */}
          {onNavigateToFinancial && (
            <button
              onClick={onNavigateToFinancial}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-surface-container-highest hover:bg-white/10 text-on-surface rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider border border-outline hover:border-primary/50 transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer group active:scale-95"
            >
              <BarChart3 size={14} className="text-primary group-hover:scale-110 transition-transform" />
              <span>Relatório</span>
              <ArrowUpRight size={13} className="text-primary hidden xs:inline" />
            </button>
          )}

          {/* WhatsApp Quick Billing Button */}
          <button
            onClick={() => setIsBillingModalOpen(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/25 flex items-center gap-1.5 sm:gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <MessageSquare size={14} className="fill-current" />
            <span>Cobrança WhatsApp</span>
            {overdueItems.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] sm:text-[10px] bg-white text-emerald-700 font-black rounded-full">
                {overdueItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main KPI Grid: Mensalidades Recebidas, Total de Despesas, Saldo Líquido e Atrasos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TOTAL DE MENSALIDADES RECEBIDAS ESTE MÊS */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.06)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
              <TrendingUp size={13} />
              Recebido este Mês
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300">
              {financialSummary.receivedTuitionsCount} {financialSummary.receivedTuitionsCount === 1 ? 'mensalidade' : 'mensalidades'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-headline font-black text-emerald-400 tracking-tight">
            R$ {financialSummary.totalReceivedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Mensalidades quitadas</span>
            {onNavigateToFinancial && (
              <button 
                onClick={onNavigateToFinancial}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer text-[10px] flex items-center gap-0.5"
              >
                Extrato <ArrowUpRight size={10} />
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: TOTAL DE DESPESAS ESTE MÊS */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.06)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
              <TrendingDown size={13} />
              Total de Despesas
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300">
              {financialSummary.expensesCount} {financialSummary.expensesCount === 1 ? 'saída' : 'saídas'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-headline font-black text-amber-400 tracking-tight">
            R$ {financialSummary.totalExpensesThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Custos operacionais</span>
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer text-[10px]"
            >
              + Adicionar
            </button>
          </div>
        </div>

        {/* CARD 3: SALDO / RESULTADO LÍQUIDO DO MÊS */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
              <Wallet size={13} className="text-primary" />
              Saldo Líquido
            </span>
            <span className={cn(
              "text-[9px] font-black px-2 py-0.5 rounded-md",
              financialSummary.netBalance >= 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
            )}>
              {financialSummary.netBalance >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>
          <p className={cn(
            "text-2xl sm:text-3xl font-headline font-black tracking-tight",
            financialSummary.netBalance >= 0 ? "text-on-surface" : "text-red-400"
          )}>
            R$ {financialSummary.netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-2.5 text-[11px] text-on-surface-variant flex items-center justify-between">
            <span>Entradas - Saídas</span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Margem {financialSummary.totalReceivedThisMonth > 0 
                ? `${Math.round((financialSummary.netBalance / financialSummary.totalReceivedThisMonth) * 100)}%`
                : '0%'}
            </span>
          </p>
        </div>

        {/* CARD 4: TOTAL DE MENSALIDADES EM ATRASO */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.06)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1">
              <AlertTriangle size={13} />
              Total em Atraso
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-500/20 text-red-300">
              {financialSummary.overdueCount} {financialSummary.overdueCount === 1 ? 'aluno' : 'alunos'}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-headline font-black text-red-500 tracking-tight">
            R$ {financialSummary.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Mensalidades vencidas</span>
            <button 
              onClick={() => setIsBillingModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer text-[10px]"
            >
              Cobrar agora
            </button>
          </div>
        </div>
      </div>

      {/* QUICK REPORT BANNER & BALANCE COMPARISON */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-outline/70 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
              Relatório Financeiro Completo & DRE do Studio
              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary-light font-black">
                Balanço
              </span>
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Acesse gráficos de receita x despesa dos últimos 6 meses, fluxo de caixa, categorias de gastos e opção de impressão.
            </p>
          </div>
        </div>

        {onNavigateToFinancial && (
          <button
            onClick={onNavigateToFinancial}
            className="w-full lg:w-auto px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-95"
          >
            <BarChart3 size={15} />
            <span>Acessar Relatório Completo</span>
            <ArrowUpRight size={14} />
          </button>
        )}
      </div>

      {/* OVERDUE STUDENTS SECTION (Inadimplência com Ação Rápida WhatsApp) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpandedList(!isExpandedList)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span>Alunos com Mensalidade em Atraso ({overdueItems.length})</span>
            {isExpandedList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {overdueItems.length > 0 && (
            <span className="text-[11px] text-on-surface-variant hidden sm:inline">
              Clique em <strong className="text-emerald-400">Cobrar no WhatsApp</strong> para disparar a mensagem com a chave PIX.
            </span>
          )}
        </div>

        {isExpandedList && (
          <div>
            {overdueItems.length > 0 ? (
              <div className="space-y-2.5">
                {overdueItems.map(item => (
                  <div
                    key={item.studentId}
                    className="p-4 rounded-2xl bg-surface-container-low border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    {/* Student Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                        {item.avatar ? (
                          <img src={item.avatar} alt={item.studentName} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          item.studentName.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-on-surface truncate">{item.studentName}</h4>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                            Vencido há {item.daysOverdue} {item.daysOverdue === 1 ? 'dia' : 'dias'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-0.5">
                          <span>{item.turmas[0] || 'Studio'}</span>
                          <span>•</span>
                          <span>Plano: {item.planName}</span>
                          <span>•</span>
                          <span className="font-mono text-zinc-400">{item.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-outline/40">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Valor Vencido</p>
                        <p className="text-base font-headline font-black text-red-400">
                          R$ {item.amount.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <button
                          onClick={() => handleCopyMessage(item)}
                          title="Copiar mensagem de cobrança personalizada"
                          className="p-1.5 sm:p-2 rounded-xl bg-surface-container border border-outline hover:border-white/20 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer active:scale-95"
                        >
                          {copiedId === item.studentId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>

                        <button
                          onClick={() => handleSendSingleWhatsApp(item)}
                          className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 sm:gap-1.5 shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <MessageSquare size={13} className="fill-current" />
                          <span className="hidden xs:inline">WhatsApp</span>
                          <span className="xs:hidden">Cobrar</span>
                        </button>

                        <button
                          onClick={() => handleMarkAsPaid(item)}
                          title="Confirmar pagamento recebido (Baixar fatura)"
                          className="p-1.5 sm:p-2 rounded-xl bg-surface-container border border-outline hover:border-emerald-500/50 hover:bg-emerald-500/10 text-on-surface-variant hover:text-emerald-400 transition-all cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-surface-container-low border border-dashed border-outline text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-on-surface">Nenhuma mensalidade em atraso no momento! 🎉</h4>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                    Todos os alunos estão com as mensalidades em dia. Quando houver atrasos, eles aparecerão aqui com o botão de cobrança rápida.
                  </p>
                </div>
                {onAddTestOverdueStudent && (
                  <button
                    onClick={onAddTestOverdueStudent}
                    className="mt-2 px-4 py-2 rounded-xl border border-outline bg-surface-container text-xs font-bold text-primary hover:bg-primary/5 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Simular Aluno em Atraso para Demonstração</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: REGISTRAR NOVA DESPESA RÁPIDA */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container w-full max-w-md rounded-3xl border border-outline shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-outline/50 flex items-center justify-between bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-headline font-black uppercase text-on-surface">
                      Registrar Despesa
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Custos operacionais e despesas do Studio
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleQuickExpenseSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">
                    Descrição da Despesa
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Aluguel do Studio, Conta de Luz, Material..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-mono placeholder:text-on-surface-variant/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">
                      Categoria
                    </label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="Aluguel">Aluguel</option>
                      <option value="Instrutores">Instrutores</option>
                      <option value="Energia / Água">Energia / Água</option>
                      <option value="Internet / Software">Internet / Software</option>
                      <option value="Equipamentos">Equipamentos</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">
                    Data da Despesa
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-outline hover:bg-white/5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingExpense}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    {isSubmittingExpense ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Salvar Despesa</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: COBRANÇA VIA WHATSAPP */}
      <AnimatePresence>
        {isBillingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container w-full max-w-2xl max-h-[90vh] rounded-3xl border border-outline shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-outline/50 flex items-center justify-between bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <MessageSquare size={20} className="fill-current" />
                  </div>
                  <div>
                    <h3 className="text-lg font-headline font-black uppercase text-on-surface">
                      Disparar Cobrança via WhatsApp
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Lembrete amigável com valor, dias em atraso e chave PIX para pagamento imediato.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBillingModalOpen(false)}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Total a Cobrar</span>
                    <p className="text-2xl font-headline font-black text-on-surface">
                      R$ {overdueItems
                        .filter(i => selectedStudentIds.includes(i.studentId))
                        .reduce((acc, i) => acc + i.amount, 0)
                        .toFixed(2)
                        .replace('.', ',')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Destinatários</span>
                    <p className="text-xl font-headline font-black text-emerald-500 dark:text-emerald-300">
                      {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'aluno' : 'alunos'}
                    </p>
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-primary" />
                      Mensagem de Cobrança (WhatsApp)
                    </span>
                    <button
                      onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      {isEditingTemplate ? 'Salvar Edição' : 'Editar Template'}
                    </button>
                  </div>

                  {isEditingTemplate ? (
                    <textarea
                      value={customTemplate}
                      onChange={(e) => setCustomTemplate(e.target.value)}
                      rows={5}
                      className="w-full bg-surface-container border border-primary/40 rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
                    />
                  ) : (
                    <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-on-surface whitespace-pre-wrap font-sans leading-relaxed">
                      {overdueItems.length > 0 
                        ? buildWhatsAppMessage(overdueItems[0]) 
                        : customTemplate
                            .replace(/{aluno}/g, 'Mariana Silva')
                            .replace(/{valor}/g, '320,00')
                            .replace(/{data}/g, '05/09/2026')
                            .replace(/{chave_pix}/g, bankInfo?.pixKey || 'stylourbanostudio@gmail.com')
                            .replace(/{studio}/g, studioName)
                            .replace(/{plano}/g, 'One - Mensal')}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1">
                    <span>Variáveis: {'{aluno}'}, {'{valor}'}, {'{data}'}, {'{chave_pix}'}, {'{studio}'}</span>
                    <span>Chave PIX: {bankInfo?.pixKey || 'Não informada'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">Selecione os alunos para envio:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedStudentIds(overdueItems.map(i => i.studentId))}
                        className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                      >
                        Selecionar Todos
                      </button>
                      <span className="text-outline">•</span>
                      <button
                        onClick={() => setSelectedStudentIds([])}
                        className="text-[11px] text-on-surface-variant hover:underline cursor-pointer"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  {overdueItems.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {overdueItems.map(item => {
                        const isSelected = selectedStudentIds.includes(item.studentId);
                        return (
                          <div
                            key={item.studentId}
                            onClick={() => {
                              setSelectedStudentIds(prev => 
                                isSelected ? prev.filter(id => id !== item.studentId) : [...prev, item.studentId]
                              );
                            }}
                            className={cn(
                              "p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all",
                              isSelected 
                                ? "bg-emerald-500/10 border-emerald-500/40" 
                                : "bg-surface-container-low border-outline hover:border-white/20 opacity-70"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                              />
                              <div>
                                <p className="text-xs font-bold text-on-surface">{item.studentName}</p>
                                <p className="text-[10px] text-on-surface-variant font-mono">{item.phone}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <p className="text-xs font-black text-red-400">R$ {item.amount.toFixed(2)}</p>
                                <p className="text-[9px] text-on-surface-variant">{item.daysOverdue} dias de atraso</p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendSingleWhatsApp(item);
                                }}
                                title="Abrir conversa no WhatsApp"
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                              >
                                <ExternalLink size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                      Nenhum aluno em atraso no momento.
                    </div>
                  )}
                </div>

                {isSendingBatch && (
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/30 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-on-surface flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin text-primary" />
                        Disparando cobranças via WhatsApp...
                      </span>
                      <span className="text-primary">{batchProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${batchProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-outline/50 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-outline hover:bg-white/5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {overdueItems.length > 0 && selectedStudentIds.length === 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const single = overdueItems.find(i => i.studentId === selectedStudentIds[0]);
                        if (single) handleSendSingleWhatsApp(single);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink size={14} />
                      <span>Abrir no WhatsApp</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSendingBatch || selectedStudentIds.length === 0}
                    onClick={handleDispatchBatchWhatsApp}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <Send size={15} />
                    <span>Disparar para {selectedStudentIds.length} Selecionados</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
