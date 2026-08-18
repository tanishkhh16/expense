export type Category = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type Expense = {
  id: string
  user_id: string
  category_id: string
  remark: string
  total_amount: number
  start_date: string
  end_date: string
  is_fixed: boolean
  note: string | null
  created_at: string
  subcategory: string | null
}

export type Income = {
  id: string
  user_id: string
  source: string
  amount: number
  month: number
  year: number
  created_at: string
}

export type SavingsGoal = {
  id: string
  user_id: string
  year: number
  month: number
  target_amount: number
  created_at: string
}