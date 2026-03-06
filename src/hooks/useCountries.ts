import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active_finalist', true)
        .eq('year', 2026)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });
}
