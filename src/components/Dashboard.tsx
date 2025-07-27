import { useContext, useMemo } from "react";
import { PaymentsContext, PaymentRecord } from "./PaymentsContext";
import { initialTenants } from "../data/tenants";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { DollarSign, Users, Clock, AlertTriangle } from "lucide-react";

export function Dashboard() {
  const context = useContext(PaymentsContext);
  if (!context) return <p>Loading dashboard...</p>;
  const { payments } = context;

  const totalRevenue = useMemo(
    () => payments.reduce((sum: number, p: PaymentRecord) => sum + p.amount, 0),
    [payments]
  );

  const activeTenants = initialTenants.length;

  const pendingPayments = useMemo(() => {
    let pending = 0;
    initialTenants.forEach((tenant) => {
      const tenantPayments = payments.filter(
        (p: PaymentRecord) => p.tenantId === tenant.id
      );
      const totalPaid = tenantPayments.reduce(
        (sum: number, p: PaymentRecord) => sum + p.amount,
        0
      );
      const monthsPassed =
        new Date().getMonth() - new Date(tenant.leaseBegin).getMonth() +
        12 *
          (new Date().getFullYear() -
            new Date(tenant.leaseBegin).getFullYear());
      const totalDue = tenant.rent * (monthsPassed + 1);
      pending += Math.max(totalDue - totalPaid, 0);
    });
    return pending;
  }, [payments]);

  const overduePayments = useMemo(
    () =>
      payments.filter(
        (p: PaymentRecord) => p.status === "Missing" || p.status === "Partial"
      ).length,
    [payments]
  );

  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort(
          (a: PaymentRecord, b: PaymentRecord) =>
            new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime()
        )
        .slice(0, 5),
    [payments]
  );

  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p: PaymentRecord) => {
      map[p.dueDate] = (map[p.dueDate] || 0) + p.amount;
    });
    return Object.entries(map).map(([month, amount]) => ({
      month,
      amount,
    }));
  }, [payments]);

  const blockRevenue = useMemo(() => {
    const blocks: Record<string, number> = {};
    payments.forEach((p: PaymentRecord) => {
      const tenant = initialTenants.find((t) => t.id === p.tenantId);
      if (tenant) {
        blocks[tenant.block] = (blocks[tenant.block] || 0) + p.amount;
      }
    });
    return Object.entries(blocks).map(([block, revenue]) => ({
      block,
      revenue,
    }));
  }, [payments]);

  const trendUp = "+8.2% from last month";
  const trendDown = "-5.4% from last month";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              KSh {totalRevenue.toLocaleString()}
            </p>
            <p className="text-green-500 text-xs">{trendUp}</p>
          </div>
          <div className="bg-green-100 p-2 rounded-full">
            <DollarSign className="text-green-600" />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Active Tenants</p>
            <p className="text-2xl font-bold text-blue-600">
              {activeTenants}
            </p>
            <p className="text-green-500 text-xs">+2 from last month</p>
          </div>
          <div className="bg-blue-100 p-2 rounded-full">
            <Users className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Pending Payments</p>
            <p className="text-2xl font-bold text-yellow-600">
              KSh {pendingPayments.toLocaleString()}
            </p>
            <p className="text-red-500 text-xs">{trendDown}</p>
          </div>
          <div className="bg-yellow-100 p-2 rounded-full">
            <Clock className="text-yellow-600" />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Overdue Payments</p>
            <p className="text-2xl font-bold text-red-600">
              {overduePayments}
            </p>
            <p className="text-red-500 text-xs">+1 from last month</p>
          </div>
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#4ade80"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">Block-wise Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={blockRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="block" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
        {recentPayments.length === 0 ? (
          <p className="text-gray-500">No recent payments recorded.</p>
        ) : (
          <ul className="space-y-2">
            {recentPayments.map((p: PaymentRecord, idx: number) => (
              <li
                key={idx}
                className="flex justify-between border-b pb-1 text-sm"
              >
                <span>
                  <strong>{p.tenantName}</strong> paid{" "}
                  <span className="text-green-600 font-medium">
                    KSh {p.amount.toLocaleString()}
                  </span>
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(p.paidDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
