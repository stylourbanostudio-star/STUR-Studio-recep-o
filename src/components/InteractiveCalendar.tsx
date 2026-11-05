import React, { useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ClassEvent } from '../App';

interface InteractiveCalendarProps {
  events: ClassEvent[];
  onDateSelect?: (date: Date) => void;
  selectedDate: Date;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  setSelectedDate: (date: Date) => void;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  events,
  onDateSelect,
  selectedDate,
  currentMonth,
  setCurrentMonth,
  setSelectedDate
}) => {
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="space-y-8">
      {/* Calendar Header / Navigation */}
      <div className="bg-surface-container-low p-6 rounded-[32px] border border-outline shadow-xl flex items-center justify-between gap-6 kinetic-glow">
        <div className="flex items-center gap-6">
          <button 
            onClick={prevMonth}
            className="p-3 hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant hover:text-primary active:scale-90 border border-outline/30 shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center min-w-[200px]">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1 block">Agenda Estúdio</span>
            <h3 className="text-2xl font-headline font-black uppercase tracking-tighter capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
          </div>
          <button 
            onClick={nextMonth}
            className="p-3 hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant hover:text-primary active:scale-90 border border-outline/30 shadow-sm"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest leading-none">Status</span>
            <span className="text-sm font-headline font-black text-primary">Sincronizado</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <CalendarIcon size={20} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-surface-container p-4 sm:p-8 rounded-[40px] border border-outline shadow-2xl space-y-6">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map(day => (
            <div key={day} className="text-center py-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">
              {day}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
            const isTodayDay = isToday(day);

            return (
              <motion.div
                layout
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDate(day);
                  onDateSelect?.(day);
                }}
                className={cn(
                  "aspect-square p-2 rounded-2xl border transition-all cursor-pointer relative group flex flex-col items-center justify-center overflow-hidden",
                  !isCurrentMonth ? "bg-surface-container-low/50 opacity-20" : "hover:scale-[1.08] active:scale-95 shadow-sm hover:shadow-xl",
                  isSelected 
                    ? "bg-primary border-primary text-white shadow-2xl shadow-primary/40 z-10" 
                    : "bg-surface-container-low border-outline/50 hover:border-primary/50 hover:bg-surface-container-high",
                  isTodayDay && !isSelected && "ring-2 ring-primary shadow-lg shadow-primary/20"
                )}
              >
                <span className={cn(
                  "text-xl sm:text-2xl font-headline font-black tracking-tighter",
                  isSelected ? "text-white" : isTodayDay ? "text-primary" : "text-on-surface-variant"
                )}>
                  {format(day, 'd')}
                </span>

                <div className="flex flex-wrap justify-center gap-1.5 mt-2 max-w-[80%]">
                  {dayEvents.slice(0, 4).map((event) => (
                    <div 
                      key={event.id}
                      className={cn(
                        "w-2 h-2 rounded-full shadow-sm",
                        isSelected ? "bg-white/50" : 
                        event.type === 'Aula' ? "bg-primary" :
                        event.type === 'Evento' ? "bg-emerald-500" : 
                        event.type === 'Feriado' ? "bg-red-500" : "bg-amber-500"
                      )}
                    />
                  ))}
                  {dayEvents.length > 4 && (
                    <div className={cn(
                      "text-[9px] font-black leading-none flex items-center",
                      isSelected ? "text-white/60" : "text-on-surface-variant/60"
                    )}>
                      +
                    </div>
                  )}
                </div>

                {isTodayDay && !isSelected && (
                  <div className="absolute top-2 right-2 flex flex-col items-center">
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter leading-none mb-0.5">Hoje</span>
                    <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
                  </div>
                )}

                {/* Subtle Backdrop Number for isSelected */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <span className="text-6xl font-black">{format(day, 'd')}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Selected Day Quick Summary */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pt-6 border-t border-outline/30"
          >
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Dia Selecionado</p>
                  <h4 className="text-xl font-headline font-black uppercase tracking-tight">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </h4>
               </div>
               <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest">Registros</p>
                    <p className="text-xl font-headline font-black text-primary">
                      {events.filter(e => isSameDay(new Date(e.date), selectedDate)).length}
                    </p>
                  </div>
               </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
