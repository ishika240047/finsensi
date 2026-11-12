"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

interface DashboardOverviewProps {
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
    isDefault: boolean;
  }>;
  transactions?: any[];
}

// Financial overview cards displaying total balance, income, and expenses
export default function DashboardOverview({
  accounts,
  transactions = [],
}: DashboardOverviewProps) {
  // Total balance sum across all user accounts
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {accounts.length} active account{accounts.length === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      {/* Income Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            $
            {transactions
              .filter((t) => t.type === "INCOME")
              .reduce((sum, t) => sum + (t.amount || 0), 0)
              .toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </CardContent>
      </Card>

      {/* Expense Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            $
            {transactions
              .filter((t) => t.type === "EXPENSE")
              .reduce((sum, t) => sum + (t.amount || 0), 0)
              .toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </CardContent>
      </Card>
    </div>
  );
}

