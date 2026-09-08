import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [checking, setChecking] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    const finish = (ok: boolean) => {
      if (!active) return;
      setValidLink(ok);
      setChecking(false);
      // Remove token material from the URL
      if (window.location.hash || window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    const run = async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const query = new URLSearchParams(window.location.search);

      const code = query.get('code');
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');

      if (hash.get('error') || query.get('error')) {
        finish(false);
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        finish(!error);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        finish(!error);
        return;
      }

      const { data } = await supabase.auth.getSession();
      finish(!!data.session);
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Lösenordet måste vara minst 8 tecken');
      return;
    }
    if (password !== confirm) {
      toast.error('Lösenorden matchar inte');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error('Kunde inte uppdatera lösenordet. Länken kan ha gått ut.');
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed top-[-30%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-primary/8 blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <h1 className="text-2xl font-display font-bold mb-4">Återställ lösenord</h1>

        {checking ? (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : done ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Ditt lösenord har uppdaterats. Du kan nu logga in med ditt nya lösenord.
            </p>
            <p className="text-sm text-center">
              <Link to="/logga-in" className="text-primary hover:underline">
                Till inloggning
              </Link>
            </p>
          </>
        ) : !validLink ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Länken är ogiltig, har redan använts eller har gått ut. Begär en ny återställningslänk.
            </p>
            <p className="text-sm text-center">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Begär ny länk
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nytt lösenord</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minst 8 tecken"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-card"
              />
              <p className="text-xs text-muted-foreground">
                Lösenordet måste vara minst 8 tecken. Får inte lämnas tomt.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Bekräfta nytt lösenord</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="bg-card"
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-eurovision border-0 font-display font-semibold text-primary-foreground"
              disabled={loading}
            >
              {loading ? 'Uppdaterar...' : 'Uppdatera lösenord'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
