import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCountries } from '@/hooks/useCountries';
import { useIsLocked, useSettings } from '@/hooks/useSettings';
import { AppLayout } from '@/components/AppLayout';
import { CountdownTimer } from '@/components/CountdownTimer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Heart, CheckCircle2, XCircle, EyeOff, Sparkles } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import confetti from 'canvas-confetti';

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
  const { data: settings } = useSettings();
  const [tab, setTab] = useState('predictions');

  const resultsPublished = settings?.results_published ?? false;

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
      const { data } = await supabase.from('predictions').select('*').eq('year', 2026);
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
      const { data } = await supabase.from('favourite_votes').select('*').eq('year', 2026).eq('is_submitted', true);
      return data ?? [];
    },
  });

  // Fire confetti when results are published
  useEffect(() => {
    if (resultsPublished) {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#e91e8c', '#7c3aed', '#3b82f6', '#fbbf24'] });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#e91e8c', '#7c3aed', '#3b82f6', '#fbbf24'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [resultsPublished]);

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
  const swedenActual = actualResults?.sweden_actual_position ?? null;
  const profilesWithStatus = profiles.map((p) => {
    const pred = predictions.find((pr: any) => pr.user_id === p.user_id);
    const swedenDiff = pred?.sweden_final_position != null && swedenActual != null
      ? Math.abs(pred.sweden_final_position - swedenActual)
      : 999;
    return { profile: p, prediction: pred ?? null, swedenDiff };
  }).sort((a, b) => {
    const ptsA = a.prediction?.calculated_points ?? 0;
    const ptsB = b.prediction?.calculated_points ?? 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    return a.swedenDiff - b.swedenDiff;
  });

  const winner = resultsPublished && profilesWithStatus.length > 0 ? profilesWithStatus[0] : null;

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

        {/* Eurovision Results Section */}
        {resultsPublished && actualResults && (
          <div className="mb-6 space-y-4">
            {/* Winner Banner */}
            {winner && (
              <div className="relative overflow-hidden rounded-2xl gradient-eurovision p-5 text-center shadow-glow">
                <Sparkles className="absolute top-3 left-3 w-5 h-5 text-primary-foreground/60 animate-pulse" />
                <Sparkles className="absolute top-3 right-3 w-5 h-5 text-primary-foreground/60 animate-pulse" />
                <p className="text-3xl mb-1">🏆</p>
                <p className="font-display font-bold text-lg text-primary-foreground">
                  Vinnare av Sticklinge DouzeBets 2026
                </p>
                <p className="font-display font-bold text-2xl text-primary-foreground mt-1">
                  {winner.profile.nickname}
                </p>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  {winner.prediction?.calculated_points ?? 0} poäng
                </p>
              </div>
            )}

            {/* Actual Eurovision Results */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h2 className="font-display font-bold text-base mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                Eurovision-resultatet
              </h2>
              <div className="space-y-1.5">
                {[
                  { pos: '1', id: actualResults.first_place },
                  { pos: '2', id: actualResults.second_place },
                  { pos: '3', id: actualResults.third_place },
                  { pos: '4', id: actualResults.fourth_place },
                  { pos: '5', id: actualResults.fifth_place },
                ].map(({ pos, id }) => {
                  const country = getCountryById(countries, id);
                  return (
                    <div key={pos} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-right font-display font-bold text-muted-foreground">{pos}.</span>
                      <span className="text-lg">{country?.flag_emoji}</span>
                      <span className="font-medium">{country?.country_name ?? '—'}</span>
                    </div>
                  );
                })}
                <div className="border-t border-border my-2" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-right font-display font-bold text-destructive">💀</span>
                  <span className="text-lg">{getCountryById(countries, actualResults.last_place)?.flag_emoji}</span>
                  <span className="font-medium">Sist: {getCountryById(countries, actualResults.last_place)?.country_name ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-right">🇸🇪</span>
                  <span className="font-medium">Sveriges placering: {swedenActual ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
              {profilesWithStatus.map(({ profile, prediction, swedenDiff }, idx) => {
                const medal = resultsPublished ? (idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null) : null;
                const rank = idx + 1;
                return (
                  <div
                    key={profile.id}
                    className={`p-4 rounded-xl bg-card border ${
                      resultsPublished && idx === 0 ? 'border-accent shadow-gold' :
                      resultsPublished && idx <= 2 ? 'border-primary/30' :
                      'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {resultsPublished ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            idx === 0 ? 'gradient-gold text-accent-foreground' :
                            idx <= 2 ? 'gradient-eurovision text-primary-foreground' :
                            'bg-secondary text-secondary-foreground'
                          }`}>
                            {medal ?? rank}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full gradient-eurovision flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {profile.nickname.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-display font-semibold text-sm">{profile.nickname}</p>
                          <p className="text-xs text-muted-foreground">
                            {prediction?.calculated_points ?? 0} poäng
                            {resultsPublished && swedenDiff < 999 && (
                              <span className="ml-1 text-muted-foreground/70">(🇸🇪 ±{swedenDiff})</span>
                            )}
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
                        ].map(({ label, id }) => {
                          let highlight = '';
                          if (resultsPublished && actualResults && id) {
                            const actualTop5 = [actualResults.first_place, actualResults.second_place, actualResults.third_place, actualResults.fourth_place, actualResults.fifth_place];
                            if (label === 'Sist') {
                              if (id === actualResults.last_place) highlight = 'ring-2 ring-green-500';
                            } else if (id === actualResults.first_place && prediction.first_place === id) {
                              highlight = 'ring-2 ring-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]';
                            } else if (actualTop5.includes(id)) {
                              highlight = 'ring-2 ring-green-500';
                            }
                          }
                          return (
                            <div key={label} className={`text-center p-2 rounded-lg bg-secondary ${highlight}`}>
                              <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                              <CountryBadge country={getCountryById(countries, id)} />
                            </div>
                          );
                        })}
                        {(() => {
                          const swedenCorrect = resultsPublished && actualResults && prediction.sweden_final_position != null && prediction.sweden_final_position === swedenActual;
                          return (
                            <div className={`text-center p-2 rounded-lg bg-secondary ${swedenCorrect ? 'ring-2 ring-green-500' : ''}`}>
                              <p className="text-[10px] text-muted-foreground mb-1">🇸🇪</p>
                              <span className="text-xs font-bold">{prediction.sweden_final_position ?? '—'}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
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
