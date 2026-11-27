"use client";

import React, { useRef, useState } from "react";
import { Camera, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scanReceipt } from "@/actions/transaction";
import { toast } from "sonner";

interface ReceiptScannerProps {
  onScanComplete: (data: {
    amount: string;
    date: Date;
    description: string;
    category: string;
  }) => void;
}

// AI receipt scanner that uses Google Gemini to read receipt images and auto-fill the form
export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handles receipt image upload and triggers Gemini AI analysis
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Receipt image must be smaller than 5MB");
      return;
    }

    try {
      setIsScanning(true);
      toast.info("Gemini AI is analyzing your receipt...");

      const formData = new FormData();
      formData.append("file", file);

      const result = await scanReceipt(formData);

      if (result) {
        onScanComplete({
          amount: result.amount,
          date: new Date(result.date),
          description: result.description,
          category: result.category,
        });
        toast.success("Receipt scanned successfully! Review the extracted details.");
      }
    } catch (error: any) {
      console.error("Receipt scanning error:", error);
      toast.error(error.message || "Failed to scan receipt. Please enter details manually.");
    } finally {
      setIsScanning(false);
      // Reset file input so user can scan another if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-900/50 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
            AI Receipt Scanner
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload a receipt or invoice to automatically fill out amount, date, merchant, and category.
          </p>
        </div>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isScanning}
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium w-full sm:w-auto"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning with AI...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Scan Receipt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
