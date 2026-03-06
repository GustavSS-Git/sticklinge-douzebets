import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, User } from 'lucide-react';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile || nickname.trim().length < 1) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nickname: nickname.trim() })
      .eq('id', profile.id);
    if (error) {
      toast.error('Kunde inte uppdatera');
    } else {
      toast.success('Profil uppdaterad!');
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Min profil
        </h1>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-full gradient-eurovision flex items-center justify-center text-xl font-display font-bold text-primary-foreground">
              {profile?.nickname?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-display font-semibold">{profile?.nickname}</p>
              <p className="text-xs text-muted-foreground">@{profile?.username}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Smeknamn</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label>Användarnamn</Label>
            <Input value={profile?.username ?? ''} disabled className="bg-muted" />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || nickname.trim() === profile?.nickname}
            className="w-full gradient-eurovision border-0 font-display font-semibold text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
