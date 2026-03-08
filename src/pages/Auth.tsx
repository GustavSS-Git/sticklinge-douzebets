import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function Auth({ mode }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const isRegister = mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      if (nickname.trim().length < 1) {
        toast.error('Ange ett smeknamn');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        toast.error('Lösenord måste vara minst 6 tecken');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, nickname.trim());
      if (error) {
        toast.error(error);
      } else {
        toast.success('Konto skapat! Du är nu inloggad.');
        navigate('/tippa');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error('Fel e-post eller lösenord');
      } else {
        toast.success('Välkommen tillbaka!');
        navigate('/tippa');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed top-[-30%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-primary/8 blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </Link>

        <h1 className="text-2xl font-display font-bold mb-1">
          {isRegister ? 'Skapa konto' : 'Logga in'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {isRegister
            ? 'Skapa ett konto för att börja tippa'
            : 'Logga in för att se dina tips'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
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

          {isRegister && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Användarnamn</Label>
                <Input
                  id="username"
                  placeholder="ditt_namn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Smeknamn (visas publikt)</Label>
                <Input
                  id="nickname"
                  placeholder="Eurovision-experten"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  className="bg-card"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minst 6 tecken"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-card"
            />
          </div>

          <Button
            type="submit"
            className="w-full gradient-eurovision border-0 font-display font-semibold text-primary-foreground"
            disabled={loading}
          >
            {loading ? 'Laddar...' : isRegister ? 'Skapa konto' : 'Logga in'}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isRegister ? (
            <>
              Har du redan konto?{' '}
              <Link to="/logga-in" className="text-primary hover:underline">
                Logga in
              </Link>
            </>
          ) : (
            <>
              Inget konto?{' '}
              <Link to="/registrera" className="text-primary hover:underline">
                Skapa konto
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
