import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Generic response regardless of outcome (no account enumeration)
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed top-[-30%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-primary/8 blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <Link
          to="/logga-in"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </Link>

        <h1 className="text-2xl font-display font-bold mb-1">Glömt lösenord?</h1>

        {sent ? (
          <>
            <p className="text-sm text-muted-foreground mt-4 mb-6">
              Om ett konto finns med den här e-postadressen har vi skickat en återställningslänk.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              <Link to="/logga-in" className="text-primary hover:underline">
                Till inloggning
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@epost.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-card"
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-eurovision border-0 font-display font-semibold text-primary-foreground"
                disabled={loading}
              >
                {loading ? 'Skickar...' : 'Skicka återställningslänk'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
