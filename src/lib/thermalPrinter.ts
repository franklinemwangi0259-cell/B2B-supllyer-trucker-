/**
 * POS & Thermal Printer Formatting Engine
 * Supports 58mm (32 characters per line) and 80mm (48 characters per line) ESC/POS outputs
 * Includes native Web Bluetooth (BLE), WebUSB, and silent iframe printing support.
 */

import { ThermalReceiptData } from '../types.ts';

export function generateAsciiReceipt(data: ThermalReceiptData): string {
  const is58 = data.paperWidth === '58mm';
  const width = is58 ? 32 : 48;

  const center = (text: string) => {
    if (text.length >= width) return text.slice(0, width);
    const leftPad = Math.floor((width - text.length) / 2);
    return ' '.repeat(leftPad) + text;
  };

  const line = (char = '-') => char.repeat(width);

  const row = (left: string, right: string) => {
    const spaceNeeded = width - left.length - right.length;
    if (spaceNeeded < 1) {
      const truncatedLeft = left.slice(0, width - right.length - 1);
      return truncatedLeft + ' ' + right;
    }
    return left + ' '.repeat(spaceNeeded) + right;
  };

  let out = '';
  out += center('*** TAX INVOICE ***') + '\n';
  out += center(data.shopName.toUpperCase()) + '\n';
  if (data.shopAddress) out += center(data.shopAddress) + '\n';
  if (data.shopPhone) out += center(`Tel: ${data.shopPhone}`) + '\n';
  if (data.taxNumber) out += center(`GST/VAT: ${data.taxNumber}`) + '\n';
  out += line('=') + '\n';

  out += row(`Rcpt: #${data.receiptNumber}`, `${data.date} ${data.time}`) + '\n';
  out += row(`Cashier: ${data.cashierName}`, `Pay: ${data.paymentMode}`) + '\n';
  if (data.customerName) {
    out += row(`Customer: ${data.customerName}`, data.customerPhone || '') + '\n';
  }
  out += line('-') + '\n';

  // Items header
  if (is58) {
    out += row('ITEM (QTY x PRICE)', 'TOTAL') + '\n';
  } else {
    out += row('ITEM DESCRIPTION', 'QTY x PRICE   AMOUNT') + '\n';
  }
  out += line('-') + '\n';

  data.items.forEach((item) => {
    if (is58) {
      out += item.name + '\n';
      out += row(`  ${item.qty} x ${item.price.toFixed(2)}`, item.total.toFixed(2)) + '\n';
    } else {
      const priceQtyStr = `${item.qty} x ${item.price.toFixed(2)}`;
      out += row(item.name.slice(0, 24), `${priceQtyStr.padStart(12)} ${item.total.toFixed(2).padStart(8)}`) + '\n';
    }
  });

  out += line('-') + '\n';
  out += row('Subtotal:', data.subtotal.toFixed(2)) + '\n';
  if (data.discount && data.discount > 0) {
    out += row('Discount:', `-${data.discount.toFixed(2)}`) + '\n';
  }
  out += row('Tax (GST/VAT):', data.taxAmount.toFixed(2)) + '\n';
  out += line('=') + '\n';
  out += row('GRAND TOTAL:', `${data.grandTotal.toFixed(2)}`) + '\n';
  out += line('=') + '\n';

  if (data.amountReceived !== undefined) {
    out += row('Amount Tendered:', data.amountReceived.toFixed(2)) + '\n';
    out += row('Change Due:', (data.changeDue || 0).toFixed(2)) + '\n';
  }

  if (data.runningBalance !== undefined && data.runningBalance > 0) {
    out += line('-') + '\n';
    out += row('PREV KHATA BAL:', data.runningBalance.toFixed(2)) + '\n';
  }

  out += '\n' + center(data.footerNote || 'THANK YOU FOR YOUR BUSINESS!') + '\n';
  out += center('Goods once sold are non-refundable') + '\n';
  out += center('Scan QR on e-receipt to pay online') + '\n';
  out += '\n\n\n'; // Feed & Cut spacing

  return out;
}

