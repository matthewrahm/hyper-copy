import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatBps(value: number): string {
  return `${value.toFixed(1)}bp`;
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatRate(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(6)}`;
}

export function formatCurrency(value: number): string {
  const sign = value >= 0 ? "" : "-";
  return `${sign}$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function rateColor(value: number): string {
  if (value > 0) return "text-profit";
  if (value < 0) return "text-loss";
  return "text-secondary";
}

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatDollarValue(pct: number, accountValue: number): string {
  if (accountValue <= 0) return "";
  return formatCurrency(accountValue * pct / 100);
}

export function getTradingStyle(avgHoldHours: number, freqPerDay: number): string {
  let style = "";
  if (avgHoldHours > 48) style = "Position trader";
  else if (avgHoldHours > 12) style = "Swing trader";
  else if (avgHoldHours > 1) style = "Day trader";
  else style = "Scalper";

  if (freqPerDay > 10) style += ", highly active";
  else if (freqPerDay > 3) style += ", moderately active";
  else style += ", selective";

  return style;
}
