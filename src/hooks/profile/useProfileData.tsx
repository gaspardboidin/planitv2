
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { parseISO, format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export const useProfileData = (user: User | null) => {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profession, setProfession] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("€");
  const [country, setCountry] = useState("FR");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      try {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFullName(data.full_name || "");
          
          // Correction pour le problème de date: utiliser parseISO pour analyser la date ISO
          // et éviter les problèmes de fuseau horaire
          if (data.birth_date) {
            // Utiliser parseISO pour convertir la chaîne de date en objet Date
            const parsedDate = parseISO(data.birth_date);
            setBirthDate(parsedDate);
          } else {
            setBirthDate(undefined);
          }
          
          setPhoneNumber(data.phone_number || "");
          setProfession(data.profession || "");
          setPreferredCurrency(data.preferred_currency || "€");
          setCountry(data.country || "FR");
          
          // Charger l'URL de l'avatar si disponible
          if (data.avatar_url) {
            fetchAvatarUrl(data.avatar_url);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos informations de profil.",
          variant: "destructive"
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Fonction pour obtenir l'URL publique de l'avatar
  const fetchAvatarUrl = (avatarPath: string) => {
    try {
      const { data: { publicUrl } } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(avatarPath);
      
      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'URL de l'avatar:", error);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user || !file) return { success: false, error: "Aucun fichier ou utilisateur" };

    try {
      // Créer un nom de fichier unique avec l'ID de l'utilisateur
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
      
      // Upload du fichier au bucket de stockage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Mettre à jour l'URL de l'avatar dans le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: fileName })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Obtenir l'URL publique du fichier uploadé
      fetchAvatarUrl(fileName);
      
      return { success: true };
    } catch (error: any) {
      console.error("Erreur lors de l'upload de l'avatar:", error);
      return { 
        success: false, 
        error: error.message || "Une erreur est survenue lors de l'upload de votre avatar." 
      };
    }
  };

  const saveProfile = async () => {
    if (!user) return { success: false, error: "Utilisateur non connecté" };
    
    try {
      // Mettre à jour les métadonnées utilisateur dans Supabase Auth
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      
      if (updateAuthError) throw updateAuthError;
      
      // Formater la date correctement pour l'enregistrement dans PostgreSQL
      let formattedBirthDate = null;
      if (birthDate) {
        // Utiliser directement le format YYYY-MM-DD sans manipulation du timezone
        formattedBirthDate = format(birthDate, 'yyyy-MM-dd');
      }
      
      // Mettre à jour le profil dans la table profiles
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          birth_date: formattedBirthDate,
          phone_number: phoneNumber,
          profession: profession,
          preferred_currency: "€", // Toujours "€" peu importe ce qui est sélectionné
          country: country,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateProfileError) throw updateProfileError;
      
      return { success: true };
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      return { 
        success: false, 
        error: error.message || "Une erreur est survenue lors de la mise à jour de votre profil." 
      };
    }
  };

  return {
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
    avatarUrl,
    loadingProfile,
    saveProfile,
    uploadAvatar
  };
};
