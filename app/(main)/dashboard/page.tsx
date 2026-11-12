import React from "react";
import { Plus } from "lucide-react";

import { getUserAccounts } from "@/actions/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import CreateAccountDrawer from "@/components/create-account-drawer";
import AccountCard from "./_components/account-card";
import BudgetProgress from "./_components/budget-progress";
import DashboardOverview from "./_components/dashboard-overview";

// Main dashboard page showing financial summaries and bank accounts
export default async function DashboardPage() {
  // Fetch user accounts from PostgreSQL
  const accounts = await getUserAccounts();

  // Find the primary/default account for budget tracking
  const defaultAccount = accounts?.find((account) => account.isDefault);

  return (
    <div className="space-y-8">
      {/* 1. Budget Progress: Shows budget limit and percentage spent */}
      <BudgetProgress
        initialBudget={defaultAccount ? 1000 : null} // Placeholder until budget action is added
        currentExpenses={250}
      />

      {/* 2. Overview: Summary cards for total balance, income, and expenses */}
      <DashboardOverview accounts={accounts} transactions={[]} />

      {/* 3. Accounts Grid: "Add New Account" drawer card + cards for each active account */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card trigger to open the Create Account drawer */}
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 h-full min-h-[160px]">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full py-8">
              <Plus className="h-10 w-10 mb-2 text-purple-700" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {/* Existing account cards */}
        {accounts.length > 0 &&
          accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
}
