export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type CategoryRow = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type TodoRow = {
  id: string
  user_id: string
  title: string
  completed: boolean
  created_at: string
  priority_id: number
  category_id: string | null
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow
        Insert: { id?: string; user_id: string; name: string; created_at?: string }
        Update: { name?: string }
        Relationships: []
      }
      todos: {
        Row: TodoRow
        Insert: {
          id?: string
          user_id: string
          title: string
          completed?: boolean
          created_at?: string
          priority_id?: number
          category_id?: string | null
        }
        Update: { completed?: boolean; category_id?: string | null }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      import_browser_data: {
        Args: { expected_user_id: string; category_rows: Json; todo_rows: Json }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
