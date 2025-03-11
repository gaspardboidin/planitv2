
import React, { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserCircle, Upload } from "lucide-react";
import { useSettings } from "@/contexts/settings";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProfileCardProps {
  fullName: string;
  email: string | undefined;
  avatarUrl: string | null;
  onAvatarUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
}

const ProfileCard = ({ fullName, email, avatarUrl, onAvatarUpload }: ProfileCardProps) => {
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérification du type de fichier
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner une image au format JPG ou PNG.",
        variant: "destructive"
      });
      return;
    }

    // Vérification de la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille de l'image ne doit pas dépasser 2 MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      const result = await onAvatarUpload(file);
      if (result.success) {
        toast({
          title: "Succès",
          description: "Votre photo de profil a été mise à jour.",
        });
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Une erreur est survenue lors de l'upload.",
          variant: "destructive"
        });
      }
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 cursor-pointer" onClick={handleAvatarClick}>
              {uploading ? (
                <AvatarFallback>
                  <LoadingSpinner size="sm" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={avatarUrl || ""} alt="Photo de profil" />
                  <AvatarFallback className={`${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <UserCircle className={`h-8 w-8 ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} />
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            <Button 
              size="icon" 
              className="absolute bottom-0 right-0 h-6 w-6 rounded-full shadow-sm" 
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              <Upload className="h-3 w-3" />
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png" 
              onChange={handleFileChange} 
            />
          </div>
          <div>
            <CardTitle className="text-xl">{fullName || "Utilisateur"}</CardTitle>
            <CardDescription>{email}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default ProfileCard;
