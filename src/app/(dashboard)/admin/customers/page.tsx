import { getCustomers } from "@/actions/customers";
import { CustomerTable } from "@/components/admin/customer-table";

export const metadata = {
  title: "Customers — Elias Immersive",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await getCustomers(q);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          Customers
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your customer organizations and their properties.
        </p>
      </div>
      <CustomerTable customers={customers} />
    </div>
  );
}
