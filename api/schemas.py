from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    address: str
    total_pnl: float
    roi: float
    win_rate: float
    total_trades: int
    avg_pnl_per_trade: float
    max_drawdown: float
    sharpe_ratio: float
    avg_hold_time_hours: float
    trade_frequency_per_day: float
    active_since: int
    account_value: float
    score: float
    scored_at: float


class TraderPosition(BaseModel):
    coin: str
    size: float
    side: str
    entry_price: float
    mark_price: float
    unrealized_pnl: float
    leverage: int
    liquidation_price: float
    margin_used: float
    position_value: float


class TraderFill(BaseModel):
    coin: str
    side: str
    price: float
    size: float
    time: int
    fee: float
    closed_pnl: float
    direction: str


class TraderProfile(BaseModel):
    score: LeaderboardEntry
    positions: list[TraderPosition]
    recent_fills: list[TraderFill]


class SubmitTraderRequest(BaseModel):
    address: str


class SubmitTraderResponse(BaseModel):
    address: str
    status: str
    score: float | None = None


class CopyConfigRequest(BaseModel):
    copier_address: str
    leader_address: str
    max_position_pct: float = 0.10
    max_total_exposure_pct: float = 0.50
    stop_loss_pct: float = 0.05
    max_drawdown_pct: float = 0.15
    token_whitelist: list[str] = []
    token_blacklist: list[str] = []


class CopyConfigResponse(BaseModel):
    copier_address: str
    leader_address: str
    config: dict
    active: bool
    created_at: float


class CopyLogEntry(BaseModel):
    timestamp: float
    copier_address: str
    leader_address: str
    coin: str
    side: str
    size: float
    price: float
    order_type: str
    reason: str
    status: str
