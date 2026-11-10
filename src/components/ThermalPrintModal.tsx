import React, { useState } from 'react';
import {
  Printer,
  X,
  Bluetooth,
  Usb,
  Copy,
  Check,
  FileText,
  Sliders,
  DollarSign,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ThermalReceiptData, ThermalPaperWidth } from '../types.ts';
import logoImg from '../assets/images/b2b_supply_tracker_logo_1787039083352.jpg';
import {
  generateAsciiReceipt,
  printThermalReceiptViaBrowser,
  printViaWebBluetooth,
} from '../lib/thermalPrinter.ts';

export const ThermalPrintModal: React.FC = () => {
  const {
    isThermalPrintModalOpen,
    setIsThermalPrintModalOpen,
    thermalReceiptPrefill,
    userProfile,
    organizationProfile,
    currency,
    formatMoney,
    showToast,
  } = useApp();

  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidth>('58mm');
  const [shopName, setShopName] = useState(
    organizationProfile?.companyName || userProfile?.shopName || 'Mwangi Global Traders Ltd'
  );
  const [shopAddress, setShopAddress] = useState(
    organizationProfile?.addressStreet
      ? `${organizationProfile.addressStreet}, ${organizationProfile.city || ''}`
      : 'Enterprise Road, Industrial Area'
  );
  const [shopPhone, setShopPhone] = useState(organizationProfile?.phone || '+254 700 123 456');
  const [taxNumber, setTaxNumber] = useState(organizationProfile?.taxNumber || 'P051928471Z');
  const [footerNote, setFooterNote] = useState('THANK YOU FOR YOUR BUSINESS!');
  const [isCopied, setIsCopied] = useState(false);
  const [isBluetoothConnecting, setIsBluetoothConnecting] = useState(false);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState('');

  if (!isThermalPrintModalOpen) return null;

  const defaultItems = [
    { name: 'Cold-Pressed Sunflower Oil 1L', qty: 2, price: 14.5, total: 29.0 },
    { name: 'Organic Jasmine Rice 5kg', qty: 1, price: 24.0, total: 24.0 },
    { name: 'Pure Clover Honey 500g', qty: 3, price: 9.0, total: 27.0 },
  ];

  const receiptData: ThermalReceiptData = {
    shopName: shopName || 'Retail Kiosk ERP',
    shopAddress,
    shopPhone,
    taxNumber,
    receiptNumber: thermalReceiptPrefill?.receiptNumber || `POS-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cashierName: userProfile?.displayName || 'Active Cashier',
    customerName: thermalReceiptPrefill?.customerName || 'Walk-in Retail Customer',
    customerPhone: thermalReceiptPrefill?.customerPhone || '+91 98200 00000',
    items: thermalReceiptPrefill?.items || defaultItems,
    subtotal: thermalReceiptPrefill?.subtotal || 80.0,
    discount: thermalReceiptPrefill?.discount || 0,
    taxAmount: thermalReceiptPrefill?.taxAmount || 9.6,
    grandTotal: thermalReceiptPrefill?.grandTotal || 89.6,
    paymentMode: thermalReceiptPrefill?.paymentMode || 'Cash / UPI',
    amountReceived: thermalReceiptPrefill?.amountReceived || 100.0,
    changeDue: thermalReceiptPrefill?.changeDue || 10.4,
    runningBalance: thermalReceiptPrefill?.runningBalance || 0,
    footerNote,
    paperWidth,
  };

  const asciiPreview = generateAsciiReceipt(receiptData);

  const handlePrint = () => {
    printThermalReceiptViaBrowser(receiptData);
    showToast(`Sending print job to ${paperWidth} thermal printer`, 'success');
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(asciiPreview);
    setIsCopied(true);
    showToast('ESC/POS raw receipt copied to clipboard', 'info');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleConnectBluetooth = async () => {
    setIsBluetoothConnecting(true);
    try {
      const res = await printViaWebBluetooth(receiptData);
      if (res.success) {
        setBluetoothConnected(true);
        setConnectedDeviceName(res.deviceName || 'Bluetooth POS');
        showToast(`Printed directly via Bluetooth to ${res.deviceName || 'POS Printer'}!`, 'success');
      } else {
        showToast(res.error || 'Bluetooth selection cancelled. Dispatched to browser print dialog.', 'info');
        printThermalReceiptViaBrowser(receiptData);
      }
    } catch (err: any) {
      showToast(err.message || 'Bluetooth connection failed', 'error');
    } finally {
      setIsBluetoothConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-blue-500/10 via-cyan-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={logoImg}
                alt="B2B Supply Tracker"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                POS & Thermal Printer Support
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct ESC/POS receipt generation for 58mm (2-inch) and 80mm (3-inch) Bluetooth/USB thermal printers
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsThermalPrintModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Settings Controls */}
          <div className="lg:col-span-5 space-y-4">
            {/* Paper Width Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Thermal Paper Width</span>
                <span className="text-[11px] font-normal text-slate-500">ESC/POS Formatter</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paperWidth === '58mm'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold">58mm (2-inch)</div>
                  <div className="text-[11px] opacity-75">32 Columns (Standard POS)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paperWidth === '80mm'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-bold">80mm (3-inch)</div>
                  <div className="text-[11px] opacity-75">48 Columns (Wide POS)</div>
                </button>
              </div>
            </div>

            {/* Receipt Header Inputs */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Shop Header Title
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Store Contact Phone
                  </label>
                  <input
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Store Address
                </label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Footer Message
                </label>
                <input
                  type="text"
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Hardware Connect Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Bluetooth className="w-4 h-4 text-blue-500" /> Bluetooth / USB Hardware
                </span>
                {bluetoothConnected ? (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {connectedDeviceName || 'Paired'}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">Ready</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct Web-Bluetooth / Web-USB auto-connect for Epson, Xprinter, Rongta, Munbyn, and ZJ-5802 devices.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConnectBluetooth}
                  disabled={isBluetoothConnecting}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  {isBluetoothConnecting ? 'Connecting...' : bluetoothConnected ? 'Print via BLE' : 'Pair Bluetooth'}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Usb className="w-3.5 h-3.5" /> System Print
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Thermal ASCII Preview */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Live Receipt Paper Simulation ({paperWidth})
              </span>
              <button
                type="button"
                onClick={handleCopyRaw}
                className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Copied' : 'Copy ESC/POS'}
              </button>
            </div>

            {/* Receipt Container */}
            <div className="w-full max-w-sm bg-amber-50/40 dark:bg-slate-950 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-inner flex flex-col items-center">
              <div
                className={`bg-white text-black p-4 shadow-md font-mono text-[11px] leading-tight rounded-xs select-all overflow-x-auto whitespace-pre ${
                  paperWidth === '58mm' ? 'w-[280px]' : 'w-[360px]'
                }`}
                style={{ fontFamily: '"Courier New", Courier, monospace' }}
              >
                {asciiPreview}
              </div>
            </div>

            {/* Print Action Bar */}
            <div className="w-full max-w-sm mt-4 flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Thermal Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
