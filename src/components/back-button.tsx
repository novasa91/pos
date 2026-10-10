"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ href, label = "กลับ" }: { href?: string; label?: string }) {
  const router = useRouter();
  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (href) {
      router.push(href);
    }
  };

  const className = "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  if (href) {
    return (
      <Link href={href} className={className}>
        <ArrowLeft className="h-4 w-4" /> {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className} type="button">
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
