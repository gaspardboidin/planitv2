
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface CurrentMonthToggleProps {
  active: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

const CurrentMonthToggle = ({ active, onToggle }: CurrentMonthToggleProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={`h-8 w-8 month-toggle-button ${
              active 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
            aria-label={active ? "Mettre à jour ce mois uniquement" : "Mettre à jour tous les mois"}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{active ? 'Mettre à jour ce mois uniquement' : 'Mettre à jour tous les mois'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CurrentMonthToggle;
