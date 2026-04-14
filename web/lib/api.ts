const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export interface LeaderboardEntry {
  address: string;
  total_pnl: number;
  roi: number;
  win_rate: number;
  total_trades: number;
  avg_pnl_per_trade: number;
  max_drawdown: number;
  sharpe_ratio: number;
  avg_hold_time_hours: number;
  trade_frequency_per_day: number;
  active_since: number;
  account_value: number;
  score: number;
  scored_at: number;
}

export interface TraderPosition {
  coin: string;
  size: number;
  side: string;
  entry_price: number;
  mark_price: number;
  unrealized_pnl: number;
  leverage: number;
  liquidation_price: number;
  margin_used: number;
  position_value: number;
}

export interface TraderFill {
  coin: string;
  side: string;
  price: number;
  size: number;
  time: number;
  fee: number;
  closed_pnl: number;
  direction: string;
}

export interface TraderProfile {
  score: LeaderboardEntry;
  positions: TraderPosition[];
  recent_fills: TraderFill[];
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function getLeaderboard(limit = 50, sortBy = "score", minTrades = 5) {
  return fetchAPI<LeaderboardEntry[]>(
    `/api/leaderboard?limit=${limit}&sort_by=${sortBy}&min_trades=${minTrades}`
  );
}

export function getTrader(address: string) {
  return fetchAPI<TraderProfile>(`/api/trader/${address}`);
}

export function getTraderPositions(address: string) {
  return fetchAPI<TraderPosition[]>(`/api/trader/${address}/positions`);
}

export function getTraderFills(address: string, limit = 100) {
  return fetchAPI<TraderFill[]>(`/api/trader/${address}/fills?limit=${limit}`);
}

export interface CopyConfig {
  copier_address: string;
  leader_address: string;
  config: {
    max_position_pct: number;
    max_total_exposure_pct: number;
    stop_loss_pct: number;
    max_drawdown_pct: number;
    token_whitelist: string[];
    token_blacklist: string[];
  };
  active: boolean;
  created_at: number;
}

export interface CopyLogEntry {
  timestamp: number;
  copier_address: string;
  leader_address: string;
  coin: string;
  side: string;
  size: number;
  price: number;
  order_type: string;
  reason: string;
  status: string;
}

export function createCopy(params: {
  copier_address: string;
  leader_address: string;
  max_position_pct?: number;
  max_total_exposure_pct?: number;
  stop_loss_pct?: number;
  max_drawdown_pct?: number;
}) {
  return fetchAPI<CopyConfig>("/api/copy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export function getCopies(copier: string) {
  return fetchAPI<CopyConfig[]>(`/api/copy/${copier}`);
}

export function stopCopy(copier: string, leader: string) {
  return fetchAPI<{ status: string }>(`/api/copy/${copier}/${leader}`, {
    method: "DELETE",
  });
}

export function getCopyLog(copier: string, limit = 100) {
  return fetchAPI<CopyLogEntry[]>(`/api/copy/${copier}/log?limit=${limit}`);
}

export function submitTrader(address: string) {
  return fetchAPI<{ address: string; status: string; score: number | null }>(
    "/api/trader",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    }
  );
}
