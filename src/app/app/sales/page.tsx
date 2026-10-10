import { listSales } from "./actions";
import { SalesClient } from "./sales-client";

export default async function SalesPage() {
  const sales = await listSales({ limit: 100 });
  return <SalesClient initialSales={sales} />;
}
