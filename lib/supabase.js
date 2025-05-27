import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.https://efbodenkopgbatxgvmty.supabase.co;
const supabaseAnonKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYm9kZW5rb3BnYmF0eGd2bXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTU4MjksImV4cCI6MjA2MzkzMTgyOX0.CifNAGzdQByDa5znffz4qbOkmVBUZcTzlyfk5m6K274;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
