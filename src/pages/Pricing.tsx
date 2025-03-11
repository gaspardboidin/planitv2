
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  
  const plans = [
    {
      name: "Gratuit",
      price: { monthly: 0, annual: 0 },
      description: "Pour les particuliers qui commencent à gérer leur budget",
      features: [
        "Suivi de budget mensuel",
        "3 objectifs d'épargne",
        "Tableaux de bord basiques",
        "Applications mobile et web"
      ],
      cta: "Commencer gratuitement",
      popular: false
    },
    {
      name: "Premium",
      price: { monthly: 9.99, annual: 99.99 },
      description: "Pour ceux qui veulent optimiser leurs finances personnelles",
      features: [
        "Budgets illimités",
        "Objectifs d'épargne illimités",
        "Tableaux de bord avancés",
        "Catégorisation automatique",
        "Synchronisation bancaire",
        "Support prioritaire"
      ],
      cta: "Essai gratuit de 14 jours",
      popular: true
    },
    {
      name: "Famille",
      price: { monthly: 19.99, annual: 199.99 },
      description: "Idéal pour gérer les finances de toute la famille",
      features: [
        "Tout ce qui est inclus dans Premium",
        "Jusqu'à 5 utilisateurs",
        "Comptes et budgets partagés",
        "Contrôles parentaux",
        "Rapports familiaux",
        "Support dédié"
      ],
      cta: "Essai gratuit de 14 jours",
      popular: false
    }
  ];

  return (
    <div className="py-16 container mx-auto px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Plans et tarifs simples</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Choisissez le plan qui correspond à vos besoins. Tous les plans incluent l'accès à notre application web et mobile.
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button 
            variant={isAnnual ? "outline" : "default"} 
            onClick={() => setIsAnnual(false)}
          >
            Mensuel
          </Button>
          <Button 
            variant={isAnnual ? "default" : "outline"} 
            onClick={() => setIsAnnual(true)}
          >
            Annuel
            <Badge variant="secondary" className="ml-2">-17%</Badge>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
            {plan.popular && (
              <Badge className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 bg-primary text-white">
                Populaire
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {plan.price[isAnnual ? 'annual' : 'monthly'] === 0 
                    ? 'Gratuit' 
                    : `${plan.price[isAnnual ? 'annual' : 'monthly']}€`}
                </span>
                {plan.price[isAnnual ? 'annual' : 'monthly'] > 0 && (
                  <span className="text-gray-500 ml-2">
                    /{isAnnual ? 'an' : 'mois'}
                  </span>
                )}
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link to="/auth">{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Des questions ?</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Notre équipe est disponible pour vous aider à choisir le bon plan.
        </p>
        <Button variant="outline" size="lg">Contacter le support</Button>
      </div>
    </div>
  );
};

export default Pricing;
