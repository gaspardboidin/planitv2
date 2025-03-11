
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// List of countries (future support for localization)
const countries = [
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "CH", name: "Suisse" },
  { code: "CA", name: "Canada" },
  { code: "MC", name: "Monaco" },
  { code: "LU", name: "Luxembourg" }
];

interface PersonalInfoFormProps {
  fullName: string;
  setFullName: (value: string) => void;
  email: string | undefined;
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
}

const PersonalInfoForm = ({
  fullName,
  setFullName,
  email,
  birthDate,
  setBirthDate,
  phoneNumber,
  setPhoneNumber,
  profession,
  setProfession,
  preferredCurrency,
  setPreferredCurrency,
  country,
  setCountry
}: PersonalInfoFormProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Informations personnelles</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input 
            id="fullName" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            placeholder="Entrez votre nom complet"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            value={email || ""} 
            disabled 
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">Votre adresse email ne peut pas être modifiée</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Date de naissance</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {birthDate ? (
                  format(birthDate, "dd MMMM yyyy", { locale: fr })
                ) : (
                  <span className="text-muted-foreground">Choisir une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={birthDate}
                onSelect={setBirthDate}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={1930}
                toYear={2023}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
          <Input 
            id="phoneNumber" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            placeholder="Entrez votre numéro de téléphone"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profession">Profession</Label>
          <Input 
            id="profession" 
            value={profession} 
            onChange={(e) => setProfession(e.target.value)} 
            placeholder="Entrez votre profession"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredCurrency">Devise préférée</Label>
          <Select 
            value={preferredCurrency} 
            onValueChange={setPreferredCurrency}
            disabled
          >
            <SelectTrigger id="preferredCurrency">
              <SelectValue placeholder="Sélectionnez une devise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="€">Euro (€)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Actuellement, seul l'euro est disponible</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Pays</Label>
          <Select 
            value={country} 
            onValueChange={setCountry}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Sélectionnez votre pays" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
