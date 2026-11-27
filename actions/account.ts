"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Fetches an account and its transactions for the logged-in user
export async function getAccountWithTransactions(accountId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const account = await db.account.findUnique({
    where: {
      id: accountId,
      userId: user.id,
    },
    include: {
      Transaction: {
        orderBy: { date: "desc" },
      },
      _count: {
        select: {
          Transaction: true,
        },
      },
    },
  });

  // If account does not exist or belongs to another user, return null
  if (!account) return null;

  // Convert Decimal balance to regular number for client components
  return {
    ...account,
    balance: account.balance.toNumber(),
    transactions: account.Transaction,
  };
}

// Deletes multiple transactions and restores the account balance
export async function bulkDeleteTransactions(transactionIds: string[]) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Fetch the transactions to calculate balance changes
    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    // Calculate how much the account balance should change
    // If expense deleted: add money back. If income deleted: subtract money.
    const accountBalanceChanges = transactions.reduce((acc: Record<string, number>, transaction) => {
      const change = transaction.type === "EXPENSE" ? transaction.amount : -transaction.amount;
      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
      return acc;
    }, {});

    // Run delete and balance updates together safely in a database transaction
    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    });

    // Revalidate dashboard and account paths so UI updates immediately
    revalidatePath("/dashboard");
    revalidatePath(`/account/${transactions[0]?.accountId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
