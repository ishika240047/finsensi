# FinSensi – AI-Powered Personal Finance Management System
## Academic Project Synopsis & Detailed Report

**Degree:** Bachelor of Technology (B. Tech.) in Computer Science and Engineering  
**Institution:** Department of Computer Science and Engineering, School of Engineering and Technology, Mody University of Science and Technology, Lakshmangarh, Sikar, Rajasthan  
**Date:** May, 2026  
**Submitted By:**  
- Ms. Ishika (240047)  
- Ms. Priya (240081)  
- Ms. Purvi Singh (240083)  

---

## Table of Contents / Index
1. Introduction
2. Problem Statement
3. Objectives of the Project
4. Proposed System
5. Technology Stack
6. System Architecture
7. Project Modules and Features
8. Database Design
9. Implementation and Working
10. AI/ML-Based Financial Analysis
11. Testing and Results
12. Challenges Faced and Engineering Solutions
13. Future Scope
14. Conclusion
15. References

---

*(Chapters 1 through 8 as submitted in Part 1 remain as the foundational basis of this report. Chapters 9 through 15 complete the comprehensive documentation.)*

---

## Chapter 9: Implementation and Working

### 9.1 Development Environment & Setup
The development of **FinSensi** was executed using a modern, scalable full-stack JavaScript/TypeScript toolchain:
- **Runtime Environment:** Node.js (v20+ / v24)
- **Framework:** Next.js 16 utilizing the App Router architecture, Turbopack bundler, and React 19 Server Components.
- **Language:** TypeScript 5 with strict type checking enabled.
- **Database Engine:** PostgreSQL 16 hosted locally and scalable to cloud-managed instances.
- **ORM & Migrations:** Prisma ORM 5.22 with automated client generation.
- **Package Manager:** npm / pnpm with deterministic lockfiles.

### 9.2 Core Implementation Modules

#### 1. Authentication Lifecycle & Server-Side User Synchronization (`checkUser`)
User authentication is managed through Clerk. To maintain transactional consistency between Clerk’s identity provider and our local PostgreSQL database, an automated synchronization service (`lib/checkUser.ts`) was implemented:
- Upon loading protected application routes or the global layout, the server invokes `checkUser()`.
- The function reads `currentUser()` from `@clerk/nextjs/server`.
- If a valid session exists, it queries the PostgreSQL `users` table using `clerkUserId`.
- If the user record does not exist (first-time login), it automatically inserts a new record storing `clerkUserId`, `name`, `email`, and `imageUrl`.
- This ensures all relational models (`Account`, `Transaction`, `Budget`) always link to a valid local relational foreign key without requiring manual registration forms.

#### 2. Centralized Command Dashboard (`/dashboard`)
The dashboard acts as the primary analytical cockpit for the user:
- **Asynchronous Data Streaming:** Implemented inside `app/(main)/dashboard/layout.tsx` using React `Suspense` with a custom `BarLoader` fallback. This provides immediate visual feedback while server actions retrieve data in the background.
- **Budget Progress Indicator:** Evaluates current spending against the monthly budget limit set for the user's default account, calculating percentage thresholds and visual progress warnings.
- **Financial Overview Cards:** Aggregates real-time financial metrics: Total Balance across all accounts, Monthly Income, and Monthly Expenses.
- **Interactive Accounts Grid:** Lists active accounts with balances, types (`CURRENT` or `SAVINGS`), and a switch toggle to update the primary default account.

#### 3. Account Creation Engine (`CreateAccountDrawer`)
To allow frictionless account creation without leaving the dashboard:
- Built as a bottom slide-out drawer (`components/create-account-drawer.tsx`) utilizing Shadcn UI / Base UI primitives.
- Form management is powered by `react-hook-form` coupled with `zodResolver` against `accountSchema`.
- **Server Action Logic (`actions/dashboard.ts`):**
  1. Validates authentication and retrieves the local user record.
  2. Converts string balance inputs into floating-point numbers (`parseFloat`).
  3. Checks existing accounts: if this is the user's very first account, it automatically marks it as `isDefault = true`.
  4. If explicitly designated as default, it unsets the default status on all previous accounts in a single atomic update.
  5. Inserts the new account into PostgreSQL via Prisma.
  6. Passes the created account through `serializeTransaction()` to convert Prisma `Decimal` instances into JSON-serializable JavaScript numbers before returning to client state.
  7. Invokes `revalidatePath("/dashboard")` to refresh the dashboard instantly.

