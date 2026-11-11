# MSME SAHAYAK (एमएसएमई सहायक)
> **Empowering MSMEs. Strengthening India's Economy.**

An Integrated Digital Support Platform for Indian Micro, Small and Medium Enterprises designed to solve delayed payments, eliminate working capital crunches, track inventory, and connect enterprises with statutory government schemes under the MSMED Act, 2006.

---

## 1. Problem Statement & Mission

Micro, Small and Medium Enterprises (MSMEs) contribute nearly 30% of India's GDP and over 45% of manufacturing output, yet face severe structural headwinds:
1. **Delayed Payments from Large Corporate Buyers & PSUs**: Invoices frequently languish past 60–90 days despite the statutory 45-day limit under the MSMED Act 2006.
2. **Working Capital Choke**: Locked receivables deplete operational liquidity, forcing suppliers into informal high-interest debt (often 24%+ p.a.).
3. **Supply Chain & Inventory Stockouts**: Inability to forecast buffer re-order levels leads to machine idle time.
4. **Information Asymmetry**: Lack of awareness regarding statutory dispute redressal (MSME Samadhaan, MSEFC councils) and credit schemes (CGTMSE, MUDRA, TReDS).

**MSME Sahayak** addresses these pain points with a unified full-stack application and relational database engine.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans & Inter typography
- **Backend**: Node.js, Express.js, RESTful APIs, Parameterized SQL queries, Input validation
- **Database**: MySQL 8.0+, `mysql2/promise` connection pooling, ACID transaction compliance
- **Architecture**: Single full-stack dev server via Vite middleware integration (`tsx server.ts`)

---

## 3. Project Directory Structure

```text
msme-sahayak/
├── backend/
│   ├── config/
│   │   └── db.ts                # MySQL2 connection pool & relational store engine
│   └── routes/
│       ├── businesses.ts        # Business registration & profile REST APIs
│       ├── invoices.ts          # Invoice ledger, 45-day MSMED calculator, payments
│       ├── inventory.ts         # Inventory stock, low buffer alerts, valuations
│       ├── schemes.ts           # Government schemes directory & MSME filters
│       ├── supportResources.ts  # MSME-DFO and Facilitation Councils
│       ├── dashboard.ts         # Analytical KPIs & monthly trend aggregations
│       └── dbmsPractice.ts      # 30+ RDBMS concept test runner for evaluators
├── database/
│   ├── schema.sql               # MySQL 8.0 DDL (Tables, Foreign Keys, Views, Checks)
│   ├── seed.sql                 # Realistic Indian MSME fixtures (5 MSMEs, 16 Invoices, 12 Payments, etc.)
│   └── dbms_practice_queries.sql # Complete 30+ DBMS concepts with explanations
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Institutional Top Bar contract & DB status chip
│   │   ├── Sidebar.tsx          # Navigation rail with live overdue & low-stock badges
│   │   ├── MetricCard.tsx       # Standardized KPI tile with Indian currency formatting
│   │   └── DatabaseStatusModal.tsx # Connection tester & MySQL import guide
│   ├── pages/
│   │   ├── DashboardView.tsx    # High-level KPIs, receivables breakdown, trends
│   │   ├── InvoicesView.tsx     # Primary invoice management ledger & payment modal
│   │   ├── FollowUpAssistantView.tsx # Multi-tone reminder & MSMED statutory legal notice generator
│   │   ├── BusinessesView.tsx   # MSME business directory & registration CRUD
│   │   ├── InventoryView.tsx    # Raw materials & finished goods stock tracking
│   │   ├── SchemesView.tsx      # Central schemes (Samadhaan, CGTMSE, MUDRA, TReDS)
│   │   ├── InsightsImpactView.tsx # Working capital unlock simulator & economic analysis
│   │   └── DbmsPracticeView.tsx # Interactive DBMS query console for hackathon viva
│   ├── services/
│   │   └── api.ts               # Typed fetch client communicating with /api/*
│   ├── types/
│   │   └── index.ts             # Shared domain data models
│   ├── utils/
│   │   └── formatters.ts        # Indian numbering system (₹ Lakhs & Crores), dates, status tokens
│   ├── App.tsx                  # Root state orchestration & tab navigation
│   ├── main.tsx                 # React DOM root entry
│   └── index.css                # Tailwind base layer & typography
├── .env.example                 # MySQL credentials template
├── server.ts                    # Express backend entry point with Vite middleware
├── package.json                 # Project dependencies & npm scripts
└── README.md                    # Setup, architecture & testing documentation
```

