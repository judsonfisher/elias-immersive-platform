import { CustomerForm } from "@/components/admin/customer-form";

export const metadata = {
  title: "New Customer — Elias Immersive",
};

export default function NewCustomerPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          New Customer
        </h1>
        <p className="text-muted-foreground mt-1">
          Create a new customer organization.
        </p>
      </div>
      <CustomerForm />
    </div>
  );
}
