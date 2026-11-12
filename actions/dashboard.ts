"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AccountInput } from "@/lib/schema";

// Internal helper: Converts Prisma Decimal values to regular numbers so Next.js can send them to client components
const serializeTransaction = (obj: any) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = typeof obj.amount.toNumber === "function" ? obj.amount.toNumber() : obj.amount;
  }
  return serialized;
};

// Creates a new financial account for the logged-in user
export async function createAccount(data: AccountInput) {
  try {
    // 1. Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // 2. Find matching user in our database
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // 3. Convert string balance from the form to a valid float number
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // 4. Check existing accounts to see if this is the user's first account
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    // If first account, force it to be default. Otherwise, use user selection.
    const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;

    // 5. If this new account is set as default, remove default flag from previous accounts
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // 6. Create the account record in PostgreSQL
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    // 7. Serialize the Decimal balance to a number for Next.js client components
    const serializedAccount = serializeTransaction(account);

    // Refresh the dashboard to show the newly created account card immediately
    revalidatePath("/dashboard");

    return { success: true, data: serializedAccount };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Fetches all accounts owned by the logged-in user
export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          Transaction: true,
        },
      },
    },
  });

  // Convert Decimal balances to JavaScript numbers
  return accounts.map(serializeTransaction);
}

// Sets an account as the user's primary default account
export async function updateDefaultAccount(accountId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Remove default status from all existing accounts
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    // Set the selected account as default
    const account = await db.account.update({
      where: { id: accountId, userId: user.id },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");
    return { success: true, data: serializeTransaction(account) };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
