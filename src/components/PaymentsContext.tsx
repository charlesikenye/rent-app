import React, { createContext, useContext, useState } from "react";

export interface PaymentRecord {
  tenantId: number;
  tenantName: string;
  unit: string;
  amount: number;
  dueDate: string;
  paidDate: string;
  method: string;
  status: "Paid" | "Missing" | "Partial";
}

interface PaymentsContextProps {
  payments: PaymentRecord[];
  addPayment: (payment: PaymentRecord) => void;
  updatePayment: (payment: PaymentRecord) => void;
}

export const PaymentsContext = createContext<PaymentsContextProps | undefined>(undefined);

export const PaymentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const addPayment = (payment: PaymentRecord) => {
    setPayments((prev) => [...prev, payment]);
  };

  const updatePayment = (updatedPayment: PaymentRecord) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.tenantId === updatedPayment.tenantId && p.dueDate === updatedPayment.dueDate
          ? updatedPayment
          : p
      )
    );
  };

  return (
    <PaymentsContext.Provider value={{ payments, addPayment, updatePayment }}>
      {children}
    </PaymentsContext.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error("usePayments must be used within a PaymentsProvider");
  }
  return context;
};
