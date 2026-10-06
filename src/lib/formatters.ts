// =====================================================================
// INDIAN LOCALIZATION FORMATTERS & UTILITIES
// =====================================================================

/**
 * Format number into Indian Rupees (INR) with Indian digit grouping:
 * e.g. 5000 -> "₹5,000", 250000 -> "₹2,50,000"
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absAmount);

  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Format ISO or YYYY-MM-DD date to DD-MM-YYYY
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If simple YYYY-MM-DD string
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      }
      return dateString;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Format to 12-hour time format with AM/PM (e.g. "09:30 AM")
 */
export function formatTime12(timeString: string | null | undefined): string {
  if (!timeString) return '-';
  // Handles "09:30", "09:30:00", or ISO date string
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (isNaN(hours)) return timeString;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12 AM
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${minutes} ${ampm}`;
  }
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return timeString;
  }
}

/**
 * Format Date & Time: DD-MM-YYYY, 09:30 AM
 */
export function formatDateTime(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return '-';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = formatTime12(date.toTimeString().slice(0, 5));
    return `${day}-${month}-${year}, ${time}`;
  } catch {
    return dateTimeString;
  }
}

/**
 * Format 10-digit Indian Mobile: "+91 98765 43210"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return phone;
}

/**
 * Generate WhatsApp Web link with prefilled text
 */
export function getWhatsAppUrl(mobile: string, message: string): string {
  const clean = mobile.replace(/\D/g, '');
  const phone = clean.startsWith('91') && clean.length === 12 ? clean : `91${clean.slice(-10)}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate tel: link
 */
export function getTelUrl(mobile: string): string {
  const clean = mobile.replace(/\D/g, '');
  return `tel:+91${clean.slice(-10)}`;
}

/**
 * Today's date in YYYY-MM-DD format (IST)
 */
export function getTodayIST(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
