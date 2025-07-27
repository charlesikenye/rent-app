import { useEffect, useState } from 'react';
import { Send, Users } from 'lucide-react';
import { initialTenants } from '../data/tenants';

interface Reminder {
  id: number;
  type: string;
  title: string;
  recipients: string[];
  scheduledDate: string;
  status: 'sent' | 'scheduled';
  frequency: string;
  message: string;
}

// ---- Local Storage Helpers ----
const getStoredReminders = (): Reminder[] =>
  JSON.parse(localStorage.getItem('reminders') || '[]');
const saveStoredReminders = (reminders: Reminder[]) =>
  localStorage.setItem('reminders', JSON.stringify(reminders));

export function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showNewReminder, setShowNewReminder] = useState(false);
  const [reminderType, setReminderType] = useState('rent_due');
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [message, setMessage] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');

  useEffect(() => {
    const stored = getStoredReminders();
    const updated = stored.map((r) => ({
      ...r,
      status: new Date(r.scheduledDate) <= new Date() ? 'sent' : r.status
    }));
    setReminders(updated.sort((a, b) => b.id - a.id));
    saveStoredReminders(updated);
  }, []);

  // ---- Add New Reminder ----
  const addReminder = () => {
    if (!scheduleDate || selectedRecipients.length === 0) {
      alert('Please select recipients and a date.');
      return;
    }

    const tenantNames = initialTenants
      .filter((t) => selectedRecipients.includes(t.id))
      .map((t) => t.name);

    const newReminder: Reminder = {
      id: Date.now(),
      type: reminderType,
      title:
        reminderType === 'rent_due'
          ? 'Rent Due Reminder'
          : reminderType === 'late_payment'
          ? 'Late Payment Notice'
          : reminderType === 'lease_renewal'
          ? 'Lease Renewal'
          : 'Maintenance Notice',
      recipients: tenantNames,
      scheduledDate: scheduleDate,
      status: new Date(scheduleDate) <= new Date() ? 'sent' : 'scheduled',
      frequency: 'one-time',
      message: message || ''
    };

    const updated = [newReminder, ...reminders];
    setReminders(updated);
    saveStoredReminders(updated);
    resetForm();
  };

  // ---- Delete Reminder ----
  const deleteReminder = (id: number) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveStoredReminders(updated);
  };

  // ---- Reset Modal ----
  const resetForm = () => {
    setReminderType('rent_due');
    setSelectedRecipients([]);
    setScheduleDate('');
    setMessage('');
    setSelectedBlock('');
    setShowNewReminder(false);
  };

  // ---- Toggle Recipients ----
  const toggleRecipient = (tenantId: number) => {
    setSelectedRecipients((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  // ---- Filter Tenants by Block ----
  const filteredTenants = selectedBlock
    ? initialTenants.filter((t) => t.block === selectedBlock)
    : [];

  const blockDisplayNames: Record<string, string> = {
    OLD: 'EL-HADDAI APARTMENTS OLD BLOCK (Nakuru)',
    NEW: 'EL-HADDAI APARTMENTS NEW BLOCK (Nakuru)',
    NYERI: 'OUTSPAN - KAMAKWA RD (Nyeri)'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Rent Reminders</h2>
        <button
          onClick={() => setShowNewReminder(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Send className="h-4 w-4 mr-2" />
          New Reminder
        </button>
      </div>

      {/* Scheduled Reminders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Scheduled Reminders
          </h3>
        </div>
        {reminders.length === 0 ? (
          <p className="p-6 text-gray-500">No reminders scheduled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reminders.map((reminder) => (
                  <tr key={reminder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{reminder.title}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {reminder.recipients.join(', ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(reminder.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          reminder.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {reminder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Reminder Modal */}
      {showNewReminder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                New Reminder
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Block Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Property Block
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Select Block --</option>
                  {Object.entries(blockDisplayNames).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipients */}
              {selectedBlock && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Recipients
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                    {filteredTenants.map((tenant) => (
                      <label key={tenant.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedRecipients.includes(tenant.id)}
                          onChange={() => toggleRecipient(tenant.id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-900">
                          {tenant.name} ({tenant.unit})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your reminder message..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={addReminder}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Schedule Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

