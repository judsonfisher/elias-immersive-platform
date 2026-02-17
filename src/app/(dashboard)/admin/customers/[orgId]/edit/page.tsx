import { notFound } from "next/navigation";
import { getCustomer } from "@/actions/customers";
import { CustomerForm } from "@/components/admin/customer-form";

export const metadata = {
  title: "Edit Customer — Elias Immersive",
};

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const customer = await getCustomer(orgId);

  if (!customer) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          Edit Customer
        </h1>
      </div>
      <CustomerForm customer={customer} />
    </div>
  );
}
