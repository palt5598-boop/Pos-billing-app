import { Bill, ShopSettings } from '../types';

export function formatReceiptText(bill: Bill, settings: ShopSettings): string {
  const dateFormatted = new Date(bill.dateTime).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const divider = '━━━━━━━━━━━━━━━━━━━━━━━';
  const lines: string[] = [
    `🧾 *${settings.shopName.toUpperCase()}*`,
  ];

  if (settings.shopAddress) {
    lines.push(`📍 ${settings.shopAddress}`);
  }
  if (settings.shopPhone) {
    lines.push(`📞 ${settings.shopPhone}`);
  }

  lines.push(divider);
  lines.push(`*Bill No:* #${bill.billNumber}`);
  lines.push(`*Date:* ${dateFormatted}`);
  lines.push(`*Customer:* ${bill.customerName || 'Walk-in customer'}${bill.customerPhone ? ` (${bill.customerPhone})` : ''}`);
  lines.push(`*Payment:* ${bill.paymentMode}`);
  lines.push(divider);
  lines.push('*ITEMS:*');

  bill.items.forEach((item, index) => {
    const itemTotal = item.priceAtSale * item.qty;
    lines.push(`${index + 1}. *${item.name}*`);
    lines.push(`   ${item.qty} × ${settings.currencySymbol}${item.priceAtSale} = *${settings.currencySymbol}${itemTotal}*`);
  });

  lines.push(divider);
  lines.push(`💰 *TOTAL AMOUNT: ${settings.currencySymbol}${bill.total}*`);
  lines.push(divider);
  lines.push('✨ Thank you for visiting! Please visit again.');

  return lines.join('\n');
}

export function openWhatsAppShare(bill: Bill, settings: ShopSettings): void {
  const text = formatReceiptText(bill, settings);
  const encodedText = encodeURIComponent(text);

  let url = `https://api.whatsapp.com/send?text=${encodedText}`;
  if (bill.customerPhone) {
    // strip non-numeric
    let cleanedPhone = bill.customerPhone.replace(/\D/g, '');
    if (cleanedPhone.length === 10) {
      cleanedPhone = `91${cleanedPhone}`; // standard country prefix for 10-digit mobile
    }
    url = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function generateReceiptImageBlob(bill: Bill, settings: ShopSettings): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Thermal paper style dimensions
  const width = 500;
  const padding = 32;
  const contentWidth = width - padding * 2;

  // Estimate height dynamically based on item count
  const baseHeight = 360;
  const itemLineHeight = 52;
  const totalHeight = baseHeight + bill.items.length * itemLineHeight;

  canvas.width = width * 2; // high-dpi
  canvas.height = totalHeight * 2;
  ctx.scale(2, 2);

  // Background - clean thermal paper off-white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, totalHeight);

  // Decorative receipt header line
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, 6);

  let y = 36;

  // Shop Name
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText(settings.shopName, width / 2, y);

  y += 20;
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#6B7280';
  if (settings.shopAddress) {
    ctx.fillText(settings.shopAddress, width / 2, y);
    y += 16;
  }
  if (settings.shopPhone) {
    ctx.fillText(`Phone: ${settings.shopPhone}`, width / 2, y);
    y += 18;
  }

  // Dotted divider
  const drawDottedLine = (posY: number) => {
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1.5;
    ctx.moveTo(padding, posY);
    ctx.lineTo(width - padding, posY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  drawDottedLine(y);
  y += 18;

  // Bill metadata (two columns)
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#1F2937';
  ctx.fillText(`BILL: #${bill.billNumber}`, padding, y);

  ctx.textAlign = 'right';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#4B5563';
  const dtStr = new Date(bill.dateTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  ctx.fillText(dtStr, width - padding, y);

  y += 18;
  ctx.textAlign = 'left';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Customer: ${bill.customerName || 'Walk-in customer'}`, padding, y);

  ctx.textAlign = 'right';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = bill.paymentMode === 'UPI' ? '#0D9488' : bill.paymentMode === 'Card' ? '#4F46E5' : '#059669';
  ctx.fillText(`Mode: ${bill.paymentMode}`, width - padding, y);

  y += 16;
  drawDottedLine(y);
  y += 20;

  // Items table header
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#6B7280';
  ctx.fillText('ITEM', padding, y);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', padding + contentWidth * 0.58, y);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', width - padding, y);

  y += 12;

  // Items rows
  bill.items.forEach((item) => {
    y += 18;
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#111827';
    // truncate if too long
    let name = item.name;
    if (name.length > 28) name = name.slice(0, 26) + '…';
    ctx.fillText(name, padding, y);

    ctx.textAlign = 'center';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#4B5563';
    ctx.fillText(String(item.qty), padding + contentWidth * 0.58, y);

    ctx.textAlign = 'right';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(`${settings.currencySymbol}${item.priceAtSale * item.qty}`, width - padding, y);

    y += 14;
    ctx.textAlign = 'left';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText(`@ ${settings.currencySymbol}${item.priceAtSale} each`, padding, y);
  });

  y += 16;
  drawDottedLine(y);
  y += 24;

  // Grand Total Box
  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(padding, y - 16, contentWidth, 40);

  ctx.textAlign = 'left';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('TOTAL AMOUNT', padding + 12, y + 8);

  ctx.textAlign = 'right';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.fillText(`${settings.currencySymbol}${bill.total}`, width - padding - 12, y + 9);

  y += 42;

  // Footer message
  ctx.textAlign = 'center';
  ctx.font = 'italic 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#6B7280';
  ctx.fillText('Thank you for shopping with us!', width / 2, y);

  y += 14;
  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#9CA3AF';
  ctx.fillText('Generated by CICADA Shop POS', width / 2, y);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

export async function shareOrDownloadReceiptImage(bill: Bill, settings: ShopSettings): Promise<void> {
  const blob = await generateReceiptImageBlob(bill, settings);
  if (!blob) return;

  const fileName = `Bill-${bill.billNumber}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  // Try native navigator.share if files are supported
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Bill #${bill.billNumber} - ${settings.shopName}`,
        text: `Receipt for bill #${bill.billNumber} from ${settings.shopName}. Total: ${settings.currencySymbol}${bill.total}`,
      });
      return;
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Navigator share failed, falling back to download', e);
      } else {
        return; // user cancelled share sheet
      }
    }
  }

  // Fallback: direct download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
