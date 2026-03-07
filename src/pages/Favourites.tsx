import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCountries } from '@/hooks/useCountries';
import { useIsLocked } from '@/hooks/useSettings';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { CountdownTimer } from '@/components/CountdownTimer';
import { CountrySelector } from '@/components/CountrySelector';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, CheckCircle2, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/integrations/supabase/types';

type Country = Tables<'countries'>;

function getCountryById(countries: Country[], id: string | null) {
  if (!id) return null;
  return countries.find((c) => c.id === id) ?? null;
}

export default function Favourites() {
  const { user } = useAuth();
  const { data: countries = [] } = useCountries();
  const { favouritesLocked, lockTime } = useIsLocked();
  const [selections, setSelections] = useState<Record<string, string | null>>({
    first: null, second: null, third: null,
  });
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('favourite_votes')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', 2026)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setIsSubmitted(data.is_submitted);
          setSelections({
            first: data.first_favourite,
            second: data.second_favourite,
            third: data.third_favourite,
          });
        }
      });
  }, [user]);

  // Leaderboard data
  const { data: allFavourites = [] } = useQuery({
    queryKey: ['all-favourites'],
    queryFn: async () => {
      const { data } = await supabase
        .from('favourite_votes')
        .select('*')
        .eq('year', 2026)
        .eq('is_submitted', true);
      return data ?? [];
    },
  });

  const favouriteScores = new Map<string, { points: number; votes: number }>();
  allFavourites.forEach((fav) => {
    [
      { id: fav.first_favourite, pts: 3 },
      { id: fav.second_favourite, pts: 2 },
      { id: fav.third_favourite, pts: 1 },
    ].forEach(({ id, pts }) => {
      if (!id) return;
      const existing = favouriteScores.get(id) ?? { points: 0, votes: 0 };
      favouriteScores.set(id, { points: existing.points + pts, votes: existing.votes + 1 });
    });
  });

  const sortedFavourites = [...favouriteScores.entries()]
    .sort((a, b) => b[1].points - a[1].points)
    .map(([countryId, score], idx) => ({
      country: getCountryById(countries, countryId),
      ...score,
      rank: idx + 1,
    }));

  const allSelected = Object.values(selections).every(Boolean);
  const usedIds = Object.values(selections);

  const handleSave = async () => {
    if (!user || !allSelected || favouritesLocked) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      first_favourite: selections.first,
      second_favourite: selections.second,
      third_favourite: selections.third,
      is_submitted: true,
      submitted_at: new Date().toISOString(),
      year: 2026,
    };

    let error;
    if (existingId) {
      ({ error } = await supabase.from('favourite_votes').update(payload).eq('id', existingId));
    } else {
      const res = await supabase.from('favourite_votes').insert(payload).select().single();
      error = res.error;
      if (res.data) setExistingId(res.data.id);
    }

    if (error) {
      toast.error('Kunde inte spara. Försök igen.');
    } else {
      setIsSubmitted(true);
      toast.success('Dina favoriter är sparade! ❤️');
    }
    setSaving(false);
  };

  const set = (key: string) => (value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  const favourites = [
    { key: 'first', label: 'Favorit #1', badge: '❤️' },
    { key: 'second', label: 'Favorit #2', badge: '🧡' },
    { key: 'third', label: 'Favorit #3', badge: '💛' },
  ];

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold mb-1 flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            Mina favoriter
          </h1>
          <p className="text-sm text-muted-foreground">
            Vilka låtar tycker du borde vinna? Rösta på dina topp 3!
          </p>
        </div>

        {lockTime && (
          <div className="mb-4">
            <CountdownTimer
              lockTime={lockTime}
              lockedLabel="Favoritröstningen har stängt"
              openLabel="Röstningen stänger om"
            />
          </div>
        )}

        {isSubmitted && !favouritesLocked && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Röst inskickad! Du kan fortfarande ändra.</span>
          </div>
        )}

        <div className="space-y-3 mb-8">
          {favourites.map(({ key, label, badge }) => (
            <CountrySelector
              key={key}
              label={label}
              badge={badge}
              value={selections[key]}
              onChange={set(key)}
              countries={countries}
              disabledIds={usedIds.filter((id) => id !== selections[key])}
              disabled={favouritesLocked}
            />
          ))}
        </div>

        {!favouritesLocked && (
          <Button
            onClick={handleSave}
            disabled={!allSelected || saving}
            className="w-full gradient-eurovision border-0 font-display font-semibold text-primary-foreground shadow-glow mb-8"
            size="lg"
          >
            {saving ? 'Sparar...' : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isSubmitted ? 'Uppdatera favoriter' : 'Spara favoriter'}
              </span>
            )}
          </Button>
        )}

        {/* Leaderboard */}
        <div>
          <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
            🏆 Favorittoppen
          </h2>
          {sortedFavourites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Inga favoritröster ännu. Var först att rösta!
            </p>
          ) : (
            <div className="space-y-2">
              {sortedFavourites.map(({ country, points, votes, rank }) => (
                <div
                  key={country?.id ?? rank}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                    rank === 1 ? 'gradient-gold text-accent-foreground' :
                    rank === 2 ? 'bg-secondary text-foreground' :
                    rank === 3 ? 'bg-secondary text-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {rank}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-2xl">{country?.flag_emoji}</span>
                    <span className="font-medium text-sm">{country?.country_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-sm">{points} p</p>
                    <p className="text-[10px] text-muted-foreground">{votes} röster</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
