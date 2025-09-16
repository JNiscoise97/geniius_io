import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Lock,
  Rocket,
  PenTool,
  Eye,
  Coins,
  Star,
  TrendingUp,
  ShieldCheck
} from "lucide-react";

export default function CycleDeContribution() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">🔁 Le cycle de contribution</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Contribuez à la mémoire collective en accédant à des contenus inédits tout en enrichissant la base de données.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Eye className="text-primary" />
            <CardTitle>Consulter = Utiliser des points</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Certains contenus rares ou inédits nécessitent plus de points pour être consultés.</p>
            <ul className="space-y-1">
              <li>Fiche acteur : 1 pt</li>
              <li>Acte d’état civil : 1 pt</li>
              <li>Acte de mariage : 2 pts</li>
              <li>Acte notarié : 15 pts</li>
              <li>Vue par lieu : 20 pts</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <PenTool className="text-primary" />
            <CardTitle>Contribuer = Gagner des points</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Chaque transcription ou validation vous permet d'accumuler des points.</p>
            <ul className="space-y-1">
              <li>Transcription acte naissance/décès : +10 pts</li>
              <li>Transcription acte mariage : +25 pts</li>
              <li>Validation acte état civil : +15 pts</li>
              <li>Transcription notarié partielle : jusqu’à +50 pts</li>
              <li>Validation notarié complète : +50 pts</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <CheckCircle className="text-primary" />
            <CardTitle>500 points = Accès illimité 24h</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Une fois 500 points cumulés, profitez de 24h d'accès total à toutes les fiches. Ensuite, votre compteur est remis à zéro pour relancer la dynamique.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Coins className="text-primary" />
            <CardTitle>Accès accéléré</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Vous êtes pressé ? Vous pouvez acheter des points pour soutenir le projet et débloquer immédiatement certains contenus.</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            <CardTitle>Pourquoi ce système ?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>Valoriser les contenus rares et inédits issus d’archives notariées ou de synthèses géographiques.</li>
              <li>Encourager les contributions utiles à toute la communauté.</li>
              <li>Permettre un accès équilibré entre découverte, engagement et effort.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <p className="text-center text-lg font-semibold text-primary mt-4">
        Chaque fiche consultée vous donne envie d’en savoir plus.<br />
        Chaque contribution vous permet d’avancer.<br />
        <span className="underline">Ce cycle fait de vous un acteur actif de la mémoire collective.</span>
      </p>
    </div>
  );
}
