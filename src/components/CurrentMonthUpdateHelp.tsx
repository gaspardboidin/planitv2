
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CurrentMonthUpdateHelp = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-blue-50 hover:bg-blue-100 text-blue-600 ml-2 cursor-help">
            <HelpCircle className="h-3.5 w-3.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Mise à jour du mois courant</h4>
            <p className="text-xs text-gray-500">
              Par défaut, les modifications ne s'appliquent qu'au mois en cours (bouton <span className="inline-flex items-center bg-blue-100 text-blue-600 px-1 py-0.5 rounded text-xs"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span> en bleu).
            </p>
            <p className="text-xs text-gray-500">
              Pour appliquer les modifications à tous les mois suivants, désactivez le bouton calendrier (passera en gris).
            </p>
            <p className="text-xs text-gray-500 font-medium">
              La préférence (mois courant ou tous les mois) est maintenant conservée entre les modifications jusqu'à ce que vous la changiez.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CurrentMonthUpdateHelp;
