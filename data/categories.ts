// Standard list of income and expense categories used when logging transactions
export interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
}

export const defaultCategories: Category[] = [
  // Income categories
  { id: "salary", name: "Salary", type: "INCOME", color: "#10b981" },
  { id: "freelance", name: "Freelance", type: "INCOME", color: "#06b6d4" },
  { id: "investments", name: "Investments", type: "INCOME", color: "#8b5cf6" },
  { id: "rental", name: "Rental Income", type: "INCOME", color: "#f59e0b" },
  { id: "business", name: "Business", type: "INCOME", color: "#3b82f6" },
  { id: "other-income", name: "Other Income", type: "INCOME", color: "#64748b" },

  // Expense categories
  { id: "housing", name: "Housing", type: "EXPENSE", color: "#ef4444" },
  { id: "groceries", name: "Groceries", type: "EXPENSE", color: "#f97316" },
  { id: "food-dining", name: "Food & Dining", type: "EXPENSE", color: "#eab308" },
  { id: "transportation", name: "Transportation", type: "EXPENSE", color: "#84cc16" },
  { id: "utilities", name: "Utilities", type: "EXPENSE", color: "#14b8a6" },
  { id: "entertainment", name: "Entertainment", type: "EXPENSE", color: "#a855f7" },
  { id: "shopping", name: "Shopping", type: "EXPENSE", color: "#ec4899" },
  { id: "healthcare", name: "Healthcare", type: "EXPENSE", color: "#f43f5e" },
  { id: "education", name: "Education", type: "EXPENSE", color: "#6366f1" },
  { id: "personal-care", name: "Personal Care", type: "EXPENSE", color: "#d946ef" },
  { id: "travel", name: "Travel", type: "EXPENSE", color: "#0ea5e9" },
  { id: "insurance", name: "Insurance", type: "EXPENSE", color: "#64748b" },
  { id: "other-expense", name: "Other Expense", type: "EXPENSE", color: "#78716c" },
];

// Helper to find category color by category name or id
export function getCategoryColor(categoryName: string): string {
  const match = defaultCategories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName.toLowerCase()
  );
  return match?.color || "#6b7280";
}
