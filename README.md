ManPower

ManPower is a web platform inspired by Upwork, designed to connect clients with employees (instead of “freelancers”). The system provides a streamlined way for clients to post jobs, review proposals, manage contracts, and communicate with employees, while employees can showcase their skills, apply for jobs, and manage their work history.

🚀 Features
🔹 Authentication & Roles

Secure authentication with Firebase Firestore.

Two roles:

Client – posts jobs, manages proposals, hires employees.

Employee – creates a profile, applies for jobs, manages work history.

🔹 Job Management

Clients can:

Create, edit, and delete job posts.

Review incoming proposals.

Hire employees and manage active contracts.

Employees can:

Browse job listings.

Submit proposals to clients.

Track active and completed jobs.

🔹 Employee Profiles

Create and update profiles with:

Skills & employment history.

Uploaded documents (e.g., resumes, portfolios).

Stored via Supabase Storage with metadata in Firestore.

🔹 Proposals & Contracts

Employees submit proposals for job posts.

Clients review and accept/reject proposals.

Once accepted, contracts are created to track ongoing work.

🔹 Chat System

Real-time chat threads between clients and employees.

Supports file sharing (via Supabase).

🔹 Dashboard & Insights

Clients: View active jobs, proposals, and hired employees.

Employees: Track job applications, active contracts, and completed work.

🛠️ Tech Stack

Frontend: Next.js (React, Tailwind CSS)

Backend/Database: Firebase Firestore

File Storage: Supabase Storage

Authentication: Firebase Authentication

📂 Project Structure
/manpower
  ├── /pages
  │   ├── client/          # Client-specific views
  │   ├── employee/        # Employee-specific views
  │   └── api/             # API routes
  ├── /lib
  │   ├── client-firestore.ts     # Client job/proposal/contract logic
  │   ├── employee-firestore.ts   # Employee profile/job application logic
  │   └── supabase.ts             # Supabase configuration
  ├── /components          # Reusable UI components
  └── README.md

⚡ Getting Started
Prerequisites

Node.js 18+

Firebase project with Firestore & Authentication enabled

Supabase project with Storage enabled

Installation
# Clone the repo
git clone https://github.com/yourusername/manpower.git
cd manpower

# Install dependencies
npm install

# Run the dev server
npm run dev

🔮 Roadmap

 Add client & employee rating/review system

 Implement payment gateway for contracts

 Expand analytics for job success rates

 Improve search & filtering for jobs/employees
