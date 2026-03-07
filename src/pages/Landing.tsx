import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Heart, BarChart3, Sparkles } from 'lucide-react';

export default function Landing() {
  const features = [
    { icon: Trophy, title: 'Tippa Topp 5', desc: 'Förutspå vilka länder som hamnar i toppen – och vem som kommer sist.' },
    { icon: Heart, title: 'Rösta på favoriter', desc: 'Välj dina 3 personliga favoriter och se vem som borde ha vunnit.' },
    { icon: BarChart3, title: 'Se resultattavlan', desc: 'Jämför dina tips med familj och vänner i realtid.' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-50%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-accent/8 blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />

        <div className="relative container px-4 pt-16 pb-12 md:pt-24 md:pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            Eurovision 2026
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 leading-tight">
            Sticklinge<br />
            <span className="text-gradient">DouzeBets</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto mb-3">
            Tippa Eurovision 2026 med familj och vänner
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
            Lägg din topp 5, tippa vilket land som kommer sist, rösta på dina personliga favoriter och se vem som kan Eurovision bäst.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gradient-eurovision border-0 font-display font-semibold text-primary-foreground shadow-glow">
              <Link to="/registrera">Skapa konto</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-display font-semibold border-border">
              <Link to="/logga-in">Logga in</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg sm:max-w-2xl mx-auto">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl gradient-eurovision flex items-center justify-center mb-3 group-hover:shadow-glow transition-shadow">
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="container px-4 py-6 text-center text-xs text-muted-foreground border-t border-border">
        Sticklinge DouzeBets — Ingen riktig betting, bara ren Eurovision-kärlek ✨
      </footer>
    </div>
  );
}
