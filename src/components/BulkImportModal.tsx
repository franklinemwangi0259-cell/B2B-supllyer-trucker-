import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Users, Upload, CheckCircle2, FileSpreadsheet, X, Sparkles } from 'lucide-react';

export const BulkImportModal: React.FC = () => {
  const { isBulkImportModalOpen, setIsBulkImportModalOpen, addCustomer, addSupplier, showToast } = useApp();

  const [activeType, setActiveType] = useState<'customers' | 'suppliers'>('customers');
  const [csvText, setCsvText] = useState('');

  if (!isBulkImportModalOpen) return null;

  const sampleCustomersData = `Name,Phone,OpeningBalance,CreditLimit,Address
Suresh General Store,+91 98221 44556,1200,10000,Station Road Market
Anjali Beauty Parlour,+91 98332 55667,450,5000,Civil Lines Block C
Deepak Sweet House,+91 98443 66778,2800,15000,Clock Tower Chowk
Mehta Medical Store,+91 98554 77889,650,8000,Opposite Civil Hospital
Vijay Pan Corner,+91 98665 88990,120,2000,Near Bus Stand`;

  const sampleSuppliersData = `Name,Category,Phone,PaymentTerms,CreditLimit
Metro Spices & Condiments,FMCG Wholesale,+91 98111 00223,Net 14,25000
Sunrise Edible Oils,Edibles & Grains,+91 98222 00334,Net 30,50000
Pioneer Packaging Solutions,Containers & Boxes,+91 98333 00445,COD,15000`;

  const handleImportSample = () => {
    if (activeType === 'customers') {
      const rows = [
        { name: 'Suresh General Store', phone: '+91 98221 44556', currentBalance: 1200, creditLimit: 10000, address: 'Station Road Market' },
        { name: 'Anjali Beauty Parlour', phone: '+91 98332 55667', currentBalance: 450, creditLimit: 5000, address: 'Civil Lines Block C' },
        { name: 'Deepak Sweet House', phone: '+91 98443 66778', currentBalance: 2800, creditLimit: 15000, address: 'Clock Tower Chowk' },
        { name: 'Mehta Medical Store', phone: '+91 98554 77889', currentBalance: 650, creditLimit: 8000, address: 'Opposite Civil Hospital' },
        { name: 'Vijay Pan Corner', phone: '+91 98665 88990', currentBalance: 120, creditLimit: 2000, address: 'Near Bus Stand' },
      ];
      rows.forEach((r) => addCustomer(r));
      showToast(`Imported ${rows.length} sample customers into Customer Accounts!`, 'success');
    } else {
      const rows = [
        { name: 'Metro Spices & Condiments', category: 'FMCG Wholesale', phone: '+91 98111 00223', paymentTerms: 'Net 14', creditLimit: 25000, currentBalance: 3200 },
        { name: 'Sunrise Edible Oils', category: 'Edibles & Grains', phone: '+91 98222 00334', paymentTerms: 'Net 30', creditLimit: 50000, currentBalance: 4800 },
        { name: 'Pioneer Packaging Solutions', category: 'Containers & Boxes', phone: '+91 98333 00445', paymentTerms: 'COD', creditLimit: 15000, currentBalance: 950 },
      ];
      rows.forEach((r) => addSupplier(r));
      showToast(`Imported ${rows.length} sample suppliers into Supplier Accounts!`, 'success');
    }
    setIsBulkImportModalOpen(false);
  };

  const handleParseAndImportCSV = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.toLowerCase().startsWith('name')) continue;
      const cols = line.split(',').map((c) => c.trim());
      if (cols.length >= 2) {
        if (activeType === 'customers') {
          addCustomer({
            name: cols[0],
            phone: cols[1] || '+91 98000 00000',
            currentBalance: parseFloat(cols[2]) || 0,
            creditLimit: parseFloat(cols[3]) || 5000,
            address: cols[4] || '',
          });
        } else {
          addSupplier({
            name: cols[0],
            category: cols[1] || 'General Wholesale',
            phone: cols[2] || '',
            paymentTerms: cols[3] || 'Net 14',
            creditLimit: parseFloat(cols[4]) || 20000,
            currentBalance: parseFloat(cols[5]) || 0,
          });
        }
        count++;
      }
    }

    showToast(`Successfully imported ${count} ${activeType}!`, 'success');
    setIsBulkImportModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Bulk Import Contacts / Accounts</h2>
              <p className="text-xs text-slate-400">Import your phone contacts or spreadsheet entries</p>
            </div>
          </div>
          <button
            onClick={() => setIsBulkImportModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target Type Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveType('customers')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeType === 'customers'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Import Customers (You'll Get)
            </button>
            <button
              onClick={() => setActiveType('suppliers')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeType === 'suppliers'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Import Suppliers (You'll Give)
            </button>
          </div>

          {/* Quick Preset 1-Click Demo Seed */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">
                  1-Click Sample Import
                </span>
              </div>
              <button
                onClick={handleImportSample}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                Load {activeType === 'customers' ? '5 Sample Customers' : '3 Sample Suppliers'}
              </button>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Instantly populate your accounts with realistic {activeType} to test running balances, WhatsApp reminders, and trade statements.
            </p>
          </div>

          {/* CSV Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Or Paste CSV Data
            </label>
            <textarea
              rows={5}
              placeholder={activeType === 'customers' ? sampleCustomersData : sampleSuppliersData}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Format: Name, Phone, Balance, CreditLimit, Address/Category
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsBulkImportModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleParseAndImportCSV}
              disabled={!csvText.trim()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import from CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
