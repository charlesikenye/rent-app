import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { initialTenants } from "../data/tenants";
import { supabase } from "../api/supabaseClient"; // Added import for supabase client

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
};

const blockDisplayNames: Record<string, string> = {
  OLD: "EL-HADDAI APARTMENTS OLD BLOCK (Nakuru)",
  NEW: "EL-HADDAI APARTMENTS NEW BLOCK (Nakuru)",
  NYERI: "OUTSPAN - KAMAKWA RD (Nyeri)",
};

// ✅ STRICT 6-SCENARIO ACCOUNTING LOGIC
const computePaymentStatus = (tenant: any, receipts: any[]) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const leaseDate = tenant.leaseBegin ? new Date(tenant.leaseBegin) : new Date();
  const startYear = leaseDate.getFullYear();
  const startMonth = leaseDate.getMonth();

  const receiptMap: Record<string, number> = {};
  receipts.forEach((r) => {
    receiptMap[r.dueDate] = (receiptMap[r.dueDate] || 0) + r.amount;
  });

  const paymentStatus: any[] = [];
  let carryArrears = 0;
  let carryCredit = 0;

  for (let y = startYear; y <= currentYear; y++) {
    const from = y === startYear ? startMonth : 0;
    const to = y === currentYear ? currentMonth : 11;

    for (let m = from; m <= to; m++) {
      const key = `${monthNames[m]} ${y}`;
      const baseRent = tenant.rent;
      const paid = receiptMap[key] || 0;

      let arrearsThisMonth = 0;
      let creditThisMonth = 0;
      let status = "Missing";

      if (paid === 0) {
        arrearsThisMonth = baseRent;
        status = "Missing";
      } else if (paid < baseRent) {
        arrearsThisMonth = baseRent - paid;
        status = "Partial";
      } else if (paid === baseRent) {
        status = "Paid";
      } else if (paid > baseRent) {
        creditThisMonth = paid - baseRent;
        status = "Paid (Over)";
      }

      carryArrears += arrearsThisMonth;
      carryCredit += creditThisMonth;

      paymentStatus.push({
        month: monthNames[m],
        year: y,
        baseRent,
        paid,
        arrears: arrearsThisMonth,
        credit: creditThisMonth,
        netBalance: Math.max(carryArrears - carryCredit, 0),
        status,
      });
    }
  }

  return {
    paymentStatus,
    totalArrears: carryArrears,
    totalCredit: carryCredit,
    totalBalance: Math.max(carryArrears - carryCredit, 0),
  };
};

