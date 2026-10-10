import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function StubPage({
  title,
  message = "หน้านี้ยังอยู่ระหว่างพัฒนา ใช้งานได้ในเวอร์ชันถัดไป",
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Construction className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </Card>
    </div>
  );
}
