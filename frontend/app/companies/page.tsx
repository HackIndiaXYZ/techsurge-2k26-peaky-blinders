import type { Metadata } from "next";
import { CompanyDashboard } from "@/components/dashboard/CompanyDashboard";

export const metadata: Metadata = {
  title: "Services for Companies | PausePay API Dashboard",
  description:
    "Pre-payment risk and explainable intervention API for UPI apps, banks, and payment providers. Apply for custom app integration.",
};

export default function CompaniesPage() {
  return <CompanyDashboard />;
}
