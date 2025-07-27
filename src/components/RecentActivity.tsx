interface Payment {
  tenantName: string;
  amount: number;
  paidDate: string;
  block?: string; // optional since PaymentsPage saves it
}

interface RecentActivityProps {
  payments: Payment[];
}

export function RecentActivity({ payments }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {payments.length === 0 && (
          <p className="text-gray-500">No recent payments.</p>
        )}
        {payments.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {p.tenantName} paid KSh {p.amount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {p.paidDate
                  ? new Date(p.paidDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'No date'}{' '}
                - {p.block || ''}
              </p>
            </div>
            {/* No status since PaymentsPage doesn’t save it */}
          </div>
        ))}
      </div>
    </div>
  );
}
