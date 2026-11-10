import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Key,
  X,
  Check,
  Lock,
  Smartphone,
  Mail,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { UserRole, StaffMember } from '../types.ts';
import { ROLE_PERMISSIONS, getRoleBadgeInfo } from '../lib/rbac.ts';

export const StaffManagementModal: React.FC = () => {
  const {
    isStaffModalOpen,
    setIsStaffModalOpen,
    activeRole,
    setActiveRole,
    staffMembers,
    setStaffMembers,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'switch' | 'manage'>('switch');
  const [selectedStaffToSwitch, setSelectedStaffToSwitch] = useState<StaffMember | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // New staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('cashier');
  const [newStaffPin, setNewStaffPin] = useState('');

  if (!isStaffModalOpen) return null;

  const handleRoleSwitch = (staff: StaffMember) => {
    setSelectedStaffToSwitch(staff);
    setEnteredPin('');
    setPinError(false);
  };

  const handleConfirmPinSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffToSwitch) return;

    if (enteredPin === selectedStaffToSwitch.pinCode) {
      setActiveRole(selectedStaffToSwitch.role);
      showToast(`Switched active terminal role to: ${selectedStaffToSwitch.name} (${selectedStaffToSwitch.role.toUpperCase()})`, 'success');
      setSelectedStaffToSwitch(null);
      setEnteredPin('');
      setIsStaffModalOpen(false);
    } else {
      setPinError(true);
      showToast('Incorrect 4-Digit Staff PIN', 'error');
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffPin) {
      showToast('Name and 4-digit PIN are required', 'error');
      return;
    }

    const colors = [
      'bg-indigo-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-purple-600 text-white',
      'bg-rose-600 text-white',
    ];

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      email: newStaffEmail || `${newStaffName.toLowerCase().replace(/\s+/g, '')}@retailmart.com`,
      role: newStaffRole,
      pinCode: newStaffPin,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      status: 'active',
      lastActive: 'Just added',
      createdAt: new Date().toISOString(),
    };

    setStaffMembers([...staffMembers, newMember]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPin('');
    showToast(`Staff member ${newMember.name} added as ${newMember.role.toUpperCase()}`, 'success');
    setActiveTab('switch');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-purple-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Multi-User Role & Staff Terminal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch staff roles (Owner, Manager, Cashier, Accountant) with PIN code verification
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsStaffModalOpen(false);
              setSelectedStaffToSwitch(null);
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pt-4 pb-2 flex gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('switch');
              setSelectedStaffToSwitch(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'switch'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 inline mr-1.5" /> Switch Active Staff ({staffMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'manage'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 inline mr-1.5" /> Add New Staff Member
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'switch' && (
            <div className="space-y-4">
              {/* PIN Verification Modal step */}
              {selectedStaffToSwitch ? (
                <form onSubmit={handleConfirmPinSwitch} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-4 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Enter PIN for {selectedStaffToSwitch.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Default demo PIN: <span className="font-mono font-bold text-purple-600">{selectedStaffToSwitch.pinCode}</span>
                    </p>
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    autoFocus
                    placeholder="• • • •"
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError(false);
                    }}
                    className={`w-36 mx-auto text-center text-xl tracking-widest font-mono py-2 rounded-xl border bg-white dark:bg-slate-900 focus:outline-hidden ${
                      pinError
                        ? 'border-rose-500 text-rose-600 ring-1 ring-rose-500'
                        : 'border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStaffToSwitch(null)}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-500"
                    >
                      Unlock Role
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {staffMembers.map((member) => {
                    const badge = getRoleBadgeInfo(member.role);
                    const isCurrent = member.role === activeRole;

                    return (
                      <div
                        key={member.id}
                        onClick={() => handleRoleSwitch(member)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isCurrent
                            ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 ring-1 ring-purple-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${member.avatarColor}`}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                {member.name}
                                {isCurrent && (
                                  <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <span className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {badge.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                          <span>PIN: • • • •</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">Tap to Switch ➔</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Permissions Matrix Overview */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-purple-600" /> Granular Access Limits by Role
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                    <strong className="block text-slate-900 dark:text-white">Owner</strong>
                    Unrestricted full access + Staff Admin
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                    <strong className="block text-slate-900 dark:text-white">Manager</strong>
                    Inventory, POs, Customer Credit
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                    <strong className="block text-slate-900 dark:text-white">Cashier</strong>
                    Payments, POS Thermal Print
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                    <strong className="block text-slate-900 dark:text-white">Accountant</strong>
                    Audit, Reconciliation, P&L, Reports
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <form onSubmit={handleAddStaff} className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Staff Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Nair"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    System Role
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="cashier">Counter Cashier</option>
                    <option value="manager">Store Manager</option>
                    <option value="accountant">Chartered Accountant</option>
                    <option value="owner">Co-Owner</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    4-Digit Terminal PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="e.g. 5566"
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono tracking-widest"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Staff Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="priya.nair@retailmart.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('switch')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-500 shadow-xs"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
