import React, { Suspense } from "react";
import Link from "next/link";
import { Plus, ReceiptText, ArrowRight } from "lucide-react";

import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreateAccountDrawer from "@/components/create-account-drawer";
import AccountCard from "./_components/account-card";
import BudgetProgress from "./_components/budget-progress";
import DashboardOverview from "./_components/dashboard-overview";
import { format } from "date-fns";

// Main dashboard page showing financial summaries, bank accounts, and recent transactions
export default async function DashboardPage() {
  // Fetch user accounts and recent transactions
  const { accounts, transactions } = await getDashboardData();

  // Fetch monthly budget and current month expenses
  const budgetData = await getCurrentBudget();

  return (
    <div className="space-y-8">
      {/* Action buttons header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your finances, monitor your monthly budget, and manage bank accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/transaction/create">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Budget Progress: Shows budget limit and percentage spent */}
      <BudgetProgress
        initialBudget={budgetData.budget?.amount ?? null}
        currentExpenses={budgetData.currentExpenses}
      />

      {/* 2. Overview: Summary cards for total balance, income, and expenses */}
      <DashboardOverview accounts={accounts} transactions={transactions} />

      {/* 3. Accounts Grid: "Add New Account" drawer card + cards for each active account */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Your Accounts</h2>
        </div>
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

      {/* 4. Recent Transactions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest transactions across all your connected accounts
            </p>
          </div>
          {accounts.length > 0 && (
            <Link href={`/account/${accounts[0].id}`}>
              <Button variant="ghost" size="sm" className="text-xs text-purple-600">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ReceiptText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm">No transactions logged yet.</p>
              <Link href="/transaction/create" className="inline-block mt-3">
                <Button size="sm" variant="outline">
                  Create your first transaction
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.slice(0, 5).map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {transaction.description || transaction.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(transaction.date), "MMM d, yyyy")} •{" "}
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        {transaction.category}
                      </Badge>
                    </span>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      transaction.type === "INCOME"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}$
                    {transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
