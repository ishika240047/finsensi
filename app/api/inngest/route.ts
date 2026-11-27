import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processRecurringTransactions,
  checkBudgetAlerts,
  generateMonthlyReports,
} from "@/lib/inngest/functions";

// API handler that connects Inngest to trigger recurring crons and background automation
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processRecurringTransactions,
    checkBudgetAlerts,
    generateMonthlyReports,
  ],
});
