import React from "react";
import Link from "next/link";
import { getUserAccounts, getTransaction } from "@/actions/transaction";
import AddTransactionForm from "../_components/add-transaction-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import CreateAccountDrawer from "@/components/create-account-drawer";

interface AddTransactionPageProps {
  searchParams: Promise<{
    edit?: string;
  }>;
}

// Page to add a new transaction or edit an existing one
export default async function AddTransactionPage({
  searchParams,
}: AddTransactionPageProps) {
  // Await async search parameters in Next.js 16
  const { edit: editId } = await searchParams;

  // Fetch user's active accounts
  const accounts = await getUserAccounts();

  // If editing an existing transaction, fetch its details
  let initialData = null;
  if (editId) {
    try {
      initialData = await getTransaction(editId);
    } catch (e) {
      console.error("Could not fetch transaction for editing:", e);
    }
  }

  // If user has not created any accounts yet, prompt them to create an account first
  if (accounts.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center space-y-4">
        <Card className="p-6">
          <CardContent className="space-y-4 pt-4">
            <PlusCircle className="h-12 w-12 text-purple-600 mx-auto" />
            <h2 className="text-xl font-bold">No Accounts Found</h2>
            <p className="text-sm text-muted-foreground">
              You need to create at least one bank or cash account before you can log transactions.
            </p>
            <CreateAccountDrawer>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                Create First Account
              </Button>
            </CreateAccountDrawer>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6">
      <AddTransactionForm
        accounts={accounts}
        editId={editId}
        initialData={initialData}
      />
    </div>
  );
}
