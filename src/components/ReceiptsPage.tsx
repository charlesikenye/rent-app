import { useState, useMemo } from "react";
import { initialTenants } from "../data/tenants";
import jsPDF from "jspdf";
import { usePayments } from "./PaymentsContext";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function ReceiptsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const { addPayment } = usePayments();

  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [paidMonths, setPaidMonths] = useState<number[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<number, number>>({});
  const [paymentMethod, setPaymentMethod] = useState("M-PESA via Paybill");

  const blockDisplayNames: Record<string, string> = {
    OLD: "EL-HADDAI APARTMENTS OLD BLOCK (Nakuru)",
    NEW: "EL-HADDAI APARTMENTS NEW BLOCK (Nakuru)",
    NYERI: "OUTSPAN - KAMAKWA RD (Nyeri)",
  };

  const filteredTenants = selectedBlock
    ? initialTenants.filter((t) => t.block === selectedBlock)
    : [];

  const tenant = initialTenants.find((t) => t.id === selectedTenantId) || null;

  const leaseMonths = useMemo(() => {
    if (!tenant || !tenant.leaseBegin) {
      return monthNames.slice(0, currentMonth + 1).map((m, i) => ({
        month: m,
        year: currentYear,
        index: i,
      }));
    }
    const leaseDate = new Date(tenant.leaseBegin);
    const startYear = leaseDate.getFullYear();
    const startMonth = leaseDate.getMonth();
    const months: { month: string; year: number; index: number }[] = [];
    for (let y = startYear; y <= currentYear; y++) {
      const from = y === startYear ? startMonth : 0;
      const to = y === currentYear ? currentMonth : 11;
      for (let m = from; m <= to; m++) {
        months.push({ month: monthNames[m], year: y, index: m });
      }
    }
    return months;
  }, [tenant, currentYear, currentMonth]);

  const toggleMonth = (idx: number) => {
    if (!tenant) return;
    if (paidMonths.includes(idx)) {
      setPaidMonths(paidMonths.filter((m) => m !== idx));
      setPaymentAmounts((prev) => {
        const copy = { ...prev };
        delete copy[idx];
        return copy;
      });
    } else {
      setPaidMonths([...paidMonths, idx]);
      setPaymentAmounts((prev) => ({ ...prev, [idx]: tenant.rent }));
    }
  };

  const onPaymentAmountChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setPaymentAmounts((prev) => {
        const copy = { ...prev };
        delete copy[idx];
        return copy;
      });
    } else {
      const num = Number(val);
      if (!isNaN(num)) {
        setPaymentAmounts((prev) => ({ ...prev, [idx]: num }));
      }
    }
  };

  const processPayments = (saveToStore = false) => {
    if (!tenant) return [];
    const statuses: any[] = [];
    leaseMonths.forEach((mObj, idx) => {
      const amountDue = tenant.rent;
      const amountPaid = paymentAmounts[idx] || 0;
      let status: "Paid" | "Missing" | "Partial" = "Missing";

      if (amountPaid >= amountDue) {
        status = "Paid";
      } else if (amountPaid > 0 && amountPaid < amountDue) {
        status = "Partial";
      }

      const balance = amountPaid >= amountDue ? 0 : amountDue - amountPaid;

      if (amountPaid > 0 && saveToStore) {
        addPayment({
          tenantId: tenant.id,
          tenantName: tenant.name,
          unit: tenant.unit,
          amount: amountPaid,
          dueDate: `${mObj.month} ${mObj.year}`,
          paidDate: new Date().toLocaleDateString(),
          method: paymentMethod,
          status,
        });
      }

      statuses.push({
        month: `${mObj.month} ${mObj.year}`,
        amountDue,
        amountPaid,
        status,
        balance,
      });
    });
    return statuses;
  };

  const generatePayment = () => {
    processPayments(true);
    alert("Payment record(s) saved successfully!");
  };

  const generatePDF = () => {
    if (!tenant) return;
    const statuses = processPayments(false);
    const totalBalance = statuses.reduce((s, m) => s + m.balance, 0);
    const totalPaid = statuses.reduce((s, m) => s + m.amountPaid, 0);

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Tenant Rent Receipt", 105, 15, undefined, undefined, "center");
    doc.setFontSize(12);
    doc.text(`Name: ${tenant.name}`, 10, 30);
    doc.text(`Unit: ${tenant.unit}`, 10, 38);
    doc.text(`Contact: ${tenant.phone}`, 10, 46);
    doc.text(`Payment Method: ${paymentMethod}`, 10, 54);

    const startY = 70;
    doc.text("Month", 10, startY);
    doc.text("Due", 50, startY);
    doc.text("Paid", 90, startY);
    doc.text("Status", 130, startY);
    doc.text("Balance", 170, startY);

    let y = startY + 8;
    statuses.forEach((m) => {
      doc.text(m.month, 10, y);
      doc.text(m.amountDue.toLocaleString(), 50, y);
      doc.text(m.amountPaid.toLocaleString(), 90, y);
      doc.text(m.status, 130, y);
      doc.text(m.balance.toLocaleString(), 170, y);
      y += 8;
    });

    y += 10;
    doc.text(`Total Paid: KSh ${totalPaid.toLocaleString()}`, 10, y);
    y += 8;
    doc.text(`Total Balance Due: KSh ${totalBalance.toLocaleString()}`, 10, y);
    doc.save(`${tenant.name.replace(/\s+/g, "")}_${currentYear}.pdf`);
  };

  const handleTenantChange = (tenantId: number | null) => {
    setSelectedTenantId(tenantId);
    setPaidMonths([]);
    setPaymentAmounts({});
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Tenant Receipt Generation</h2>

      <div>
        <label className="block font-medium mb-1">Select Property</label>
        <select
          value={selectedBlock}
          onChange={(e) => {
            setSelectedBlock(e.target.value);
            setSelectedTenantId(null);
            setPaidMonths([]);
            setPaymentAmounts({});
          }}
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

      <div>
        <label className="block font-medium mb-1">Select Tenant</label>
        <select
          value={selectedTenantId ?? ""}
          onChange={(e) =>
            handleTenantChange(e.target.value ? Number(e.target.value) : null)
          }
          className="border rounded px-3 py-2 w-full max-w-sm"
          disabled={!selectedBlock}
        >
          <option value="">-- Select Tenant --</option>
          {filteredTenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.unit})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium mb-1">Payment Method</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-sm"
        >
          <option value="M-PESA via Paybill">M-PESA via Paybill</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>

      <div>
        <p className="font-medium mb-3">Select Paid Months & Input Amounts</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl">
          {leaseMonths.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border border-gray-200 rounded-lg p-2 shadow-sm"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={paidMonths.includes(idx)}
                  onChange={() => toggleMonth(idx)}
                  disabled={!tenant}
                  className="w-4 h-4"
                />
                <span className="font-medium">
                  {m.month} {m.year}
                </span>
              </div>
              <input
                type="number"
                min={0}
                placeholder="Amount"
                value={paymentAmounts[idx] || ""}
                onChange={onPaymentAmountChange(idx)}
                disabled={!paidMonths.includes(idx)}
                className="w-28 border border-gray-300 rounded px-2 py-1 text-right"
              />
            </div>
          ))}
        </div>
      </div>

      {tenant && (
        <div className="flex space-x-4">
          <button
            onClick={generatePayment}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Generate Payment
          </button>
          <button
            onClick={generatePDF}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
