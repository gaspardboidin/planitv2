
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { ProfileCard, ProfileForm } from "@/components/profile";
import { useProfileData } from "@/hooks/profile/useProfileData";

const Profile = () => {
  const { user } = useAuth();
  const {
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
  } = useProfileData(user);

  if (loadingProfile) {
    return (
      <div className="text-center py-8 text-gray-500 flex flex-col justify-center items-center">
        <LoadingSpinner size="lg" className="mb-2" />
        <p>Chargement de la page...</p>
        <p>Actualiser la page si c'est trop long... nous travaillons sur le probleme</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <h1 className="text-3xl font-bold mb-6">Profil</h1>
      
      <Card className="shadow-sm">
        <ProfileCard 
          fullName={fullName} 
          email={user?.email} 
          avatarUrl={avatarUrl}
          onAvatarUpload={uploadAvatar}
        />
        
        <ProfileForm
          user={user}
          fullName={fullName}
          setFullName={setFullName}
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
          saveProfile={saveProfile}
        />
      </Card>
    </div>
  );
};

export default Profile;