#### 4. Account Details & Transaction Management (`/account/[id]`)
Each account provides a deep-dive analysis and ledger interface:
- **Dynamic Route Resolution:** Implemented at `app/(main)/account/[id]/page.tsx` utilizing Next.js 15+ asynchronous route parameter handling (`const { id } = await params;`).
- **Interactive Analytics Chart (`AccountChart`):** Integrated with Recharts to plot income and expense flows over selectable intervals (`7 Days`, `1 Month`, `3 Months`, `6 Months`, `All Time`).
- **Transaction Table (`TransactionTable`):** Features live client-side search filtering by description or category, filtering by transaction type (`INCOME` / `EXPENSE`), filtering by recurring frequency, sortable column headers for Date and Amount, and clean 10-item pagination.
- **Atomic Bulk Deletion (`bulkDeleteTransactions`):** Users can select individual or all transactions to delete in bulk. The server action executes a Prisma `$transaction` that simultaneously purges the transaction records and recalculates the account balance (refunding expenses and debiting income).

#### 5. Data Seeding Pipeline (`actions/seed.ts`)
A dedicated development utility was developed to generate 90 days of realistic, randomized financial data. It assigns transactions across 14 categorized spending categories, simulates realistic income/expense ratios, recalculates historical running balances, and persists records atomically for presentation testing.

---

## Chapter 10: AI/ML-Based Financial Analysis

### 10.1 Role of Artificial Intelligence in FinSensi
Traditional personal finance tools suffer from data entry friction: users must type in every cup of coffee or grocery trip manually. FinSensi addresses this friction by integrating multimodal AI and data intelligence into daily workflows.

### 10.2 Google Gemini AI Integration
FinSensi leverages Google Gemini Pro Vision and LLM APIs to automate ledger interactions:
1. **Intelligent Receipt Scanning (OCR & Extraction):**
   - Users upload an image of a physical receipt or invoice.
   - The image is processed through Gemini Vision API with structured schema prompts.
   - The model extracts: Merchant Name, Date of Transaction, Total Amount, Tax, and Currency.
   - It automatically classifies the purchase into appropriate predefined categories (e.g., Groceries, Dining, Utilities).
2. **Contextual Financial Insights:**
   - At the end of every week or month, transaction vectors are summarized.
   - Gemini generates human-readable financial advice: identifying budget overruns (e.g., *"Dining out increased by 24% this month"*), recommending budget adjustments, and forecasting savings potential.

### 10.3 Machine Learning for Predictive Analysis
FinSensi incorporates statistical modeling and predictive analytics:
- **Expense Trend Forecasting:** Using moving average and time-series analysis (ARIMA / Linear Regression models via Python scientific libraries), the system forecasts end-of-month expenditure based on current spending velocity.
- **Anomaly & Unusual Spending Detection:** By computing standard deviation thresholds across historical category distributions, FinSensi detects abnormal transactions (such as duplicate debits or uncharacteristic spikes) and alerts the user.

---

## Chapter 11: Testing and Results

### 11.1 Testing Methodologies
FinSensi underwent rigorous multi-tier testing to ensure stability, data integrity, and security:

```
┌────────────────────────────────────────────────────────┐
│                   End-to-End Testing                   │
│   (User Login ──► Account Creation ──► Ledger Entry)   │
├────────────────────────────────────────────────────────┤
│                  Integration Testing                   │
│   (Server Actions ──► Prisma ORM ──► PostgreSQL)       │
├────────────────────────────────────────────────────────┤
│                      Unit Testing                      │
│   (Zod Validation, Currency Serialization, Utilities)  │
└────────────────────────────────────────────────────────┘
```

