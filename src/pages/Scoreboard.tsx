import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCountries } from '@/hooks/useCountries';
import { useIsLocked } from '@/hooks/useSettings';
import { AppLayout } from '@/components/AppLayout';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Heart, CheckCircle2, XCircle, EyeOff } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Country = Tables<'countries'>;

function getCountryById(countries: Country[], id: string | null) {
  if (!id) return null;
  return countries.find((c) => c.id === id) ?? null;
}

function CountryBadge({ country }: { country: Country | null }) {
  if (!country) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span>{country.flag_emoji}</span>
      <span className="hidden sm:inline">{country.country_name}</span>
    </span>
  );
}

export default function Scoreboard() {
  const { data: countries = [] } = useCountries();
  const { predictionsLocked, lockTime } = useIsLocked();
  const [tab, setTab] = useState('predictions');

  const { data: actualResults } = useQuery({
    queryKey: ['actual-results'],
    queryFn: async () => {
      const { data } = await supabase.from('actual_results').select('*').eq('year', 2026).maybeSingle();
      return data;
    },
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['all-predictions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .eq('year', 2026);
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*');
      return data ?? [];
    },
  });

  const { data: favourites = [] } = useQuery({
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

  // Aggregate favourites
  const favouriteScores = new Map<string, { points: number; votes: number }>();
  favourites.forEach((fav: any) => {
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

  // All profiles with submission status, sorted by points then tiebreaker
  const profilesWithStatus = profiles.map((p) => {
    const pred = predictions.find((pr: any) => pr.user_id === p.user_id);
    return { profile: p, prediction: pred ?? null };
  }).sort((a, b) => {
    const ptsA = a.prediction?.calculated_points ?? 0;
    const ptsB = b.prediction?.calculated_points ?? 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    // Tiebreaker: smaller Sweden position difference is better
    const diffA = a.prediction?.sweden_final_position != null ? Math.abs(a.prediction.sweden_final_position - 7) : 999;
    const diffB = b.prediction?.sweden_final_position != null ? Math.abs(b.prediction.sweden_final_position - 7) : 999;
    return diffA - diffB;
  });

  if (!predictionsLocked) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-16 px-4 text-center">
          <EyeOff className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-xl font-display font-bold mb-2">Resultattavlan blir synlig när tippningen har stängt.</h1>
          {lockTime && (
            <div className="mt-4 w-full max-w-sm">
              <CountdownTimer
                lockTime={lockTime}
                lockedLabel="Tippningen har stängt"
                openLabel="Tippningen stänger om"
              />
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-display font-bold mb-4">Resultattavla</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full mb-4 bg-card">
            <TabsTrigger value="predictions" className="flex-1 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Trophy className="w-4 h-4" />
              Tippning
            </TabsTrigger>
            <TabsTrigger value="favourites" className="flex-1 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Heart className="w-4 h-4" />
              Favoriter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions">
            <div className="space-y-3">
              {profilesWithStatus.map(({ profile, prediction }) => (
                <div
                  key={profile.id}
                  className="p-4 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full gradient-eurovision flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {profile.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm">{profile.nickname}</p>
                        <p className="text-xs text-muted-foreground">
                          {prediction?.calculated_points ?? 0} poäng
                        </p>
                      </div>
                    </div>
                    {prediction?.is_submitted ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Inskickat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <XCircle className="w-3 h-3" />
                        Ej inskickat
                      </span>
                    )}
                  </div>

                  {prediction?.is_submitted && (
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[
                        { label: '1:a', id: prediction.first_place },
                        { label: '2:a', id: prediction.second_place },
                        { label: '3:e', id: prediction.third_place },
                        { label: '4:e', id: prediction.fourth_place },
                        { label: '5:e', id: prediction.fifth_place },
                        { label: 'Sist', id: prediction.last_place },
                      ].map(({ label, id }) => (
                        <div key={label} className="text-center p-2 rounded-lg bg-secondary">
                          <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                          <CountryBadge country={getCountryById(countries, id)} />
                        </div>
                      ))}
                      <div className="text-center p-2 rounded-lg bg-secondary">
                        <p className="text-[10px] text-muted-foreground mb-1">🇸🇪</p>
                        <span className="text-xs font-bold">{prediction.sweden_final_position ?? '—'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favourites">
            <div className="space-y-2">
              {sortedFavourites.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Inga favoritröster ännu. Var först att rösta!
                </p>
              )}
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
