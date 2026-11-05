import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

export interface PlanConfigItem {
  id: string;
  name: string;
  price: number;
  type: 'Studio' | 'WellHub' | 'GuruPass' | 'TotalPass';
  classesPerWeek?: number;
  monthlyLimit?: number;
  description?: string;
  isSingleClass?: boolean;
}

export const BASE_PLANS_CONFIG: PlanConfigItem[] = [
  { id: 'starter', name: 'Starter', price: 0, type: 'Studio', classesPerWeek: 1, monthlyLimit: 2, description: '2 aulas experimentais' },
  { id: 'one', name: 'One', price: 320, type: 'Studio', classesPerWeek: 1, monthlyLimit: 4, description: 'Mensal 1 aula/semana (4 aulas/mês)' },
  { id: 'one2', name: 'One2', price: 520, type: 'Studio', classesPerWeek: 2, monthlyLimit: 8, description: 'Mensal 2 aulas/semana (8 aulas/mês)' },
  { id: 'six', name: 'Six', price: 280, type: 'Studio', classesPerWeek: 1, monthlyLimit: 4, description: 'Semestral 1 aula/semana (4 aulas/mês)' },
  { id: 'six2', name: 'Six2', price: 460, type: 'Studio', classesPerWeek: 2, monthlyLimit: 8, description: 'Semestral 2 aulas/semana (8 aulas/mês)' },
  { id: 'loyalty', name: 'Loyalty', price: 240, type: 'Studio', classesPerWeek: 1, monthlyLimit: 4, description: 'Anual 1 aula/semana (4 aulas/mês)' },
  { id: 'loyalty2', name: 'Loyalty2', price: 400, type: 'Studio', classesPerWeek: 2, monthlyLimit: 8, description: 'Anual 2 aulas/semana (8 aulas/mês)' },
  { id: 'family', name: 'Family', price: 439.99, type: 'Studio', classesPerWeek: 2, monthlyLimit: 8, description: 'Até 3 pessoas 10%, acima de 3 15% (8 aulas/mês)' },
  { id: 'today-dance', name: 'Today Dance', price: 90, type: 'Studio', classesPerWeek: 1, monthlyLimit: 1, isSingleClass: true, description: 'Valor de 1 aula avulsa' },
  
  // WellHub / Gympass
  { id: 'wellhub-basic', name: 'Wellhub Basic', price: 39.99, type: 'WellHub', classesPerWeek: 7, monthlyLimit: 30, description: '1 check-in diário Wellhub' },
  { id: 'wellhub-basic-plus', name: 'Wellhub Basic+', price: 69.99, type: 'WellHub', classesPerWeek: 7, monthlyLimit: 30, description: '1 check-in diário Wellhub' },
  { id: 'wellhub-silver', name: 'Wellhub Silver', price: 99.99, type: 'WellHub', classesPerWeek: 7, monthlyLimit: 30, description: '1 check-in diário Wellhub' },
  { id: 'wellhub-silver-plus', name: 'Wellhub Silver+', price: 149.99, type: 'WellHub', classesPerWeek: 7, monthlyLimit: 30, description: '1 check-in diário Wellhub' },
  { id: 'wellhub-gold', name: 'Wellhub Gold', price: 199.99, type: 'WellHub', classesPerWeek: 7, monthlyLimit: 30, description: '1 check-in diário Wellhub' },
  { id: 'wellhub-gold-plus', name: 'Wellhub Gold+', price: 319.99, type: 'WellHub', classesPerWeek: 7, monthlyLimit: 30, description: '1 check-in diário Wellhub' },
  { id: 'wellhub-platinum', name: 'Wellhub Platinum', price: 439.99, type: 'WellHub', classesPerWeek: 7, monthlyLimit: 30, description: '1 check-in diário Wellhub' },
  { id: 'wellhub-diamond', name: 'Wellhub Diamond', price: 699.99, type: 'WellHub', classesPerWeek: 7, monthlyLimit: 30, description: '1 check-in diário Wellhub' },
  { id: 'wellhub-diamond-plus', name: 'Wellhub Diamond+', price: 779.99, type: 'WellHub', classesPerWeek: 7, monthlyLimit: 30, description: '1 check-in diário Wellhub' },

  // GuruPass
  { id: 'gurupass-standard', name: 'GuruPass Diário', price: 0, type: 'GuruPass', classesPerWeek: 7, monthlyLimit: 30, description: 'Validação via Voucher/Token GuruPass (1x dia)' },
  { id: 'gurupass-pass', name: 'GuruPass Pass', price: 0, type: 'GuruPass', classesPerWeek: 7, monthlyLimit: 30, description: 'Passe Livre GuruPass' },

  // TotalPass
  { id: 'totalpass-active', name: 'TotalPass Active', price: 0, type: 'TotalPass', classesPerWeek: 7, monthlyLimit: 30, description: 'Check-in Diário TotalPass (1x dia)' },
  { id: 'totalpass-tp1', name: 'TotalPass TP1/TP2', price: 0, type: 'TotalPass', classesPerWeek: 7, monthlyLimit: 30, description: 'Categorias TP1 e TP2 TotalPass' },
];

