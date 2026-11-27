"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Fetches the user's monthly budget and calculates current month's total expenses
export async function getCurrentBudget(accountId?: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Fetch user's saved budget
    const budget = await db.budget.findFirst({
      where: { userId: user.id },
    });

    // Calculate start and end date for current calendar month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Sum all expenses incurred during this month
    const expenseQuery: any = {
      userId: user.id,
      type: "EXPENSE",
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };

    if (accountId) {
      expenseQuery.accountId = accountId;
    }

    const expenses = await db.transaction.aggregate({
      where: expenseQuery,
      _sum: {
        amount: true,
      },
    });

    const currentExpenses = expenses._sum.amount || 0;

    return {
      budget: budget ? { ...budget } : null,
      currentExpenses,
    };
  } catch (error: any) {
    console.error("Error fetching budget:", error);
    throw new Error(error.message);
  }
}

// Updates or creates the user's monthly spending budget
export async function updateBudget(amount: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    if (isNaN(amount) || amount <= 0) {
      throw new Error("Budget amount must be a positive number");
    }

    // Check if a budget record already exists for this user
    const existingBudget = await db.budget.findFirst({
      where: { userId: user.id },
    });

    let budget;
    if (existingBudget) {
      // Update existing budget amount
      budget = await db.budget.update({
        where: { id: existingBudget.id },
        data: { amount },
      });
    } else {
      // Create new budget record
      budget = await db.budget.create({
        data: {
          userId: user.id,
          amount,
        },
      });
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      data: { ...budget },
    };
  } catch (error: any) {
    console.error("Error updating budget:", error);
    throw new Error(error.message);
  }
}
