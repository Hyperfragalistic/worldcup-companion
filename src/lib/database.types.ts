export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:            string
          username:      string | null
          full_name:     string | null
          avatar_url:    string | null
          favorite_team: string | null
          country:       string | null
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id:            string
          username?:     string | null
          full_name?:    string | null
          avatar_url?:   string | null
          favorite_team?: string | null
          country?:      string | null
          created_at?:   string
          updated_at?:   string
        }
        Update: {
          username?:     string | null
          full_name?:    string | null
          avatar_url?:   string | null
          favorite_team?: string | null
          country?:      string | null
          updated_at?:   string
        }
      }
      matches: {
        Row: {
          id:         string
          round:      string
          match_date: string
          team1:      string
          team2:      string
          venue:      string | null
          group_name: string | null
          starts_at:  string
          score1:     number | null
          score2:     number | null
          status:     'upcoming' | 'live' | 'finished'
        }
        Insert: {
          id?:        string
          round:      string
          match_date: string
          team1:      string
          team2:      string
          venue?:     string | null
          group_name?: string | null
          starts_at:  string
          score1?:    number | null
          score2?:    number | null
          status?:    'upcoming' | 'live' | 'finished'
        }
        Update: {
          score1?:  number | null
          score2?:  number | null
          status?:  'upcoming' | 'live' | 'finished'
        }
      }
      predictions: {
        Row: {
          id:         string
          user_id:    string
          match_id:   string
          home_score: number
          away_score: number
          created_at: string
        }
        Insert: {
          id?:        string
          user_id:    string
          match_id:   string
          home_score: number
          away_score: number
          created_at?: string
        }
        Update: {
          home_score?: number
          away_score?: number
        }
      }
      messages: {
        Row: {
          id:         string
          match_id:   string
          user_id:    string
          username:   string | null
          content:    string
          created_at: string
        }
        Insert: {
          id?:       string
          match_id:  string
          user_id:   string
          username?: string | null
          content:   string
          created_at?: string
        }
        Update: never
      }
    }
    Views:     Record<string, never>
    Functions: Record<string, never>
    Enums:     Record<string, never>
  }
}

// Convenience aliases used throughout the app
export type Profile    = Database['public']['Tables']['profiles']['Row']
export type Match      = Database['public']['Tables']['matches']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']
export type Message    = Database['public']['Tables']['messages']['Row']

export type MatchWithPrediction = Match & { my_prediction: Prediction | null }
