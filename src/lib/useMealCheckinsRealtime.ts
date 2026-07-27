import { useEffect } from 'react'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { supabase, type MealCheckin } from './supabase'

type Filter = { column: 'meal_session_id' | 'participant_id'; value: string }
type InsertHandler = (payload: RealtimePostgresInsertPayload<MealCheckin>) => void

export function useMealCheckinsRealtime(onInsert: InsertHandler, filter?: Filter) {
  useEffect(() => {
    if (filter && !filter.value) return

    const channel = supabase
      .channel(`meal_checkins-${filter ? `${filter.column}-${filter.value}` : 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meal_checkins',
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
        },
        onInsert,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.column, filter?.value])
}
