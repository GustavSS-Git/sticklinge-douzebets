import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCountries } from '@/hooks/useCountries';
import { AppLayout } from '@/components/AppLayout';
import { CountrySelector } from '@/components/CountrySelector';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Trophy, Heart, Settings, Trash2, Calculator, Send, RotateCcw } from 'lucide-react';
import { Navigate } from 'react-router-dom';
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
      <span>{country.country_name}</span>
    </span>
  );
}

export default function Admin() {
  const { profile, user } = useAuth();
  const { data: countries = [] } = useCountries();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('users');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [rankingPreview, setRankingPreview] = useState<any[] | null>(null);

  // Actual results form state
  const [results, setResults] = useState<Record<string, string | null>>({
    first: null, second: null, third: null, fourth: null, fifth: null, last: null,
  });
  const [swedenActualPos, setSwedenActualPos] = useState<number | null>(null);
  const [savingResults, setSavingResults] = useState(false);

  // Fetch data
  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*');
      return data ?? [];
    },
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['admin-predictions'],
    queryFn: async () => {
      const { data } = await supabase.from('predictions').select('*').eq('year', 2026);
      return data ?? [];
    },
  });

  const { data: favourites = [] } = useQuery({
    queryKey: ['admin-favourites'],
    queryFn: async () => {
      const { data } = await supabase.from('favourite_votes').select('*').eq('year', 2026);
      return data ?? [];
    },
  });

  const { data: existingResults } = useQuery({
    queryKey: ['admin-actual-results'],
    queryFn: async () => {
      const { data } = await supabase.from('actual_results').select('*').eq('year', 2026).maybeSingle();
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*').single();
      return data;
    },
  });

  // Load existing results into form
  useEffect(() => {
    if (existingResults) {
      setResults({
        first: existingResults.first_place,
        second: existingResults.second_place,
        third: existingResults.third_place,
        fourth: existingResults.fourth_place,
        fifth: existingResults.fifth_place,
        last: existingResults.last_place,
      });
      setSwedenActualPos(existingResults.sweden_actual_position ?? null);
    }
  }, [existingResults]);

  if (!profile?.is_admin) {
    return <Navigate to="/tippa" replace />;
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Vill du verkligen ta bort denna användare? All data raderas.')) return;
    setDeleting(userId);

    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId },
    });

    if (error || data?.error) {
      toast.error(data?.error || 'Kunde inte ta bort användaren.');
    } else {
      toast.success('Användaren har tagits bort.');
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-favourites'] });
    }
    setDeleting(null);
  };

  const handleSaveResults = async () => {
    const allFilled = Object.values(results).every(Boolean) && swedenActualPos !== null;
    if (!allFilled) {
      toast.error('Fyll i alla resultatfält.');
      return;
    }
    setSavingResults(true);

    const payload = {
      first_place: results.first,
      second_place: results.second,
      third_place: results.third,
      fourth_place: results.fourth,
      fifth_place: results.fifth,
      last_place: results.last,
      sweden_actual_position: swedenActualPos,
      year: 2026,
    } as any;

    let error;
    if (existingResults) {
      ({ error } = await supabase.from('actual_results').update(payload).eq('id', existingResults.id));
    } else {
      ({ error } = await supabase.from('actual_results').insert(payload));
    }

    if (error) {
      toast.error('Kunde inte spara resultat: ' + error.message);
    } else {
      toast.success('Resultat sparade!');
      queryClient.invalidateQueries({ queryKey: ['admin-actual-results'] });
    }
    setSavingResults(false);
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setRankingPreview(null);

    const { data, error } = await supabase.functions.invoke('calculate-scores', {
      body: { publish: false },
    });

    if (error || data?.error) {
      toast.error(data?.error || 'Kunde inte beräkna poäng.');
    } else {
      toast.success(`Poäng beräknade! ${data.processed} tips.`);
      setRankingPreview(data.ranking ?? []);
      queryClient.invalidateQueries({ queryKey: ['admin-predictions'] });
    }
    setCalculating(false);
  };

  const handlePublish = async () => {
    if (!confirm('Publicera resultattavlan för alla användare?')) return;
    setPublishing(true);

    const { data, error } = await supabase.functions.invoke('calculate-scores', {
      body: { publish: true },
    });

    if (error || data?.error) {
      toast.error(data?.error || 'Kunde inte publicera resultat.');
    } else {
      toast.success(`Resultat publicerade! ${data.processed} tips beräknade.`);
      queryClient.invalidateQueries({ queryKey: ['admin-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
    setPublishing(false);
  };

  const handleReset = async () => {
    if (!confirm('Är du säker på att du vill återställa resultatet? Poäng nollställs och resultattavlan avpubliceras.')) return;
    setResetting(true);

    const { data, error } = await supabase.functions.invoke('reset-results');

    if (error || data?.error) {
      toast.error(data?.error || 'Kunde inte återställa.');
    } else {
      toast.success('Resultat återställda. Du kan nu ändra och publicera igen.');
      setRankingPreview(null);
      queryClient.invalidateQueries({ queryKey: ['admin-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
    setResetting(false);
  };

  const usedResultIds = Object.values(results);
  const setResult = (key: string) => (value: string) => {
    setResults((prev) => ({ ...prev, [key]: value }));
  };

  const getNickname = (userId: string) => profiles.find((p) => p.user_id === userId)?.nickname ?? '—';
  const getEmail = (userId: string) => profiles.find((p) => p.user_id === userId)?.email ?? '—';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Admin
        </h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full mb-4 bg-card flex-wrap h-auto">
            <TabsTrigger value="users" className="flex-1 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Users className="w-4 h-4" /> Användare
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex-1 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Trophy className="w-4 h-4" /> Tips
            </TabsTrigger>
            <TabsTrigger value="favourites" className="flex-1 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Heart className="w-4 h-4" /> Favoriter
            </TabsTrigger>
            <TabsTrigger value="results" className="flex-1 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Calculator className="w-4 h-4" /> Resultat
            </TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="space-y-2">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                  <div>
                    <p className="font-semibold text-sm">{p.nickname}</p>
                    <p className="text-xs text-muted-foreground">{p.email ?? '—'}</p>
                    {p.is_admin && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>}
                  </div>
                  {p.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(p.user_id)}
                      disabled={deleting === p.user_id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* PREDICTIONS TAB */}
          <TabsContent value="predictions">
            <div className="space-y-3">
              {predictions.map((pred) => (
                <div key={pred.id} className="p-3 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{getNickname(pred.user_id)}</p>
                      <p className="text-[10px] text-muted-foreground">{getEmail(pred.user_id)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${pred.is_submitted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {pred.is_submitted ? 'Inskickat' : 'Ej inskickat'} — {pred.calculated_points} p
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {[
                      { label: '1:a', id: pred.first_place },
                      { label: '2:a', id: pred.second_place },
                      { label: '3:e', id: pred.third_place },
                      { label: '4:e', id: pred.fourth_place },
                      { label: '5:e', id: pred.fifth_place },
                      { label: 'Sist', id: pred.last_place },
                    ].map(({ label, id }) => (
                      <div key={label} className="text-center p-1.5 rounded-lg bg-secondary">
                        <p className="text-[9px] text-muted-foreground">{label}</p>
                        <CountryBadge country={getCountryById(countries, id)} />
                      </div>
                    ))}
                    <div className="text-center p-1.5 rounded-lg bg-secondary">
                      <p className="text-[9px] text-muted-foreground">🇸🇪</p>
                      <span className="text-xs font-bold">{pred.sweden_final_position ?? '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* FAVOURITES TAB */}
          <TabsContent value="favourites">
            <div className="space-y-3">
              {favourites.map((fav) => (
                <div key={fav.id} className="p-3 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{getNickname(fav.user_id)}</p>
                      <p className="text-[10px] text-muted-foreground">{getEmail(fav.user_id)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${fav.is_submitted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {fav.is_submitted ? 'Inskickat' : 'Ej inskickat'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'Favorit #1', id: fav.first_favourite },
                      { label: 'Favorit #2', id: fav.second_favourite },
                      { label: 'Favorit #3', id: fav.third_favourite },
                    ].map(({ label, id }) => (
                      <div key={label} className="text-center p-1.5 rounded-lg bg-secondary">
                        <p className="text-[9px] text-muted-foreground">{label}</p>
                        <CountryBadge country={getCountryById(countries, id)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results">
            <div className="space-y-6">
              {/* Status */}
              {settings?.results_published && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  ✅ Resultaten är publicerade.
                </div>
              )}

              {/* Enter actual results */}
              <div>
                <h2 className="text-lg font-display font-bold mb-3">Faktiska resultat</h2>

                <div className="space-y-3 mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topp 5</p>
                  {[
                    { key: 'first', label: '1:a plats', badge: '1' },
                    { key: 'second', label: '2:a plats', badge: '2' },
                    { key: 'third', label: '3:e plats', badge: '3' },
                    { key: 'fourth', label: '4:e plats', badge: '4' },
                    { key: 'fifth', label: '5:e plats', badge: '5' },
                  ].map(({ key, label, badge }) => (
                    <CountrySelector
                      key={key}
                      label={label}
                      badge={badge}
                      value={results[key]}
                      onChange={setResult(key)}
                      countries={countries}
                      disabledIds={usedResultIds.filter((id) => id !== results[key])}
                    />
                  ))}
                </div>

                <div className="space-y-3 mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sistaplatsen</p>
                  <CountrySelector
                    label="Sist i tävlingen"
                    badge="💀"
                    value={results.last}
                    onChange={setResult('last')}
                    countries={countries}
                    disabledIds={usedResultIds.filter((id) => id !== results.last)}
                  />
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sveriges placering</p>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                    <span className="text-2xl">🇸🇪</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sveriges faktiska placering</p>
                    </div>
                    <Select
                      value={swedenActualPos?.toString() ?? ''}
                      onValueChange={(v) => setSwedenActualPos(Number(v))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="#" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleSaveResults}
                  disabled={savingResults}
                  className="w-full mb-4"
                  size="lg"
                >
                  {savingResults ? 'Sparar...' : 'Spara resultat'}
                </Button>
              </div>

              {/* Calculate button */}
              <div className="border-t border-border pt-6">
                <h2 className="text-lg font-display font-bold mb-2">Beräkna poäng</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Beräknar poäng för alla tips utan att publicera. Resultatet visas nedan.
                </p>
                <Button
                  onClick={handleCalculate}
                  disabled={calculating}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  {calculating ? 'Beräknar...' : (
                    <span className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Beräkna poäng
                    </span>
                  )}
                </Button>
              </div>

              {/* Ranking preview */}
              {rankingPreview && rankingPreview.length > 0 && (
                <div className="border-t border-border pt-6">
                  <h2 className="text-lg font-display font-bold mb-3">Förhandsvisning av ranking</h2>
                  <div className="space-y-2">
                    {rankingPreview.map((entry: any, idx: number) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                      return (
                        <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                          <span className="w-8 text-center font-display font-bold text-sm">
                            {medal ?? `${idx + 1}.`}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{getNickname(entry.user_id)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold text-sm">{entry.points} p</p>
                            <p className="text-[10px] text-muted-foreground">🇸🇪 diff: {entry.swedenDiff}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Publish button */}
              <div className="border-t border-border pt-6">
                <h2 className="text-lg font-display font-bold mb-2">Publicera resultattavla</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Beräknar poäng och publicerar resultattavlan för alla användare.
                </p>
                <Button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full gradient-eurovision border-0 font-display font-semibold text-primary-foreground shadow-glow"
                  size="lg"
                >
                  {publishing ? 'Publicerar...' : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Publicera resultat
                    </span>
                  )}
                </Button>
              </div>

              {/* Reset button */}
              {settings?.results_published && (
                <div className="border-t border-border pt-6">
                  <h2 className="text-lg font-display font-bold mb-2 text-destructive">Återställ resultat</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Avpublicerar resultattavlan och nollställer alla poäng. Tips, konton och favoritröster bevaras.
                  </p>
                  <Button
                    onClick={handleReset}
                    disabled={resetting}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    {resetting ? 'Återställer...' : (
                      <span className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Reset resultat
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