export interface StudentUsageStats {
  monthlyClasses: number;
  weeklyClasses: number;
  todayClasses: number;
  monthlyLimit: number;
  weeklyLimit: number;
  classesRemaining: number;
  percentageUsed: number;
  isExceeded: boolean;
  isNearLimit: boolean;
  isSingleClass: boolean;
  isPartner: boolean;
  partnerDailyLimitReached: boolean;
  badgeLabel: string;
  statusColor: 'emerald' | 'amber' | 'red' | 'blue';
}

export function getPlanConfig(contractedPlan?: string, planType?: string): PlanConfigItem {
  const normName = (contractedPlan || '').trim().toLowerCase();
  const matched = BASE_PLANS_CONFIG.find(p => p.name.toLowerCase() === normName || p.id.toLowerCase() === normName);
  if (matched) return matched;

  // Fallback inferences
  const isPartner = ['WellHub', 'GuruPass', 'TotalPass'].includes(planType || '');
  if (isPartner) {
    return {
      id: (planType || 'partner').toLowerCase(),
      name: contractedPlan || planType || 'Parceiro',
      price: 0,
      type: (planType as any) || 'WellHub',
      classesPerWeek: 7,
      monthlyLimit: 30,
      description: 'Check-in diário de parceiro'
    };
  }

  // Check keywords in name
  if (normName.includes('2') || normName.includes('duas') || normName.includes('two')) {
    return {
      id: 'custom-2',
      name: contractedPlan || '2 aulas/sem',
      price: 460,
      type: 'Studio',
      classesPerWeek: 2,
      monthlyLimit: 8,
      description: 'Plano 2 aulas/semana'
    };
  }

  if (normName.includes('today') || normName.includes('avulsa') || normName.includes('avulso')) {
    return {
      id: 'today-dance',
      name: contractedPlan || 'Today Dance',
      price: 90,
      type: 'Studio',
      classesPerWeek: 1,
      monthlyLimit: 1,
      isSingleClass: true,
      description: '1 aula avulsa'
    };
  }

  // Standard Studio 1 class/week default
  return {
    id: 'standard-studio',
    name: contractedPlan || 'Mensal Studio',
    price: 320,
    type: 'Studio',
    classesPerWeek: 1,
    monthlyLimit: 4,
    description: '1 aula/semana (4 aulas/mês)'
  };
}

export function calculateStudentClassUsage(
  student: {
    attendance?: { date: string; present: boolean }[];
    planType?: string;
    contractedPlan?: string;
    customClassLimit?: number;
    customWeeklyLimit?: number;
  }
): StudentUsageStats {
  const plan = getPlanConfig(student.contractedPlan, student.planType);
  const isPartner = ['WellHub', 'GuruPass', 'TotalPass'].includes(student.planType || plan.type);
  const isSingleClass = Boolean(plan.isSingleClass);

  const now = new Date();
  const currentYearMonth = format(now, 'yyyy-MM');
  const todayStr = format(now, 'yyyy-MM-dd');
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const presentRecords = (student.attendance || []).filter(a => a.present);

  // Classes this month
  const monthlyClasses = presentRecords.filter(a => {
    if (!a.date) return false;
    return a.date.startsWith(currentYearMonth);
  }).length;

  // Classes this week
  const weeklyClasses = presentRecords.filter(a => {
    if (!a.date) return false;
    try {
      const recordDate = parseISO(a.date.length === 10 ? `${a.date}T12:00:00` : a.date);
      return isWithinInterval(recordDate, { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  }).length;

  // Classes today
  const todayClasses = presentRecords.filter(a => a.date === todayStr).length;

  // Limits
  const monthlyLimit = Number(student.customClassLimit) > 0 
    ? Number(student.customClassLimit) 
    : (plan.monthlyLimit || 4);

  const weeklyLimit = Number(student.customWeeklyLimit) > 0 
    ? Number(student.customWeeklyLimit) 
    : (plan.classesPerWeek || 1);

  const classesRemaining = Math.max(0, monthlyLimit - monthlyClasses);
  const percentageUsed = monthlyLimit > 0 ? Math.min(100, Math.round((monthlyClasses / monthlyLimit) * 100)) : 0;
  const isExceeded = monthlyClasses >= monthlyLimit;
  const isNearLimit = !isExceeded && monthlyClasses / monthlyLimit >= 0.75;
  const partnerDailyLimitReached = isPartner && todayClasses >= 1;

  let statusColor: 'emerald' | 'amber' | 'red' | 'blue' = 'emerald';
  if (isExceeded) {
    statusColor = 'red';
  } else if (isNearLimit || partnerDailyLimitReached) {
    statusColor = 'amber';
  } else if (isPartner) {
    statusColor = 'blue';
  }

  let badgeLabel = `${monthlyClasses}/${monthlyLimit} aulas`;
  if (isSingleClass) {
    badgeLabel = monthlyClasses >= 1 ? '1/1 aula (usada)' : '0/1 aula avulsa';
  } else if (isPartner) {
    badgeLabel = todayClasses > 0 ? `Hoje: 1/1 (Mês: ${monthlyClasses})` : `Disponível (${monthlyClasses} no mês)`;
  }

  return {
    monthlyClasses,
    weeklyClasses,
    todayClasses,
    monthlyLimit,
    weeklyLimit,
    classesRemaining,
    percentageUsed,
    isExceeded,
    isNearLimit,
    isSingleClass,
    isPartner,
    partnerDailyLimitReached,
    badgeLabel,
    statusColor
  };
}
