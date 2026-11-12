"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import { updateDefaultAccount } from "@/actions/dashboard";

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    type: string;
    balance: number;
    isDefault: boolean;
    _count?: {
      Transaction: number;
    };
  };
}

// Card displaying an individual account's balance, type, and default status
export default function AccountCard({ account }: AccountCardProps) {
  const { name, type, balance, id, isDefault } = account;

  // Server action hook to change the default account
  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  // Toggle default account handler
  const handleDefaultChange = async (event: React.MouseEvent) => {
    event.preventDefault(); // Prevents navigating to the account detail page

    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return;
    }

    await updateDefaultFn(id);
  };

  // Toast alert when default account is updated
  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          {/* Account name */}
          <CardTitle className="text-sm font-medium capitalize">
            {name}
          </CardTitle>

          {/* Switch to mark as default account */}
          <div
            onClick={handleDefaultChange}
            className="flex items-center space-x-2"
          >
            <Switch
              checked={isDefault}
              disabled={updateDefaultLoading}
              aria-label="Set as default account"
            />
          </div>
        </CardHeader>

        <CardContent>
          {/* Current balance */}
          <div className="text-2xl font-bold">
            ${parseFloat(balance.toString()).toFixed(2)}
          </div>
          {/* Account type tag */}
          <p className="text-xs text-muted-foreground capitalize mt-1">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>

        <CardFooter className="flex justify-between text-sm text-muted-foreground pt-0">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}

