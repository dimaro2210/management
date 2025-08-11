
import { createClient } from '@supabase/supabase-js'

// Environment variables with fallbacks for deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate environment variables
// Validate environment variables
if (!supabaseUrl) {
  console.error('https://oafqtcxrlfbkxujzbugg.supabase.co')
}

if (!supabaseAnonKey) {
  console.error('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZnF0Y3hybGZia3h1anpidWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDQ3NTAsImV4cCI6MjA3MDM4MDc1MH0.cCpYbY3veltGL2R43gFAMFtj5hyN7icNv3oAAMFwW5A')
}

// Create Supabase client with error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Type definitions
export interface Admission {
  id: string
  student_name: string
  program_of_interest: string
  email_address: string
  home_address: string
  school_name: string
  consultant_name: string
  admission_status: string
  visa_status: string
  created_at: string
  updated_at: string
}

// Database health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('admissions')
      .select('count(*)')
      .limit(1)
    
    if (error) {
      console.error('Database connection error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Error handling wrapper for database operations
export const safeDbOperation = async <T = any>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any; success: boolean }> => {
  try {
    const result = await operation()
    return {
      ...result,
      success: !result.error
    }
  } catch (error) {
    console.error('Database operation failed:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown database error'),
      success: false
    }
  }
}