/**
 * Generates raw ESC/POS binary command buffer for direct hardware printers
 */
export function generateEscPosBinary(data: ThermalReceiptData): Uint8Array {
  const ascii = generateAsciiReceipt(data);
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(ascii);

  // ESC/POS Commands
  const ESC_INIT = [0x1B, 0x40]; // Initialize printer
  const ESC_ALIGN_CENTER = [0x1B, 0x61, 0x01]; // Center align
  const ESC_CUT = [0x1D, 0x56, 0x41, 0x10]; // Cut paper
  const FEED_LINES = [0x0A, 0x0A, 0x0A]; // Feed 3 lines

  const totalLength = ESC_INIT.length + textBytes.length + FEED_LINES.length + ESC_CUT.length;
  const result = new Uint8Array(totalLength);

  let offset = 0;
  result.set(ESC_INIT, offset);
  offset += ESC_INIT.length;

  result.set(textBytes, offset);
  offset += textBytes.length;

  result.set(FEED_LINES, offset);
  offset += FEED_LINES.length;

  result.set(ESC_CUT, offset);
  return result;
}

/**
 * Direct Web Bluetooth connection to hardware ESC/POS receipt printers
 */
export async function printViaWebBluetooth(receiptData: ThermalReceiptData): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
    return { success: false, error: 'Web Bluetooth is not supported in this browser. Please use Chrome/Edge or standard print.' };
  }

  try {
    const navBt = (navigator as any).bluetooth;
    const device = await navBt.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS BLE Service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000e0ff-3c17-d293-8e48-14fe2e4da212',
      ],
    });

    if (!device.gatt) {
      throw new Error('Bluetooth device does not support GATT');
    }

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    if (!services || services.length === 0) {
      throw new Error('No compatible POS printing service found on device');
    }

    let writeCharacteristic: any = null;
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          writeCharacteristic = char;
          break;
        }
      }
      if (writeCharacteristic) break;
    }

    if (!writeCharacteristic) {
      throw new Error('No writeable characteristic found on printer');
    }

    const binaryData = generateEscPosBinary(receiptData);
    // Send in 100-byte chunks to prevent MTU overrun
    const chunkSize = 100;
    for (let i = 0; i < binaryData.length; i += chunkSize) {
      const chunk = binaryData.slice(i, i + chunkSize);
      if (writeCharacteristic.writeValueWithoutResponse) {
        await writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await writeCharacteristic.writeValue(chunk);
      }
    }

    return { success: true, deviceName: device.name || 'Bluetooth POS Printer' };
  } catch (err: any) {
    console.error('Web Bluetooth Print Error:', err);
    return { success: false, error: err.message || 'Bluetooth connection failed' };
  }
}

/**
 * Universal browser print handler using silent iframe (works in Sandboxed/iFrame environments)
 */
export function printThermalReceiptViaBrowser(receiptData: ThermalReceiptData): void {
  const ascii = generateAsciiReceipt(receiptData);
  const is58 = receiptData.paperWidth === '58mm';
  const widthMm = is58 ? '58mm' : '80mm';

  // Create or reuse hidden iframe
  let iframe = document.getElementById('thermal-print-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Thermal Receipt #${receiptData.receiptNumber}</title>
        <style>
          @page {
            size: ${widthMm} auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${is58 ? '11px' : '12px'};
            line-height: 1.25;
            margin: 0;
            padding: 8px 4px;
            width: ${widthMm};
            color: #000;
            background: #fff;
            box-sizing: border-box;
          }
          pre {
            white-space: pre-wrap;
            word-break: break-all;
            margin: 0;
            font-family: inherit;
          }
          @media print {
            body { width: 100%; }
          }
        </style>
      </head>
      <body>
        <pre>${ascii}</pre>
      </body>
    </html>
  `;

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  } else {
    // Fallback to window.open
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }
}

