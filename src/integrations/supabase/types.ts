export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      fixed_expenses: {
        Row: {
          amount: number
          budget_id: string
          created_at: string
          id: string
          is_paid: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          budget_id: string
          created_at?: string
          id?: string
          is_paid?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string
          created_at?: string
          id?: string
          is_paid?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "monthly_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_incomes: {
        Row: {
          amount: number
          budget_id: string
          created_at: string
          id: string
          is_received: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          budget_id: string
          created_at?: string
          id?: string
          is_received?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string
          created_at?: string
          id?: string
          is_received?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_incomes_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "monthly_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_budgets: {
        Row: {
          created_at: string
          id: string
          initial_balance: number
          is_savings_set_aside: boolean
          is_savings_transferred: boolean
          month: number
          monthly_savings: number
          remaining_balance: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          initial_balance?: number
          is_savings_set_aside?: boolean
          is_savings_transferred?: boolean
          month: number
          monthly_savings?: number
          remaining_balance?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          initial_balance?: number
          is_savings_set_aside?: boolean
          is_savings_transferred?: boolean
          month?: number
          monthly_savings?: number
          remaining_balance?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accounts: string[] | null
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          categories: string[] | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone_number: string | null
          preferred_currency: string | null
          profession: string | null
          updated_at: string
        }
        Insert: {
          accounts?: string[] | null
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          categories?: string[] | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone_number?: string | null
          preferred_currency?: string | null
          profession?: string | null
          updated_at?: string
        }
        Update: {
          accounts?: string[] | null
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          categories?: string[] | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          preferred_currency?: string | null
          profession?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      savings_accounts: {
        Row: {
          account_type: string
          created_at: string
          current_balance: number
          id: string
          interest_frequency: string
          interest_rate: number
          interest_type: string
          is_liquid: boolean
          max_deposit_limit: number | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: string
          created_at?: string
          current_balance?: number
          id?: string
          interest_frequency?: string
          interest_rate?: number
          interest_type?: string
          is_liquid?: boolean
          max_deposit_limit?: number | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          created_at?: string
          current_balance?: number
          id?: string
          interest_frequency?: string
          interest_rate?: number
          interest_type?: string
          is_liquid?: boolean
          max_deposit_limit?: number | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_distribution_plans: {
        Row: {
          created_at: string
          distribution: Json
          id: string
          month: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          distribution: Json
          id?: string
          month: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          distribution?: Json
          id?: string
          month?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      savings_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          description: string
          id: string
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          description: string
          id?: string
          transaction_date?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          description?: string
          id?: string
          transaction_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "savings_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account: string
          amount: number
          budget_id: string
          category: string
          created_at: string
          date: string
          description: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          account: string
          amount?: number
          budget_id: string
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          account?: string
          amount?: number
          budget_id?: string
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "monthly_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_accounts: {
        Args: {
          user_id_param: string
        }
        Returns: {
          name: string
        }[]
      }
      get_user_categories: {
        Args: {
          user_id_param: string
        }
        Returns: {
          name: string
        }[]
      }
      increment: {
        Args: {
          row_id: string
          x: number
          column_name: string
          table_name: string
        }
        Returns: number
      }
      save_user_accounts: {
        Args: {
          user_id_param: string
          account_names: string[]
        }
        Returns: undefined
      }
      save_user_categories: {
        Args: {
          user_id_param: string
          category_names: string[]
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