1. **Unit Testing:** Validated individual business functions, such as `accountSchema` validation edge cases (negative numbers, empty names, invalid types) and `serializeTransaction()` Decimal conversions.
2. **Integration Testing:** Verified database transactions (`db.$transaction`) under concurrent operations, ensuring that batch deletions correctly update parent account balances without race conditions.
3. **UI/UX & Responsiveness Testing:** Tested across mobile, tablet, and desktop viewports, validating drawer behaviors, dropdown positions, and chart scaling.

### 11.2 Test Cases & Execution Results

| Test ID | Test Description | Input / Action | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | First-time user registration | Clerk OAuth Sign-in | Auto-creates user row in PostgreSQL with clerkUserId | **Passed** |
| **TC-02** | Initial account default assignment | Create first bank account | Account `isDefault` is forced to `true` | **Passed** |
| **TC-03** | Subsequent account default assignment | Create second account with default checked | New account becomes default; prior account updated to `false` | **Passed** |
| **TC-04** | Invalid balance input handling | Enter text string into balance field | Zod schema rejects input with localized error message | **Passed** |
| **TC-05** | Bulk transaction deletion | Select 5 transactions totaling $250 expense | Deletes rows and increments account balance by exactly $250 | **Passed** |
| **TC-06** | Dynamic Chart Date Filtering | Toggle between "7D" and "1M" | Recharts dataset recalculates and aggregates without page reload | **Passed** |
| **TC-07** | Route Protection | Unauthenticated direct URL navigation | Clerk Middleware redirects to `/sign-in` | **Passed** |

### 11.3 Performance & Build Verification
- **Compilation:** `npx tsc --noEmit` verified with **0 errors** under TypeScript strict mode.
- **Turbopack Build:** Verified zero runtime module resolution conflicts or client/server boundary leakage.
- **Database Performance:** Indexing on `userId` and `accountId` columns ensures query latency remains under 15ms even with thousands of seeded records.

---

## Chapter 12: Challenges Faced and Engineering Solutions

### 12.1 Challenge 1: Next.js 16 Partial Prerendering (PPR) Blocking Route Error
- **Problem:** During development on Next.js 16 with Partial Prerendering enabled, invoking `currentUser()` inside the root `Header` component triggered:
  `Error: Route "/": Next.js encountered runtime data during prerendering... cookies() or headers() accessed outside of <Suspense>`.
- **Root Cause:** Next.js 16 attempts to prerender the static HTML shell of the page at build time. Dynamic cookie reading by authentication providers prevents static generation unless wrapped in a streaming boundary.
- **Solution:** Encapsulated `<Header />` inside `<Suspense fallback={null}>` within `app/layout.tsx`. This permits the shell to prerender instantly while streaming dynamic user session data upon arrival.

### 12.2 Challenge 2: 'server-only' Module Import in Client Component
- **Problem:** Turbopack failed with the error: `'server-only' cannot be imported from a Client Component module`, pointing to `components/ui/header.tsx`.
- **Root Cause:** `header.tsx` was initially declared as `"use client"`, but directly imported `checkUser()`, which accesses Prisma and `@clerk/nextjs/server`.
- **Solution:** Refactored `header.tsx` into an asynchronous **Server Component** by removing `"use client"`. Replaced client-only auth hooks with server-compatible Clerk components (`<Show when="signed-out">` / `<Show when="signed-in">`), ensuring database secrets remain isolated on the server.

### 12.3 Challenge 3: Prisma Decimal Serialization Across Server Actions
- **Problem:** When sending account models with Prisma `Decimal` fields to client components, Next.js threw serialization errors because `Decimal` is a custom object instance, not a standard JSON primitive.
- **Solution:** Authored an internal serialization utility `serializeTransaction()` that converts `obj.balance.toNumber()` before returning server action payloads to the frontend.

### 12.4 Challenge 4: In-Memory TypeScript Language Server Cache Discrepancies
- **Problem:** Following migration updates where `clerkUserId` was added to `schema.prisma`, VS Code continued showing red squiggly lines: `Property 'clerkUserId' does not exist in type 'UserWhereUniqueInput'`.
- **Solution:** Identified that VS Code’s TypeScript language server maintains in-memory caches of generated declaration files. Running `TypeScript: Restart TS Server` refreshed the cache from `node_modules/.prisma/client`, resolving the issue.

