"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface BudgetProgressProps {
  initialBudget?: number | null;
  currentExpenses?: number;
}

// Progress bar card showing monthly budget vs expenses
export default function BudgetProgress({
  initialBudget,
  currentExpenses = 0,
}: BudgetProgressProps) {
  // Calculate percentage used
  const percentUsed = initialBudget
    ? Math.min((currentExpenses / initialBudget) * 100, 100)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle>Monthly Budget (Default Account)</CardTitle>
          <div className="text-sm text-muted-foreground mt-1">
            {initialBudget
              ? `$${currentExpenses.toFixed(2)} of $${initialBudget.toFixed(2)} spent`
              : "No budget set for this account"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {initialBudget && (
          <>
            <Progress value={percentUsed} />
            <p className="text-xs text-muted-foreground text-right">
              {percentUsed.toFixed(1)}% used
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

