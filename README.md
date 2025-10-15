# FinControl 💰

 **FinControl** is a modern, full-stack personal finance management application designed to provide a comprehensive overview of your financial life. From daily expense tracking to investment portfolio management and AI-powered insights, FinControl helps you move from simply tracking your money to actively planning your financial future.

This project is built with a modern technology stack including Next.js, TypeScript, PostgreSQL, Prisma, and is fully containerized with Docker.

## ✨ Key Features

  * **📊 Interactive Dashboard**: A central hub to view your monthly income, expenses, and current balance. Includes visual charts for expense distribution by category.
  * **💸 Transaction Management**: Full CRUD (Create, Read, Update, Delete) functionality for all your transactions.
  * **🔁 Recurring Payments**: Easily manage fixed expenses and income (like rent or salary) and installment purchases.
  * **🤖 AI-Powered Import**: Import your bank statement (CSV file), and let an integrated AI (Google Gemini) automatically parse, categorize, and add transactions to your database.
  * **📈 Investment Tracking**: A dedicated section to manage your investment portfolio, register assets (like CDBs, Stocks), and track contributions and redemptions.
  * **📄 Advanced Reports**: A historical view of your finances with charts showing income vs. expenses over the last 12 months and the evolution of spending in your top categories.
  * **💡 AI Insights**: Get proactive financial tips and analysis based on your spending habits, powered by Google Gemini.
  * **⚙️ Dynamic Filtering & Pagination**: A dedicated page to view and filter all your historical transactions by date, type, or description.
  * **🌗 Light & Dark Mode**: A sleek, modern interface with full support for both light and dark themes.
  * **📱 Fully Responsive**: A beautiful and functional UI on both desktop and mobile devices.

## 🛠️ Technology Stack

This project leverages a modern, type-safe, and scalable technology stack:

  * **Framework**: [Next.js](https://nextjs.org/) (App Router)
  * **Language**: [TypeScript](https://www.typescriptlang.org/)
  * **Database**: [PostgreSQL](https://www.postgresql.org/)
  * **ORM**: [Prisma](https://www.prisma.io/)
  * **Styling**: [Tailwind CSS](https://tailwindcss.com/)
  * **UI Components**: [Shadcn/UI](https://ui.shadcn.com/)
  * **Data Visualization**: [Recharts](https://recharts.org/)
  * **Animations**: [Framer Motion](https://www.framer.com/motion/)
  * **AI Integration**: [Google Gemini API](https://ai.google.dev/)
  * **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## 🚀 Getting Started

You can run this project in two ways: a **full Docker environment** (recommended for production-like setup) or a **hybrid environment** (recommended for agile frontend development).

### Prerequisites

  * [Node.js](https://nodejs.org/en/) (v20 or later)
  * [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
  * A Google Gemini API Key (for the AI import feature)

### 1\. Initial Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/fin-control.git
    cd fin-control
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

      * Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
      * Open the `.env` file and fill in the variables. The `DATABASE_URL` is already configured for Docker. You only need to add your `GEMINI_API_KEY` and a `CRON_SECRET`.
        ```env
        # .env
        DATABASE_URL="postgresql://user:password@db:5432/fincontrol_db?schema=public"
        GEMINI_API_KEY="your_google_gemini_api_key_here"
        CRON_SECRET="generate_a_long_random_secret_here"
        ```

### 2\. Running the Application

Choose one of the following methods:

#### Method A: Hybrid Environment (Recommended for Development) ⚡

This method runs the database and cron job in Docker, while the Next.js frontend runs locally on your machine, enabling fast hot-reloading.

1.  **Start the backend services:**

    ```bash
    docker-compose up db -d
    ```

2.  **Apply database migrations:**
    This command creates all the necessary tables in your database.

    ```bash
    npx prisma migrate deploy
    ```

3.  **(Optional) Seed the database:**
    This adds initial categories (like "Alimentação", "Moradia") to get you started.

    ```bash
    npx prisma db seed
    ```

4.  **Run the Next.js development server:**

    ```bash
    npm run dev
    ```

Your application is now running at **[http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)**.

#### Method B: Full Docker Environment 🐳

This method runs the entire application (frontend, backend, database, cron) inside Docker containers, simulating a production environment.

1.  **Build and start all containers:**

    ```bash
    docker-compose up --build -d
    ```

2.  **Apply database migrations:**
    Open a **new terminal** and run:

    ```bash
    npx prisma migrate deploy
    ```

3.  **(Optional) Seed the database:**

    ```bash
    npx prisma db seed
    ```

Your application is now running at **[http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)**.

### Stopping the Application

  * **Hybrid Mode:** Press `Ctrl+C` in the `npm run dev` terminal, then run `docker-compose down`.
  * **Full Docker Mode:** Simply run `docker-compose down`.

## ⚙️ Core Functionalities Explained

### Automated Recurring Transactions

The application includes a cron job that runs daily. This job automatically creates real transactions from your recurring payment schedules.

  * **Logic**: Defined in `src/lib/recurring.ts`.
  * **Trigger**: A dedicated Docker container (`cron` service) calls the `/api/cron` endpoint every day at 8:00 UTC, as defined in `cron/crontab`.
  * **Security**: The API endpoint is protected by a secret token (`CRON_SECRET`) to prevent unauthorized execution.

### AI-Powered CSV Import

You can import a CSV file from your bank statement. The system sends the file's content to the Google Gemini API, which intelligently parses each line, assigns it to the most appropriate category from your database, and returns a structured JSON array ready to be saved.

  * **Logic**: The `importTransactionsFromCSV` function in `src/lib/actions.ts` handles file parsing, prompt engineering, the API call, and saving the data.
  * **Prompt Engineering**: The prompt is carefully crafted to instruct the AI to return data only in a specific JSON format, ensuring reliability.

### Database Management

The project uses Prisma as its ORM, providing type-safety and an intuitive way to interact with the database.

  * **Schema**: The complete database structure is defined in `prisma/schema.prisma`.
  * **Migrations**: Changes to the schema are managed through migration files located in the `prisma/migrations` folder.
  * **Studio**: For easy data visualization and manual editing during development, you can run `npx prisma studio`.