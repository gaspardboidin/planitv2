
import React, { useState } from "react";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PersonalInfoForm from "./PersonalInfoForm";
import PasswordChangeForm from "./PasswordChangeForm";
import { User } from "@supabase/supabase-js";

interface ProfileFormProps {
  user: User | null;
  fullName: string;
  setFullName: (value: string) => void;
  birthDate: Date | undefined;
  setBirthDate: (date: Date | undefined) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  profession: string;
  setProfession: (value: string) => void;
  preferredCurrency: string;
  setPreferredCurrency: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  saveProfile: () => Promise<{ success: boolean; error?: string }>;
}

const ProfileForm = ({
  user,
  fullName,
  setFullName,
  birthDate,
  setBirthDate,
  phoneNumber,
  setPhoneNumber,
  profession,
  setProfession,
  preferredCurrency,
  setPreferredCurrency,
  country,
  setCountry,
  saveProfile
}: ProfileFormProps) => {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    
    try {
      const result = await saveProfile();
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Votre profil a été mis à jour avec succès.",
        });
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Une erreur est survenue lors de la mise à jour.",
          variant: "destructive"
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PersonalInfoForm 
            fullName={fullName}
            setFullName={setFullName}
            email={user?.email}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            profession={profession}
            setProfession={setProfession}
            preferredCurrency={preferredCurrency}
            setPreferredCurrency={setPreferredCurrency}
            country={country}
            setCountry={setCountry}
          />

          <Separator />

          <PasswordChangeForm />
          
          <Button type="submit" disabled={saving} className="w-full md:w-auto">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </>
  );
};

export default ProfileForm;
