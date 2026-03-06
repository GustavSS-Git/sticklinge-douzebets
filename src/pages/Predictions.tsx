import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCountries } from '@/hooks/useCountries';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { CountrySelector } from '@/components/CountrySelector';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock, Save, CheckCircle2 } from 'lucide-react';

export default function Predictions() {
  const { user } = useAuth();
  const { data: countries = [] } = useCountries();
  const { data: settings } = useSettings();
  const [selections, setSelections] = useState<Record<string, string | null>>({
    first: null, second: null, third: null, fourth: null, fifth: null, last: null,
  });
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const locked = settings?.predictions_locked ?? false;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', 2026)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setIsSubmitted(data.is_submitted);
          setSelections({
            first: data.first_place,
            second: data.second_place,
            third: data.third_place,
            fourth: data.fourth_place,
            fifth: data.fifth_place,
            last: data.last_place,
          });
        }
      });
  }, [user]);

  const allSelected = Object.values(selections).every(Boolean);
  const usedIds = Object.values(selections);

  const handleSave = async () => {
    if (!user || !allSelected) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      first_place: selections.first,
      second_place: selections.second,
      third_place: selections.third,
      fourth_place: selections.fourth,
      fifth_place: selections.fifth,
      last_place: selections.last,
      is_submitted: true,
      submitted_at: new Date().toISOString(),
      year: 2026,
    };

    let error;
    if (existingId) {
      ({ error } = await supabase.from('predictions').update(payload).eq('id', existingId));
    } else {
      const res = await supabase.from('predictions').insert(payload).select().single();
      error = res.error;
      if (res.data) setExistingId(res.data.id);
    }

    if (error) {
      toast.error('Kunde inte spara. Försök igen.');
    } else {
      setIsSubmitted(true);
      toast.success('Dina tips är sparade! 🎉');
    }
    setSaving(false);
  };

  const set = (key: string) => (value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  const placements = [
    { key: 'first', label: '1:a plats', badge: '1' },
    { key: 'second', label: '2:a plats', badge: '2' },
    { key: 'third', label: '3:e plats', badge: '3' },
    { key: 'fourth', label: '4:e plats', badge: '4' },
    { key: 'fifth', label: '5:e plats', badge: '5' },
  ];

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold mb-1">Tippning</h1>
          <p className="text-sm text-muted-foreground">
            Förutspå topp 5 och vem som kommer sist i Eurovision 2026
          </p>
        </div>

        {locked && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent mb-4">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Tippningen är låst</span>
          </div>
        )}

        {isSubmitted && !locked && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Tips inskickat! Du kan fortfarande ändra.</span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topp 5</p>
          {placements.map(({ key, label, badge }) => (
            <CountrySelector
              key={key}
              label={label}
              badge={badge}
              value={selections[key]}
              onChange={set(key)}
              countries={countries}
              disabledIds={usedIds.filter((id) => id !== selections[key])}
              disabled={locked}
            />
          ))}
        </div>

        <div className="space-y-3 mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sistaplatsen</p>
          <CountrySelector
            label="Sist i tävlingen"
            badge="💀"
            value={selections.last}
            onChange={set('last')}
            countries={countries}
            disabledIds={usedIds.filter((id) => id !== selections.last)}
            disabled={locked}
          />
        </div>

        {!locked && (
          <Button
            onClick={handleSave}
            disabled={!allSelected || saving}
            className="w-full gradient-eurovision border-0 font-display font-semibold text-primary-foreground shadow-glow"
            size="lg"
          >
            {saving ? 'Sparar...' : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isSubmitted ? 'Uppdatera tips' : 'Spara tips'}
              </span>
            )}
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
