import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useIsLocked() {
  const { data: settings } = useSettings();
  if (!settings) return { predictionsLocked: false, favouritesLocked: false, lockTime: null };

  const lockTime = (settings as any).prediction_lock_time as string | null;
  const pastDeadline = lockTime ? new Date(lockTime).getTime() <= Date.now() : false;

  return {
    predictionsLocked: settings.predictions_locked || pastDeadline,
    favouritesLocked: settings.favourites_locked || pastDeadline,
    lockTime,
  };
}
