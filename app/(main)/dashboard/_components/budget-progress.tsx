"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Pencil, X } from "lucide-react";
import { updateBudget } from "@/actions/budget";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

interface BudgetProgressProps {
  initialBudget?: number | null;
  currentExpenses?: number;
}

// Interactive card that lets users view and update their monthly budget
export default function BudgetProgress({
  initialBudget,
  currentExpenses = 0,
}: BudgetProgressProps) {
  // Local state for editing budget amount directly on the card
  const [isEditing, setIsEditing] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(
    initialBudget ? initialBudget.toString() : ""
  );
  const [activeBudget, setActiveBudget] = useState<number | null>(
    initialBudget ?? null
  );

  // Hook to call the update budget server action
  const { loading: isUpdating, fn: updateBudgetFn } = useFetch(updateBudget);

  // Calculate spending percentage
  const percentUsed = activeBudget
    ? Math.min((currentExpenses / activeBudget) * 100, 100)
    : 0;

  // Save the updated budget to the database
  const handleSaveBudget = async () => {
    const parsed = parseFloat(budgetAmount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    const result = await updateBudgetFn(parsed);
    if (result?.success) {
      setActiveBudget(parsed);
      setIsEditing(false);
      toast.success("Monthly budget updated successfully!");
    }
  };

  // Cancel edit mode and revert back to current budget
  const handleCancel = () => {
    setBudgetAmount(activeBudget ? activeBudget.toString() : "");
    setIsEditing(false);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              Monthly Spending Budget
            </CardTitle>
            {activeBudget && percentUsed >= 100 && (
              <Badge variant="destructive" className="text-xs">
                Budget Exceeded
              </Badge>
            )}
            {activeBudget && percentUsed >= 80 && percentUsed < 100 && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                Approaching Limit
              </Badge>
            )}
          </div>

          {/* Budget status or inline edit input */}
          <div className="text-sm text-muted-foreground mt-1">
            {isEditing ? (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-foreground font-medium">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="Enter budget (e.g. 1000)"
                  className="w-36 h-8 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSaveBudget}
                  disabled={isUpdating}
                  className="h-8 px-2.5 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="h-8 px-2.5"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span>
                  {activeBudget
                    ? `$${currentExpenses.toFixed(2)} of $${activeBudget.toFixed(2)} spent`
                    : "No monthly budget set yet"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {activeBudget ? (
          <>
            <Progress
              value={percentUsed}
              className={`h-2.5 ${
                percentUsed >= 100
                  ? "[&>div]:bg-red-500"
                  : percentUsed >= 80
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-purple-600"
              }`}
            />
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>{percentUsed.toFixed(1)}% of budget used</span>
              <span>
                {activeBudget > currentExpenses
                  ? `$${(activeBudget - currentExpenses).toFixed(2)} remaining`
                  : `$${(currentExpenses - activeBudget).toFixed(2)} over budget`}
              </span>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md flex justify-between items-center">
            <span>Set a monthly limit to monitor your spending habits.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 text-xs"
            >
              Set Budget
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
