from dataclasses import dataclass, field


@dataclass
class TraderPosition:
    coin: str
    size: float
    side: str  # "LONG" or "SHORT"
    entry_price: float
    mark_price: float
    unrealized_pnl: float
    leverage: int
    liquidation_price: float
    margin_used: float
    position_value: float


@dataclass
class Fill:
    coin: str
    side: str  # "B" (buy) or "A" (sell/ask)
    price: float
    size: float
    time: int  # ms timestamp
    fee: float
    closed_pnl: float
    oid: int
    direction: str  # "Open Long", "Close Long", "Open Short", "Close Short"
    crossed: bool  # True = taker, False = maker


@dataclass
class TraderSnapshot:
    address: str
    account_value: float
    positions: list[TraderPosition]
    total_margin_used: float
    withdrawable: float


@dataclass
class Trade:
    """A round-trip trade (open to close)."""
    coin: str
    side: str  # "LONG" or "SHORT"
    entry_price: float
    exit_price: float
    size: float
    pnl: float
    fees: float
    net_pnl: float
    open_time: int
    close_time: int
    hold_time_hours: float


@dataclass
class TraderScore:
    address: str
    total_pnl: float
    roi: float  # total_pnl / max_capital_used
    win_rate: float  # 0-1
    total_trades: int
    avg_pnl_per_trade: float
    max_drawdown: float  # 0-1 (percentage)
    sharpe_ratio: float
    avg_hold_time_hours: float
    trade_frequency_per_day: float
    active_since: int  # ms timestamp
    account_value: float
    score: float  # composite 0-100
    scored_at: float  # unix timestamp
