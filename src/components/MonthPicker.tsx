
import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/contexts/finance";

const MonthPicker = () => {
  const { state, setCurrentMonth, setCurrentYear } = useFinance();
  const [date, setDate] = useState(new Date(state.currentYear, state.currentMonth));

  const handlePrevMonth = () => {
    const newDate = subMonths(date, 1);
    setDate(newDate);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  const handleNextMonth = () => {
    const newDate = addMonths(date, 1);
    setDate(newDate);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  return (
    <div className="w-full my-3">
      <div className="flex items-center justify-between py-3 px-4 rounded-lg shadow-sm w-full bg-card border border-gray-700/50 dark:bg-[#1c1c1e] dark:border-gray-700/50 dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-lg font-medium dark:text-white">
          {format(date, "MMMM yyyy", { locale: fr })}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MonthPicker;
