import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { getDictionary } from "@/lib/i18n";

export default async function ExpiredPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = getDictionary("th");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">{t.expired.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.expired.description}</p>
        <Link
          href={appUrl ? `${appUrl}/billing` : "/billing"}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          {t.expired.renew} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
