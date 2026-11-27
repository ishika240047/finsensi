"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TransactionInput } from "@/lib/schema";

// Helper: converts Prisma Decimal and date objects to plain JS objects
function serializeTransaction(transaction: any) {
  return {
    ...transaction,
    amount:
      typeof transaction.amount?.toNumber === "function"
        ? transaction.amount.toNumber()
        : transaction.amount,
  };
}

// Calculates the next date a recurring bill or paycheck is scheduled to run
function calculateNextRecurringDate(startDate: Date, interval: string): Date {
  const next = new Date(startDate);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

// Saves a new income or expense transaction and adjusts the account balance
export async function createTransaction(data: TransactionInput) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Make sure the selected account belongs to this user
    const account = await db.account.findUnique({
      where: { id: data.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found");

    const amountFloat = parseFloat(data.amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      throw new Error("Please enter a valid amount greater than zero");
    }

    // Income adds to the bank balance, expenses deduct from it
    const balanceChange = data.type === "INCOME" ? amountFloat : -amountFloat;

    // Use a database transaction so transaction save and balance update happen together safely
    const [transaction] = await db.$transaction([
      db.transaction.create({
        data: {
          type: data.type,
          amount: amountFloat,
          description: data.description || "",
          date: new Date(data.date),
          category: data.category,
          accountId: data.accountId,
          userId: user.id,
          isRecurring: data.isRecurring,
          recurringInterval: data.recurringInterval || null,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(new Date(data.date), data.recurringInterval)
              : null,
        },
      }),
      db.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeTransaction(transaction) };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Fetches all accounts owned by the user for the dropdown menu
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
  });

  return accounts.map((account) => ({
    ...account,
    balance: account.balance.toNumber(),
  }));
}

// Reads receipt image with Google Gemini AI and extracts transaction details
export async function scanReceipt(file: FormData) {
  try {
    const fileItem = file.get("file") as File;
    if (!fileItem) {
      throw new Error("No receipt file provided");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured in your .env file. Please add your Gemini key to use AI receipt scanning."
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert uploaded image file to base64
    const bytes = await fileItem.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following financial details.
      Return ONLY a pure JSON object without markdown fences, code blocks, or any surrounding text.
      JSON format:
      {
        "amount": 25.50,
        "date": "2026-11-27",
        "description": "Store or merchant name",
        "category": "One of: Groceries, Food & Dining, Shopping, Transportation, Utilities, Healthcare, Entertainment, Other Expense"
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: fileItem.type || "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text().trim();
    // Clean any markdown code blocks if present
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    return {
      amount: parsedData.amount ? parsedData.amount.toString() : "",
      date: parsedData.date ? new Date(parsedData.date) : new Date(),
      description: parsedData.description || "",
      category: parsedData.category || "Shopping",
    };
  } catch (error: any) {
    console.error("AI receipt scan error:", error);
    throw new Error(error.message || "Failed to parse receipt with AI");
  }
}

// Fetches a single transaction by ID to support editing
export async function getTransaction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: { id, userId: user.id },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeTransaction(transaction);
}

// Updates an existing transaction and recalculates the account balance accordingly
export async function updateTransaction(id: string, data: TransactionInput) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const existing = await db.transaction.findUnique({
      where: { id, userId: user.id },
    });
    if (!existing) throw new Error("Transaction not found");

    const newAmount = parseFloat(data.amount);
    const oldAmount = existing.amount;

    // Calculate how the balance should change after reversing the old transaction and applying the new one
    let balanceDifference = 0;
    const oldImpact = existing.type === "INCOME" ? oldAmount : -oldAmount;
    const newImpact = data.type === "INCOME" ? newAmount : -newAmount;
    balanceDifference = newImpact - oldImpact;

    const [updated] = await db.$transaction([
      db.transaction.update({
        where: { id },
        data: {
          type: data.type,
          amount: newAmount,
          description: data.description || "",
          date: new Date(data.date),
          category: data.category,
          accountId: data.accountId,
          isRecurring: data.isRecurring,
          recurringInterval: data.recurringInterval || null,
        },
      }),
      db.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: balanceDifference,
          },
        },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeTransaction(updated) };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