export function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [tenantPayments, setTenantPayments] = useState<any[]>([]);
  const [viewTenant, setViewTenant] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
  const [reportType, setReportType] =
    useState<"Monthly" | "Quarterly" | "Annual">("Monthly");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<any>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [selectedBlock, payments]);

  const fetchPayments = async () => {
    const { data, error } = await supabase.from("payments").select("*");
    if (error) {
      console.error("Error fetching payments:", error);
      return;
    }
    setPayments(data || []);
  };

  const loadPayments = () => {
    if (!selectedBlock) {
      setTenantPayments([]);
      return;
    }

    const tenantsInBlock = initialTenants.filter(
      (t) => t.block === selectedBlock
    );

    const tenantSummaries = tenantsInBlock.map((tenant) => {
      const tenantReceipts = payments.filter(
        (p: any) => p.tenantId === tenant.id
      );
      const { totalBalance } = computePaymentStatus(tenant, tenantReceipts);

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        unit: tenant.unit,
        totalPaid: tenantReceipts.reduce(
          (sum: number, rec: any) => sum + rec.amount,
          0
        ),
        latestPaidDate: tenantReceipts.length
          ? formatDate(
              tenantReceipts[tenantReceipts.length - 1].paidDate
            )
          : "N/A",
        status: totalBalance === 0 ? "Up to Date" : "Has Arrears",
        totalBalance,
      };
    });

    setTenantPayments(tenantSummaries);
  };

  const handleViewTenant = (tenantId: number) => {
    const receipts = payments.filter((p: any) => p.tenantId === tenantId);
    const tenant = initialTenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    const { paymentStatus, totalArrears, totalCredit, totalBalance } =
      computePaymentStatus(tenant, receipts);

    setViewTenant({
      ...tenant,
      totalPaid: receipts.reduce((s: number, r: any) => s + r.amount, 0),
      paymentStatus,
      totalArrears,
      totalCredit,
      totalBalance,
    });

    setIsViewOpen(true);
  };

  const openEditModal = (payment: any) => {
    setEditPayment({ ...payment });
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editPayment) return;

    const { error } = await supabase.from("payments").insert([
      {
        tenantId: editPayment.tenantId,
        tenantName: viewTenant.name,
        unit: viewTenant.unit,
        dueDate: editPayment.dueDate,
        paidDate: new Date().toISOString(),
        amount: editPayment.amount,
        method: "Manual Edit",
        status: "Paid",
      },
    ]);

    if (error) {
      console.error("Error saving payment:", error);
      return;
    }

    await fetchPayments();
    if (viewTenant) handleViewTenant(viewTenant.id);
    setIsEditOpen(false);
  };

  const getReportData = () => {
    if (!viewTenant) return [];
    if (reportType === "Monthly") return viewTenant.paymentStatus;

    if (reportType === "Quarterly") {
      const grouped: Record<
        string,
        { paid: number; arrears: number; credit: number }
      > = {};
      viewTenant.paymentStatus.forEach((p: any) => {
        const quarter = Math.floor(monthNames.indexOf(p.month) / 3) + 1;
        const key = `Q${quarter} ${p.year}`;
        if (!grouped[key])
          grouped[key] = { paid: 0, arrears: 0, credit: 0 };
        grouped[key].paid += p.paid;
        grouped[key].arrears += p.arrears;
        grouped[key].credit += p.credit;
      });
      return Object.entries(grouped).map(([period, vals]) => ({
        period,
        paid: vals.paid,
        arrears: vals.arrears,
        credit: vals.credit,
        netBalance: Math.max(vals.arrears - vals.credit, 0),
        status:
          vals.arrears - vals.credit <= 0 ? "Paid" : "Arrears",
      }));
    }

    if (reportType === "Annual") {
      const grouped: Record<
        string,
        { paid: number; arrears: number; credit: number }
      > = {};
      viewTenant.paymentStatus.forEach((p: any) => {
        const key = p.year;
        if (!grouped[key])
          grouped[key] = { paid: 0, arrears: 0, credit: 0 };
        grouped[key].paid += p.paid;
        grouped[key].arrears += p.arrears;
        grouped[key].credit += p.credit;
      });
      return Object.entries(grouped).map(([year, vals]) => ({
        period: year,
        paid: vals.paid,
        arrears: vals.arrears,
        credit: vals.credit,
        netBalance: Math.max(vals.arrears - vals.credit, 0),
        status:
          vals.arrears - vals.credit <= 0 ? "Paid" : "Arrears",
      }));
    }
  };

  const exportPDF = () => {
    if (!viewTenant) return;
    const reportData = getReportData();
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(
      `Tenant Payment Report - ${reportType}`,
      105,
      15,
      undefined,
      undefined,
      "center"
    );

    doc.setFontSize(12);
    doc.text(`Name: ${viewTenant.name}`, 10, 30);
    doc.text(`Unit: ${viewTenant.unit}`, 10, 38);
    doc.text(`Phone: ${viewTenant.phone}`, 10, 46);

    let y = 70;
    doc.text(
      reportType === "Monthly" ? "Month" : "Period",
      10,
      y
    );
    doc.text("Paid", 60, y);
    doc.text("Arrears", 90, y);
    doc.text("Credit", 120, y);
    doc.text("Net Bal", 150, y);

    y += 8;
    reportData.forEach((p: any) => {
      doc.text(p.period || `${p.month} ${p.year}`, 10, y);
      doc.text(p.paid.toLocaleString(), 60, y);
      doc.text(p.arrears.toLocaleString(), 90, y);
      doc.text(p.credit.toLocaleString(), 120, y);
      doc.text(p.netBalance.toLocaleString(), 150, y);
      y += 8;
    });

    y += 10;
    doc.text(
      `TOTAL ARREARS: KSh ${viewTenant.totalArrears.toLocaleString()}`,
      10,
      y
    );
    y += 6;
    doc.text(
      `TOTAL CREDIT: KSh ${viewTenant.totalCredit.toLocaleString()}`,
      10,
      y
    );
    y += 6;
    doc.text(
      `NET BALANCE: KSh ${viewTenant.totalBalance.toLocaleString()}`,
      10,
      y
    );

    doc.save(
      `${viewTenant.name.replace(/\s+/g, "")}_${reportType}_Report.pdf`
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Payments Overview</h2>

      <div className="mb-4">
        <label className="block font-medium mb-1">Select Property</label>
        <select
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-sm"
        >
          <option value="">-- Select Property --</option>
          {Object.entries(blockDisplayNames).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {selectedBlock && tenantPayments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Tenant</th>
                <th className="border px-4 py-2">Unit</th>
                <th className="border px-4 py-2">Total Paid</th>
                <th className="border px-4 py-2">Net Balance</th>
                <th className="border px-4 py-2">Latest Paid Date</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {tenantPayments.map((tp, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{tp.tenantName}</td>
                  <td className="border px-4 py-2">{tp.unit}</td>
                  <td className="border px-4 py-2">
                    {tp.totalPaid.toLocaleString()}
                  </td>
                  <td className="border px-4 py-2">
                    {tp.totalBalance.toLocaleString()}
                  </td>
                  <td className="border px-4 py-2">
                    {tp.latestPaidDate}
                  </td>
                  <td
                    className={`border px-4 py-2 font-semibold ${
                      tp.status === "Up to Date"
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    {tp.status}
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleViewTenant(tp.tenantId)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedBlock && tenantPayments.length === 0 && (
        <p className="text-gray-600 mt-4">
          No payment records found for this property yet.
        </p>
      )}

      {isViewOpen && viewTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full">
            <h3 className="text-xl font-bold mb-3">
              Payment Details - {viewTenant.name} ({viewTenant.unit})
            </h3>
            <p>
              Total Paid:{" "}
              <strong>KSh {viewTenant.totalPaid}</strong>
            </p>
            <p>
              Total Arrears:{" "}
              <strong className="text-red-600">
                KSh {viewTenant.totalArrears}
              </strong>
            </p>
            <p>
              Total Credit:{" "}
              <strong className="text-green-600">
                KSh {viewTenant.totalCredit}
              </strong>
            </p>
            <p>
              Net Balance:{" "}
              <strong>KSh {viewTenant.totalBalance}</strong>
            </p>

            <div className="my-3">
              <label className="block font-medium mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) =>
                  setReportType(e.target.value as any)
                }
                className="border rounded px-3 py-2"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="mt-4 overflow-y-auto max-h-60 border-t border-b">
              <table className="min-w-full text-sm mt-2">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">
                      {reportType === "Monthly" ? "Month" : "Period"}
                    </th>
                    <th className="border px-2 py-1">Base Rent</th>
                    <th className="border px-2 py-1">Paid</th>
                    <th className="border px-2 py-1">Arrears</th>
                    <th className="border px-2 py-1">Credit</th>
                    <th className="border px-2 py-1">Net Balance</th>
                    <th className="border px-2 py-1">Status</th>
                    <th className="border px-2 py-1">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {getReportData().map((p: any, i: number) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">
                        {p.period || `${p.month} ${p.year}`}
                      </td>
                      <td className="border px-2 py-1">
                        {p.baseRent?.toLocaleString?.() ||
                          viewTenant.rent.toLocaleString()}
                      </td>
                      <td className="border px-2 py-1">
                        {p.paid.toLocaleString()}
                      </td>
                      <td className="border px-2 py-1 text-red-600">
                        {p.arrears?.toLocaleString()}
                      </td>
                      <td className="border px-2 py-1 text-green-600">
                        {p.credit?.toLocaleString()}
                      </td>
                      <td className="border px-2 py-1 font-bold">
                        {p.netBalance?.toLocaleString()}
                      </td>
                      <td className="border px-2 py-1">{p.status}</td>
                      <td className="border px-2 py-1">
                        {reportType === "Monthly" && p.paid > 0 && (
                          <button
                            onClick={() =>
                              openEditModal({
                                tenantId: viewTenant.id,
                                dueDate: `${p.month} ${p.year}`,
                                amount: p.paid,
                              })
                            }
                            className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 text-xs"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={exportPDF}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Export PDF
              </button>
              <button
                onClick={() => setIsViewOpen(false)}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && editPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h3 className="text-lg font-bold mb-3">Edit Payment</h3>
            <p>Due Date: {editPayment.dueDate}</p>
            <div className="mt-3">
              <label className="block text-sm">Amount</label>
              <input
                type="number"
                value={editPayment.amount}
                onChange={(e) =>
                  setEditPayment({
                    ...editPayment,
                    amount: parseFloat(e.target.value),
                  })
                }
                className="border rounded w-full px-2 py-1 mt-1"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsEditOpen(false)}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
