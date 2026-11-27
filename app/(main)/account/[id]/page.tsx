import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { BarLoader } from "react-spinners";

import { getAccountWithTransactions } from "@/actions/account";
import AccountChart from "./_components/account-chart";
import TransactionTable from "./_components/transaction-table";

interface AccountPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Account details page displaying balance header, analytics chart, and transaction list
export default async function AccountPage({ params }: AccountPageProps) {
  // Await params as required in Next.js 15+
  const { id } = await params;

  // Fetch account data and transactions from the database
  const accountData = await getAccountWithTransactions(id);

  // If the account doesn't exist or isn't owned by this user, show 404
  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;

  return (
    <div className="space-y-8 px-5">
      {/* Account Header: Shows account name, type, and current balance */}
      <div className="flex gap-4 items-end justify-between">
        <div>
          {/* Account name */}
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight capitalize bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {account.name}
          </h1>
          {/* Account type label */}
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
          </p>
        </div>

        {/* Right side: Total balance and transaction count */}
        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            ${account.balance.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {account._count?.Transaction || transactions.length} Transactions
          </p>
        </div>
      </div>

      {/* Chart Section: Visualizes spending trends over selected time ranges */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Transactions Section: Interactive table with search, sorting, filtering, and delete */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}
