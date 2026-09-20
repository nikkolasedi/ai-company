import { auth } from "@/lib/auth";
import { CompanyCalendar } from "@/components/calendar/company-calendar";
import { redirect } from "next/navigation";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Company Calendar</h1>
        <p className="text-zinc-400">
          Routines, scheduled tasks, and upcoming agent work for {session.user.organizationName}
        </p>
      </div>
      <CompanyCalendar />
    </div>
  );
}