---

## 4. Local Execution & MySQL Setup Guide (VS Code)

### Prerequisites
1. **Node.js** (v18.0 or higher) and `npm`
2. **MySQL Server 8.0+** installed locally
3. **MySQL Workbench** or command-line MySQL client
4. **Visual Studio Code**

### Step 1: Clone Repository & Install Dependencies
Open your terminal or VS Code terminal:
```bash
# Clone the repository
git clone <repository-url>
cd msme-sahayak

# Install all runtime & dev dependencies
npm install
```

### Step 2: Set Up MySQL Database
Open your local MySQL client or MySQL Workbench and run:
```bash
# 1. Create database schema, tables, constraints, indexes & views
mysql -u root -p < database/schema.sql

# 2. Populate demonstration records (5 MSMEs, 16 Invoices, 12 Payments, 12 Inventory items)
mysql -u root -p msme_sahayak < database/seed.sql
```

Alternatively, open `database/schema.sql` and `database/seed.sql` inside **MySQL Workbench** and click the lightning bolt icon (**Execute**).

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and verify your MySQL credentials:
```ini
PORT=3000
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="your_mysql_root_password"
MYSQL_DATABASE="msme_sahayak"
```

### Step 4: Start the Application
Run the unified full-stack development server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. The application will boot immediately and display **"MySQL: msme_sahayak (Connected)"** in the top navigation bar.

> **Zero-Crash Sandbox Fallback**: If MySQL Server is not currently started or credentials are intentionally blank, the backend automatically engages its built-in relational simulation engine pre-loaded with the exact schema and seed dataset. This guarantees judges can inspect and evaluate the live application without setup blockers!

---

## 5. Core Modules & Functionalities

### Module 1: Business Registration & MSME Profiles
- Register Micro, Small, or Medium enterprises.
- Fields: Business Name, Owner Name, Email, Phone, Industry Category, MSME Classification, Udyam Registration Number, City/State, and Industrial Address.
- Full CRUD operations with parameter validation and cascade protection.

### Module 2: Invoices & Delayed Payment Management (Primary Module)
- Raise and record invoices with 45-day contractual due dates.
- Automatic calculation of outstanding balance (`invoice_amount - amount_paid`).
- Real-time date arithmetic identifying overdue accounts (`due_date < CURRENT_DATE` AND `payment_status != 'PAID'`).
- Invoices fully settled are marked **PAID** and never flagged as overdue.
- Record partial payments with transaction safety, logging payment mode (NEFT/RTGS, UPI, Cheque), UTR reference, and timestamp.

### Module 3: Payment Follow-Up Assistant
- Direct linkage to overdue invoices with real debtor names and outstanding amounts.
- Three tailored reminder tones:
  1. **Gentle Courtesy**: For early 1–15 day reminders.
  2. **Formal Commercial Demand**: For 15–45 day overdue balances.
  3. **Statutory Legal Notice**: Cites **Sections 15 & 16 of the MSMED Act, 2006**, demanding payment within 7 days with accrued compound penal interest at 3x the RBI bank rate (~19.5% p.a.).
- One-click copy, direct Email mailto draft, and WhatsApp share links.

### Module 4: Inventory & Supply Chain Management
- Track raw materials, spare parts, packaging, and finished goods.
- Automated low-stock buffer alerts (`available_quantity < min_stock_level`).
- Real-time inventory valuation (`available_quantity * unit_price`).

