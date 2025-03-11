
import { useSettings } from "@/contexts/settings";

const AppOptions = () => {
  const { settings } = useSettings();

  return (
    <div className="flex items-center space-x-2">
      {/* Share button removed as requested */}
    </div>
  );
};

export default AppOptions;
