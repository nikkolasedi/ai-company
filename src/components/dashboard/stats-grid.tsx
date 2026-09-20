import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import {
  Users,
  ListTodo,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Clock,
} from "lucide-react";

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      title: "Active Agents",
      value: `${stats.activeAgents}/${stats.totalAgents}`,
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Running Tasks",
      value: stats.runningTasks,
      icon: ListTodo,
      color: "text-indigo-400",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: Clock,
      color: "text-orange-400",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      icon: CheckCircle,
      color: "text-green-400",
    },
    {
      title: "Failed Tasks",
      value: stats.failedTasks,
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      title: "Est. AI Cost",
      value: formatCurrency(stats.estimatedAiCost),
      icon: DollarSign,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ title, value, icon: Icon, color }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
