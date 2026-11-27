import { inngest } from "./client";
import { db } from "@/lib/prisma";
import { Resend } from "resend";

// Helper: Calculates the next due date for a recurring transaction
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

// 1. Daily Cron: Automatically processes due recurring expenses and deposits
export const processRecurringTransactions = inngest.createFunction(
  {
    id: "process-recurring-transactions",
    name: "Process Recurring Transactions",
    triggers: [{ cron: "0 0 * * *" }], // Runs every night at 12:00 AM midnight
  },
  async ({ step }: any) => {
    // Step 1: Find all active recurring transactions that are due today
    const dueTransactions = await step.run("fetch-due-transactions", async () => {
      return await db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          OR: [
            { nextRecurringDate: { lte: new Date() } },
            { nextRecurringDate: null },
          ],
        },
        include: {
          account: true,
        },
      });
    });

    if (dueTransactions.length === 0) {
      return { message: "No recurring transactions due today" };
    }

    // Step 2: Process each due transaction and update the account balance
    for (const transaction of dueTransactions) {
      await step.run(`process-transaction-${transaction.id}`, async () => {
        const interval = transaction.recurringInterval || "MONTHLY";
        const nextDate = calculateNextRecurringDate(new Date(), interval);
        const amountFloat = transaction.amount;
        const balanceChange = transaction.type === "INCOME" ? amountFloat : -amountFloat;

        // Create transaction clone for the new period and update account balance
        await db.$transaction([
          db.transaction.create({
            data: {
              type: transaction.type,
              amount: transaction.amount,
              description: `${transaction.description} (Recurring)`,
              date: new Date(),
              category: transaction.category,
              accountId: transaction.accountId,
              userId: transaction.userId,
              isRecurring: false, // Individual logged instance is not recurring itself
            },
          }),
          db.account.update({
            where: { id: transaction.accountId },
            data: {
              balance: {
                increment: balanceChange,
              },
            },
          }),
          db.transaction.update({
            where: { id: transaction.id },
            data: {
              lastProcessedDate: new Date(),
              nextRecurringDate: nextDate,
            },
          }),
        ]);
      });
    }

    return { processedCount: dueTransactions.length };
  }
);

// 2. Daily Budget Alert Check: Sends an email if user spending exceeds 80% or 100% of their monthly budget
export const checkBudgetAlerts = inngest.createFunction(
  {
    id: "check-budget-alerts",
    name: "Check Budget Alerts",
    triggers: [{ cron: "0 8 * * *" }], // Runs every morning at 8:00 AM
  },
  async ({ step }: any) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({
        include: {
          user: true,
        },
      });
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    for (const budget of budgets) {
      await step.run(`check-user-budget-${budget.userId}`, async () => {
        // Calculate user expenses this calendar month
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            type: "EXPENSE",
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalSpent = expenses._sum.amount || 0;
        const percentageUsed = (totalSpent / budget.amount) * 100;

        // Send alert if user has spent 80% or more, and we haven't alerted them this month
        const shouldSendAlert =
          percentageUsed >= 80 &&
          (!budget.lastAlertSent || new Date(budget.lastAlertSent) < startOfMonth);

        if (shouldSendAlert && budget.user?.email) {
          const resendApiKey = process.env.RESEND_API_KEY;
          if (resendApiKey) {
            const resend = new Resend(resendApiKey);
            await resend.emails.send({
              from: "FinSensi Alerts <alerts@finsensi.com>",
              to: budget.user.email,
              subject: `⚠️ Budget Alert: You have used ${percentageUsed.toFixed(0)}% of your monthly budget`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <h2 style="color: #7c3aed;">FinSensi Budget Alert</h2>
                  <p>Hello ${budget.user.name || "there"},</p>
                  <p>You have spent <strong>$${totalSpent.toFixed(2)}</strong> out of your <strong>$${budget.amount.toFixed(2)}</strong> monthly limit (${percentageUsed.toFixed(1)}% used).</p>
                  <div style="background-color: ${percentageUsed >= 100 ? "#fee2e2" : "#fef3c7"}; padding: 12px; border-radius: 6px; margin: 16px 0;">
                    <p style="margin: 0; color: ${percentageUsed >= 100 ? "#991b1b" : "#92400e"}; font-weight: bold;">
                      ${percentageUsed >= 100 ? "🚨 You have exceeded your monthly budget." : "⚠️ You are approaching your monthly spending limit."}
                    </p>
                  </div>
                  <p>Log in to your FinSensi dashboard to review your recent expenses and stay on track.</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Dashboard</a>
                </div>
              `,
            });
          }

          // Mark alert as sent so the user is not spammed repeatedly
          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }

    return { processedBudgets: budgets.length };
  }
);

// 3. Monthly Financial Summary: Sends a summary report on the 1st of every month
export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
    triggers: [{ cron: "0 0 1 * *" }], // Runs at 12:00 AM on the 1st of every month
  },
  async ({ step }: any) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany();
    });

    // Calculate dates for the month that just ended
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    for (const user of users) {
      await step.run(`send-monthly-report-${user.id}`, async () => {
        const lastMonthTransactions = await db.transaction.findMany({
          where: {
            userId: user.id,
            date: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
        });

        const totalIncome = lastMonthTransactions
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = lastMonthTransactions
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + t.amount, 0);

        const netSavings = totalIncome - totalExpenses;

        if (user.email && process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "FinSensi Reports <reports@finsensi.com>",
            to: user.email,
            subject: `📊 Your Monthly Financial Report from FinSensi`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #7c3aed;">Monthly Financial Summary</h2>
                <p>Here is how your finances looked last month:</p>
                <ul>
                  <li><strong>Total Income:</strong> $${totalIncome.toFixed(2)}</li>
                  <li><strong>Total Expenses:</strong> $${totalExpenses.toFixed(2)}</li>
                  <li><strong>Net Savings:</strong> $${netSavings.toFixed(2)}</li>
                </ul>
                <p>Keep up the great financial habits with FinSensi!</p>
              </div>
            `,
          });
        }
      });
    }

    return { processedUsers: users.length };
  }
);
