import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDictionary } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (session?.user?.id) {
    if (session.user.activeTenantId) redirect("/app");
    redirect("/select-tenant");
  }
  const t = getDictionary("th");

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) return;

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: params.callbackUrl || "/app",
      });
    } catch (err) {
      // Auth.js throws redirect; re-throw if so
      if ((err as any)?.digest?.startsWith("NEXT_REDIRECT")) throw err;
      redirect(`/login?error=invalid`);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">{t.auth.login}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.app.tagline}
        </p>

        {params.error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{t.auth.invalidCredentials}</AlertDescription>
          </Alert>
        )}

        <form action={login} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full">
            {t.auth.login}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          {t.auth.noAccount}{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            {t.auth.signupNow}
          </Link>
        </div>
      </Card>
    </div>
  );
}
