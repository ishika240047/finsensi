"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/use-fetch";
import { bulkDeleteTransactions } from "@/actions/account";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date | string;
  category: string;
  description: string;
  isRecurring: boolean;
  recurringInterval?: string | null;
  status: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const ITEMS_PER_PAGE = 10;

// Interactive table displaying account transactions with search, sorting, filtering, and bulk delete
export default function TransactionTable({ transactions }: TransactionTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ field: "date" | "amount"; direction: "asc" | "desc" }>({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [recurringFilter, setRecurringFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Hook for bulk deleting selected transactions
  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deletedResult,
  } = useFetch(bulkDeleteTransactions);

  // Filter and sort transactions based on user inputs
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Search by description or category
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(searchLower) ||
          t.category?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by Income / Expense
    if (typeFilter !== "ALL") {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Filter by recurring status
    if (recurringFilter !== "ALL") {
      result = result.filter((t) =>
        recurringFilter === "RECURRING" ? t.isRecurring : !t.isRecurring
      );
    }

    // Sort by Date or Amount
    result.sort((a, b) => {
      let comparison = 0;
      if (sortConfig.field === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortConfig.field === "amount") {
        comparison = a.amount - b.amount;
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  // Paginate transactions
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedTransactions, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, recurringFilter]);

  // Select all checkboxes handler
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTransactions.map((t) => t.id));
    }
  };

  // Toggle individual row checkbox
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sort toggle handler
  const handleSort = (field: "date" | "amount") => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Bulk delete execution
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} transactions?`)) {
      return;
    }
    await deleteFn(selectedIds);
  };

  // Clear all active filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setRecurringFilter("ALL");
  };

  // Toast feedback and clearing selections after deletion
  useEffect(() => {
    if (deletedResult?.success) {
      toast.success("Transactions deleted successfully");
      setSelectedIds([]);
    }
  }, [deletedResult]);

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters and Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Type filter */}
          <Select
            value={typeFilter}
            onValueChange={(val) => {
              if (val) setTypeFilter(val);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          {/* Recurring filter */}
          <Select
            value={recurringFilter}
            onValueChange={(val) => {
              if (val) setRecurringFilter(val);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Transactions</SelectItem>
              <SelectItem value="RECURRING">Recurring Only</SelectItem>
              <SelectItem value="NON_RECURRING">Non-recurring</SelectItem>
            </SelectContent>
          </Select>

          {/* Bulk delete button */}
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleteLoading}
            >
              <Trash className="h-4 w-4 mr-1" />
              Delete ({selectedIds.length})
            </Button>
          )}

          {/* Clear filters button */}
          {(searchTerm || typeFilter !== "ALL" || recurringFilter !== "ALL") && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Transaction List Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Select all checkbox */}
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    paginatedTransactions.length > 0 &&
                    selectedIds.length === paginatedTransactions.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {/* Sortable Date column */}
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              {/* Sortable Amount column */}
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end">
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  {/* Select row checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(transaction.id)}
                      onCheckedChange={() => handleSelectRow(transaction.id)}
                    />
                  </TableCell>
                  {/* Formatted Date */}
                  <TableCell className="font-medium">
                    {format(new Date(transaction.date), "PP")}
                  </TableCell>
                  {/* Description */}
                  <TableCell>{transaction.description}</TableCell>
                  {/* Category pill */}
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {transaction.category}
                    </Badge>
                  </TableCell>
                  {/* Amount with green / red indicator */}
                  <TableCell
                    className={`text-right font-semibold ${
                      transaction.type === "EXPENSE" ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}
                    ${transaction.amount.toFixed(2)}
                  </TableCell>
                  {/* Recurring badge */}
                  <TableCell>
                    {transaction.isRecurring ? (
                      <Badge variant="secondary" className="gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        {transaction.recurringInterval}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">One-time</span>
                    )}
                  </TableCell>
                  {/* Actions dropdown */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(`/transaction/create?edit=${transaction.id}`)
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive cursor-pointer"
                          onClick={() => deleteFn([transaction.id])}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredAndSortedTransactions.length} transactions)
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
