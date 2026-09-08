import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCountries } from '@/hooks/useCountries';
import { useIsLocked } from '@/hooks/useSettings';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { CountdownTimer } from '@/components/CountdownTimer';
import { CountrySelector } from '@/components/CountrySelector';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, CheckCircle2 } from 'lucide-react';

export default function Predictions() {
  const { user } = useAuth();
  const { data: countries = [] } = useCountries();
  const { predictionsLocked, lockTime } = useIsLocked();
  const [selections, setSelections] = useState<Record<string, string | null>>({
    first: null, second: null, third: null, fourth: null, fifth: null, last: null,
  });
  const [swedenPosition, setSwedenPosition] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [autoStatus, setAutoStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const loadedRef = useRef(false);
  const idRef = useRef<string | null>(null);

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
          idRef.current = data.id;
          setIsSubmitted(data.is_submitted);
          setSwedenPosition((data as any).sweden_final_position ?? null);
          setSelections({
            first: data.first_place,
            second: data.second_place,
            third: data.third_place,
            fourth: data.fourth_place,
            fifth: data.fifth_place,
            last: data.last_place,
          });
        }
        loadedRef.current = true;
      });
  }, [user]);

  const allSelected = Object.values(selections).every(Boolean) && swedenPosition !== null;
  const usedIds = Object.values(selections);

  const persist = async (submit: boolean) => {
    if (!user || predictionsLocked) return { error: null as any };
    const payload: any = {
      user_id: user.id,
      first_place: selections.first,
      second_place: selections.second,
      third_place: selections.third,
      fourth_place: selections.fourth,
      fifth_place: selections.fifth,
      last_place: selections.last,
      sweden_final_position: swedenPosition,
      year: 2026,
    };
    if (submit) {
      payload.is_submitted = true;
      payload.submitted_at = new Date().toISOString();
    }

    if (idRef.current) {
      return await supabase.from('predictions').update(payload).eq('id', idRef.current);
    }
    const res = await supabase.from('predictions').insert(payload).select().single();
    if (res.data) {
      idRef.current = res.data.id;
      setExistingId(res.data.id);
    }
    return res;
  };

  // Autosave (draft) on every change
  useEffect(() => {
    if (!loadedRef.current || !user || predictionsLocked) return;
    setAutoStatus('saving');
    const t = setTimeout(async () => {
      const { error } = await persist(false);
      setAutoStatus(error ? 'idle' : 'saved');
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, swedenPosition, user, predictionsLocked]);

  const handleSave = async () => {
    if (!user || !allSelected || predictionsLocked) return;
    setSaving(true);
    const { error } = await persist(true);
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
          {!predictionsLocked && autoStatus !== 'idle' && (
            <p className="text-xs text-muted-foreground mt-1">
              {autoStatus === 'saving' ? 'Sparar...' : 'Sparat ✓'}
            </p>
          )}
        </div>

        {lockTime && (
          <div className="mb-4">
            <CountdownTimer
              lockTime={lockTime}
              lockedLabel="Tippningen har stängt"
              openLabel="Tippningen stänger om"
            />
          </div>
        )}

        {isSubmitted && !predictionsLocked && (
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
              disabled={predictionsLocked}
            />
          ))}
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sistaplatsen</p>
          <CountrySelector
            label="Sist i tävlingen"
            badge="💀"
            value={selections.last}
            onChange={set('last')}
            countries={countries}
            disabledIds={usedIds.filter((id) => id !== selections.last)}
            disabled={predictionsLocked}
          />
        </div>

        <div className="space-y-3 mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sveriges placering</p>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <span className="text-2xl">🇸🇪</span>
            <div className="flex-1">
              <p className="text-sm font-medium">Vilken placering får Sverige?</p>
            </div>
            <Select
              value={swedenPosition?.toString() ?? ''}
              onValueChange={(v) => setSwedenPosition(Number(v))}
              disabled={predictionsLocked}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="#" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!predictionsLocked && (
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
