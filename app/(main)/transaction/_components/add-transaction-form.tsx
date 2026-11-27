"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { transactionSchema, TransactionInput } from "@/lib/schema";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { defaultCategories, Category } from "@/data/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReceiptScanner from "./receipt-scanner";

interface AddTransactionFormProps {
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
    isDefault: boolean;
  }>;
  editId?: string;
  initialData?: any;
}

// Complete form to create or edit an income/expense transaction with AI receipt scanning
export default function AddTransactionForm({
  accounts,
  editId,
  initialData,
}: AddTransactionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pick default account if user has one
  const defaultAccountId =
    initialData?.accountId ||
    accounts.find((acc) => acc.isDefault)?.id ||
    accounts[0]?.id ||
    "";

  // Form setup using react-hook-form and Zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: initialData?.type || "EXPENSE",
      amount: initialData?.amount ? initialData.amount.toString() : "",
      description: initialData?.description || "",
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      accountId: defaultAccountId,
      category: initialData?.category || "Groceries",
      isRecurring: initialData?.isRecurring || false,
      recurringInterval: initialData?.recurringInterval || "MONTHLY",
    },
  });

  // Watch dynamic form fields
  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const selectedAccountId = watch("accountId");
  const selectedCategory = watch("category");
  const selectedDate = watch("date");
  const recurringInterval = watch("recurringInterval");

  // Filter category list based on whether user is logging Income or Expense
  const filteredCategories = defaultCategories.filter(
    (cat) => cat.type === type
  );

  // Set default category when user toggles between Income and Expense
  useEffect(() => {
    if (type === "INCOME") {
      setValue("category", "Salary");
    } else {
      setValue("category", "Groceries");
    }
  }, [type, setValue]);

  // Handle data returned from the Gemini AI receipt scanner
  const handleScanComplete = (extracted: {
    amount: string;
    date: Date;
    description: string;
    category: string;
  }) => {
    setValue("type", "EXPENSE");
    if (extracted.amount) setValue("amount", extracted.amount);
    if (extracted.date) setValue("date", extracted.date);
    if (extracted.description) setValue("description", extracted.description);
    if (extracted.category) setValue("category", extracted.category);
  };

  // Submit form handler
  const onSubmit = async (values: TransactionInput) => {
    try {
      setIsSubmitting(true);

      if (editId) {
        // Edit existing transaction
        await updateTransaction(editId, values);
        toast.success("Transaction updated successfully!");
      } else {
        // Create brand new transaction
        await createTransaction(values);
        toast.success("Transaction recorded successfully!");
      }

      // Redirect user to the account page to see their new transaction
      router.push(`/account/${values.accountId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Transaction save error:", error);
      toast.error(error.message || "Failed to record transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top back button */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {editId ? "Edit Transaction" : "Add Transaction"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log an expense or income transaction manually or let AI scan your receipt.
        </p>
      </div>

      {/* AI Receipt Scanner card */}
      {!editId && <ReceiptScanner onScanComplete={handleScanComplete} />}

      {/* Main transaction form card */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card border rounded-xl p-5 sm:p-7 shadow-sm space-y-6"
      >
        {/* 1. Transaction Type Toggle (Expense vs Income) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Transaction Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("type", "EXPENSE")}
              className={`py-2.5 px-4 rounded-lg font-medium text-sm transition-all border ${
                type === "EXPENSE"
                  ? "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 font-semibold"
                  : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setValue("type", "INCOME")}
              className={`py-2.5 px-4 rounded-lg font-medium text-sm transition-all border ${
                type === "INCOME"
                  ? "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400 font-semibold"
                  : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* 2. Amount and Account Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="pl-7"
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Account selector dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Account <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedAccountId}
              onValueChange={(val) => {
                if (val) setValue("accountId", val);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (${account.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-xs text-red-500">{errors.accountId.message}</p>
            )}
          </div>
        </div>

        {/* 3. Category and Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                if (val) setValue("category", val);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-500">{errors.category.message}</p>
            )}
          </div>

          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={
                selectedDate instanceof Date && !isNaN(selectedDate.getTime())
                  ? selectedDate.toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0]
              }
              onChange={(e) => {
                const dateVal = e.target.value ? new Date(e.target.value) : new Date();
                setValue("date", dateVal);
              }}
            />
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date.message}</p>
            )}
          </div>
        </div>

        {/* 4. Description input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <Input
            placeholder="e.g. Weekly grocery run, Client payment, Netflix"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* 5. Recurring Transaction switch */}
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Recurring Transaction</p>
              <p className="text-xs text-muted-foreground">
                Automatically log this transaction on a recurring schedule
              </p>
            </div>
            <Switch
              checked={isRecurring}
              onCheckedChange={(checked) => setValue("isRecurring", checked)}
            />
          </div>

          {/* Recurring interval selector dropdown */}
          {isRecurring && (
            <div className="pt-2 border-t space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Recurring Frequency
              </label>
              <Select
                value={recurringInterval || "MONTHLY"}
                onValueChange={(val: any) => {
                  if (val) setValue("recurringInterval", val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* 6. Form action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/dashboard">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : editId ? (
              "Save Changes"
            ) : (
              "Create Transaction"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
