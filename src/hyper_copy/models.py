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
