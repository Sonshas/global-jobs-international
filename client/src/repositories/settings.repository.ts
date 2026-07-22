import { supabase } from '@/lib/supabase';
import type { DbSettingRow, Json } from '@/lib/database.types';

export async function getUserSetting<T = Json>(userId: string, key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return (data as DbSettingRow).value as T;
}

export async function upsertUserSetting(userId: string, key: string, value: Json): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ user_id: userId, key, value }, { onConflict: 'user_id,key' });
  if (error) throw error;
}
