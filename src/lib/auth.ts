// Auth.js v5 — credentials + Prisma adapter + JWT session
// Session augmented with: userId, activeTenantId, activeRole, tenants[]
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      activeTenantId: string | null;
      activeRole: "OWNER" | "MANAGER" | "CASHIER" | null;
      tenants: Array<{
        id: string;
        slug: string;
        name: string;
        role: "OWNER" | "MANAGER" | "CASHIER";
      }>;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    activeTenantId?: string | null;
    activeRole?: "OWNER" | "MANAGER" | "CASHIER" | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            memberships: { include: { tenant: true } },
          },
        });
        if (!user?.hashedPassword) return null;

        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) token.userId = user.id;

      if (token.userId) {
        const memberships = await prisma.userOnTenant.findMany({
          where: { userId: token.userId, isActive: true },
          include: { tenant: { select: { id: true, slug: true, name: true } } },
          orderBy: { createdAt: "asc" },
        });

        if (!token.activeTenantId && memberships.length > 0) {
          token.activeTenantId = memberships[0].tenantId;
          token.activeRole = memberships[0].role as "OWNER" | "MANAGER" | "CASHIER";
        }

        if (trigger === "update" && session?.activeTenantId) {
          const m = memberships.find((x) => x.tenantId === session.activeTenantId);
          if (m) {
            token.activeTenantId = m.tenantId;
            token.activeRole = m.role as "OWNER" | "MANAGER" | "CASHIER";
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        if (typeof token.userId === "string") session.user.id = token.userId;
        session.user.activeTenantId = (token.activeTenantId as string | null) ?? null;
        session.user.activeRole = (token.activeRole as "OWNER" | "MANAGER" | "CASHIER" | null) ?? null;

        const memberships = await prisma.userOnTenant.findMany({
          where: { userId: token.userId, isActive: true },
          include: { tenant: { select: { id: true, slug: true, name: true } } },
          orderBy: { createdAt: "asc" },
        });
        session.user.tenants = memberships.map((m) => ({
          id: m.tenant.id,
          slug: m.tenant.slug,
          name: m.tenant.name,
          role: m.role as "OWNER" | "MANAGER" | "CASHIER",
        }));
      }
      return session;
    },
  },
});