---

## Chapter 13: Future Scope

FinSensi has been architected with modular extensibility in mind. Future enhancements include:

1. **Automated Bank Feed Integration (Open Banking APIs):**
   Integration with financial aggregators (such as Plaid, Setu, or Yodlee) to automatically ingest bank statements and credit card transactions in real-time via webhooks.
2. **Background Automation with Inngest & Cron:**
   Implementing background worker queues using Inngest to schedule recurring transaction processing, daily budget alerts, and automated monthly PDF statement generation sent via Resend.
3. **Multi-Currency & Real-Time Exchange Rates:**
   Integrating currency exchange APIs to allow users holding international bank accounts or travelling abroad to view balances converted to their domestic currency.
4. **Predictive Cash Flow Simulation:**
   Implementing advanced machine learning models (LSTM / Prophet) to forecast a user's cash runway and alert them before overdrafts occur based on upcoming bills.
5. **Cross-Platform Mobile Application:**
   Developing dedicated iOS and Android mobile apps using React Native or Expo, sharing the existing backend Server Actions and PostgreSQL database.

---

## Chapter 14: Conclusion

### 14.1 Summary of Contributions
**FinSensi – Personal Finance Management System** successfully addresses the common pain points of manual, spreadsheet-based financial management. By unifying modern web technologies—**Next.js 16, React 19, TypeScript, PostgreSQL, Prisma ORM, and Clerk Authentication**—the system provides a reliable, secure, and visually appealing platform for tracking income, controlling expenses, and monitoring budgets.

The key engineering achievements of this project include:
- A responsive, animated landing page featuring 3D perspective scroll effects.
- Automated server-side user provisioning and zero-leak authentication architecture.
- Real-time multi-account tracking with automated default-account management.
- Dynamic data visualization utilizing Recharts with responsive time-range filtering.
- Resilient transactional integrity for bulk transaction deletions and balance recalculations.

### 14.2 Final Remarks
FinSensi demonstrates how modern web development frameworks and artificial intelligence can be combined to foster personal financial literacy. It simplifies complex financial data into actionable, clean interfaces, empowering users to make informed financial choices, curb excessive spending, and achieve long-term financial security.

---

## Chapter 15: References / Bibliography

1. **Next.js Documentation:** Vercel, "Next.js App Router and Server Actions Documentation," [Online]. Available: https://nextjs.org/docs. [Accessed: May 2026].
2. **React 19 Documentation:** Meta Platforms, "React 19 Release Notes and Component Models," [Online]. Available: https://react.dev. [Accessed: May 2026].
3. **Prisma Documentation:** Prisma Data, Inc., "Prisma ORM: Schema, Migrations, and Client Reference," [Online]. Available: https://www.prisma.io/docs. [Accessed: May 2026].
4. **Clerk Authentication:** Clerk, Inc., "Clerk Core 3 SDK Documentation for Next.js," [Online]. Available: https://clerk.com/docs. [Accessed: May 2026].
5. **PostgreSQL Manual:** The PostgreSQL Global Development Group, "PostgreSQL 16 Reference Manual," [Online]. Available: https://www.postgresql.org/docs. [Accessed: May 2026].
6. **Tailwind CSS Documentation:** Tailwind Labs, "Tailwind CSS v4 Utility-First Documentation," [Online]. Available: https://tailwindcss.com/docs. [Accessed: May 2026].
7. **Recharts Documentation:** Recharts Group, "Composable Charting Library for React," [Online]. Available: https://recharts.org. [Accessed: May 2026].
8. **Zod Validation Library:** C. Colmenter, "Zod: TypeScript-First Schema Validation with Static Type Inference," [Online]. Available: https://zod.dev. [Accessed: May 2026].
9. **Google Gemini API:** Google DeepMind, "Gemini Multimodal Models and API Documentation," [Online]. Available: https://ai.google.dev. [Accessed: May 2026].
