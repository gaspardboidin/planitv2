
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

interface DeleteButtonProps {
  onDelete: () => void;
}

const DeleteButton = ({ onDelete }: DeleteButtonProps) => {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
      onClick={onDelete}
    >
      <Trash className="h-4 w-4" />
    </Button>
  );
};

export default DeleteButton;
