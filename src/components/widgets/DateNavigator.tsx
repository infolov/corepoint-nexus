import { useState, useMemo } from "react";
import { format, subDays, isSameDay, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates?: string[];
  className?: string;
}

export function DateNavigator({
  selectedDate,
  onDateChange,
  availableDates = [],
  className,
}: DateNavigatorProps) {
  const today = new Date();
  
  // Generate last 7 days
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, i);
      return format(date, "yyyy-MM-dd");
    });
  }, []);

  const selectedDateObj = parseISO(selectedDate);
  const currentIndex = last7Days.findIndex(d => d === selectedDate);

  const goToPrevious = () => {
    if (currentIndex < last7Days.length - 1) {
      onDateChange(last7Days[currentIndex + 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex > 0) {
      onDateChange(last7Days[currentIndex - 1]);
    }
  };

  const formatDayLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isSameDay(date, today)) return "Dzisiaj";
    if (isSameDay(date, subDays(today, 1))) return "Wczoraj";
    return format(date, "EEEE", { locale: pl });
  };

  const formatDateShort = (dateStr: string) => {
    return format(parseISO(dateStr), "d MMM", { locale: pl });
  };

  const hasDataForDate = (dateStr: string) => {
    if (availableDates.length === 0) return true; // If no data, assume all are available
    return availableDates.includes(dateStr);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Horizontal date scroller */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={currentIndex >= last7Days.length - 1}
          className="h-8 w-8 flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1 justify-center">
          {last7Days.map((dateStr) => {
            const isSelected = dateStr === selectedDate;
            const hasData = hasDataForDate(dateStr);
            
            return (
              <button
                key={dateStr}
                onClick={() => onDateChange(dateStr)}
                className={cn(
                  "flex flex-col items-center px-3 py-2 rounded-lg transition-all min-w-[70px]",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : hasData
                    ? "bg-muted/50 hover:bg-muted text-foreground"
                    : "bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
                )}
                disabled={!hasData}
              >
                <span className="text-[10px] uppercase font-medium">
                  {formatDayLabel(dateStr)}
                </span>
                <span className="text-sm font-semibold">
                  {formatDateShort(dateStr)}
                </span>
                {!hasData && (
                  <span className="text-[9px] opacity-60">brak</span>
                )}
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={currentIndex <= 0}
          className="h-8 w-8 flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Current date indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          {format(selectedDateObj, "EEEE, d MMMM yyyy", { locale: pl })}
        </span>
      </div>
    </div>
  );
}
