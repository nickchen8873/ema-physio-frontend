// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ouqodwifvpjsncdvjilg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91cW9kd2lmdnBqc25jZHZqaWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzU3MjMsImV4cCI6MjA5Mjc1MTcyM30.QF0ID5i8AKrv4hwmtCyA1iPvmf4Jhdm-dvqo1GPp8DA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)