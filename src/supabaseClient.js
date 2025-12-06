// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// GANTI DENGAN DATA ANDA DARI SUPABASE DASHBOARD -> SETTINGS -> API
const supabaseUrl = 'https://tjijmdguldpieefzdvne.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWptZGd1bGRwaWVlZnpkdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjk4MTcsImV4cCI6MjA4MDYwNTgxN30.dCYsW_Ah5YtiTreCR4Y-PQSq9TZ6bOF1DRw_VUtRhoI' // Masukkan KEY "anon" / "public"

export const supabase = createClient(supabaseUrl, supabaseKey)