### Module 5: Government Schemes & Institutional Support
- Verified directory of 8 major central government programs:
  - **MSME Samadhaan**: Statutory delayed payment redressal portal.
  - **CGTMSE**: Collateral-free credit guarantee up to ₹5 Crore.
  - **PMEGP**: Credit-linked capital subsidies (15% to 35%).
  - **Pradhan Mantri MUDRA Yojana**: Collateral-free loans up to ₹10 Lakh (Shishu, Kishore, Tarun).
  - **TReDS**: RBI Trade Receivables Discounting System for instant factoring.
  - **MSME Champions, ZED Certification, and RAMP**.
- Directory of District Industries Centres (DICs) and MSEFC Facilitation Councils with contact details and official portal links.

### Module 6: Business Insights & Economic Impact Simulator
- Working capital liquidity unlock simulator: slide the recovery target to project immediate cashflow injection, new manufacturing batches funded, and penal interest savings.
- Clear distinction between simulated estimates and real-world macroeconomic claims.

### Module 7: DBMS SQL Practice Laboratory (For Evaluators & Viva)
- Interactive SQL execution console covering 30+ relational database management concepts:
  - DDL: `CREATE DATABASE`, `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`
  - DML: `INSERT`, `UPDATE`, `DELETE`
  - DQL: `SELECT`, `WHERE`, `DISTINCT`, `ORDER BY`, `GROUP BY`, `HAVING`
  - Aggregations: `COUNT()`, `SUM()`, `AVG()`, `MIN()`, `MAX()`
  - Relational Joins: `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`
  - Subqueries: Scalar subqueries, correlated subqueries with `EXISTS`, `IN` clauses
  - Database Views: `view_overdue_invoices_summary`, `view_business_cashflow_summary`
  - Indexing: `CREATE INDEX`, `EXPLAIN` query plan analysis
  - ACID Transactions: `START TRANSACTION`, `COMMIT`, `ROLLBACK`
  - Set Operations: `UNION ALL` combining invoice and inventory alerts

---

## 6. Feature Verification & Testing Checklist

| # | Feature / User Requirement | Status | How to Test & Verify in UI |
|---|---|---|---|
| 1 | **Database Connectivity & Schemas** | **Working** | Click "DB: ..." in the top bar to inspect MySQL parameters, connection pool, and import commands. |
| 2 | **Business Registration (CRUD)** | **Working** | Navigate to "Business Directory", click "+ Register New MSME", add enterprise. Edit and delete also fully functional. |
| 3 | **Invoice Creation** | **Working** | Click "+ Raise Invoice" in top header or invoices tab. Select MSME supplier, enter buyer, amount, and dates. |
| 4 | **Overdue Invoice Detection** | **Working** | Click "OVERDUE" status filter on Invoices ledger to see only bills past due date with exact days overdue counter. |
| 5 | **Partial Payment Recording** | **Working** | On any unpaid invoice row, click "+ Pay", enter partial amount (e.g. ₹50,000), select NEFT, and verify balance updates. |
| 6 | **Full Settlement (No False Overdue)** | **Working** | Click "Settle" on an overdue invoice to record full balance. Status immediately shifts to "Paid / Cleared" and overdue flag clears. |
| 7 | **Follow-Up Notice Generation** | **Working** | Go to "Follow-Up Assistant", switch between Gentle, Formal, and Statutory Legal tones. Click "Copy Notice" or "Open Email Draft". |
| 8 | **Inventory Stock & Low-Stock Alerts** | **Working** | Navigate to "Inventory Management", click "Low Stock Only" filter. Edit an item's quantity to test automatic alert badge changes. |
| 9 | **Government Schemes Filter** | **Working** | Open "Government Schemes", filter by "Micro", "Small", or "Medium". Click "Visit Official Portal" to verify external links. |
| 10 | **Working Capital Simulator** | **Working** | Open "Insights & Impact", drag the recovery slider from 25% to 100% to view live calculated capital released and batches funded. |
| 11 | **DBMS 30+ Concepts Runner** | **Working** | Open "DBMS Practice Lab", select any query (e.g. INNER JOIN, GROUP BY HAVING, or Correlated Subquery), and click "Run Query". |

---

## 7. License & Compliance

Developed under the Apache-2.0 License. Designed for MSME empowerment, statutory compliance under the Micro, Small and Medium Enterprises Development Act (MSMED Act, 2006), and academic database evaluation.
