import type { BookingRecord } from "../types"

// Initial bookings defaults to empty - real bookings are loaded dynamically from Supabase PostgreSQL
export const INITIAL_BOOKINGS: BookingRecord[] = []
