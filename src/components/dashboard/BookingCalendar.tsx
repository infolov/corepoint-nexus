import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  isBefore,
  isAfter,
  isSameDay,
  startOfDay
} from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BookedDate {
  date: string;
  status: "booked" | "blocked" | "available";
}

interface BookingCalendarProps {
  bookedDates?: BookedDate[];
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  onDateSelect: (startDate: Date | null, endDate: Date | null) => void;
  minDate?: Date;
}

export function BookingCalendar({
  bookedDates = [],
  selectedStartDate,
  selectedEndDate,
  onDateSelect,
  minDate = new Date()
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
  
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const getDayStatus = (day: Date): "available" | "booked" | "blocked" | "past" => {
    const today = startOfDay(new Date());
    if (isBefore(day, today)) return "past";
    
    const dateStr = format(day, "yyyy-MM-dd");
    const bookedDate = bookedDates.find(d => d.date === dateStr);
    if (bookedDate) return bookedDate.status;
    
    return "available";
  };

  const isDateInRange = (day: Date): boolean => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return (isAfter(day, selectedStartDate) || isSameDay(day, selectedStartDate)) && 
           (isBefore(day, selectedEndDate) || isSameDay(day, selectedEndDate));
  };

  const handleDayClick = (day: Date) => {
    const status = getDayStatus(day);
    if (status === "booked" || status === "blocked" || status === "past") return;

    if (!selectingEnd || !selectedStartDate) {
      onDateSelect(day, null);
      setSelectingEnd(true);
    } else {
      if (isBefore(day, selectedStartDate)) {
        onDateSelect(day, selectedStartDate);
      } else {
        onDateSelect(selectedStartDate, day);
      }
      setSelectingEnd(false);
    }
  };

  const getDayClasses = (day: Date) => {
    const status = getDayStatus(day);
    const isStart = selectedStartDate && isSameDay(day, selectedStartDate);
    const isEnd = selectedEndDate && isSameDay(day, selectedEndDate);
    const inRange = isDateInRange(day);

    return cn(
      "relative min-h-[44px] p-1 rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center",
      status === "available" && "hover:bg-green-500/20 border-2 border-green-500/30 bg-green-500/10",
      status === "booked" && "bg-red-500/20 border-2 border-red-500/30 cursor-not-allowed",
      status === "blocked" && "bg-gray-500/20 border-2 border-gray-500/30 cursor-not-allowed",
      status === "past" && "bg-muted/30 text-muted-foreground/50 cursor-not-allowed",
      (isStart || isEnd) && "bg-primary text-primary-foreground border-primary",
      inRange && !isStart && !isEnd && "bg-primary/30 border-primary/50",
      isToday(day) && status === "available" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    );
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {format(currentDate, "LLLL yyyy", { locale: pl })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding for first week */}
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[44px]" />
        ))}

        {days.map((day) => {
          const status = getDayStatus(day);
          return (
            <div
              key={day.toISOString()}
              className={getDayClasses(day)}
              onClick={() => handleDayClick(day)}
            >
              <span className={cn(
                "text-sm font-medium",
                isToday(day) && "font-bold"
              )}>
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-green-500/30 bg-green-500/10" />
          <span className="text-sm text-muted-foreground">Dostępne</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-red-500/30 bg-red-500/20" />
          <span className="text-sm text-muted-foreground">Zajęte</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-gray-500/30 bg-gray-500/20" />
          <span className="text-sm text-muted-foreground">Niedostępne</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span className="text-sm text-muted-foreground">Wybrane</span>
        </div>
      </div>

      {/* Selection info */}
      {selectingEnd && selectedStartDate && !selectedEndDate && (
        <p className="text-sm text-muted-foreground text-center">
          Wybierz datę końcową kampanii
        </p>
      )}
    </div>
  );
}
