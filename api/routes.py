import asyncio
import re

from fastapi import APIRouter, HTTPException, Query, Request

from api.schemas import (
    LeaderboardEntry,
    TraderPosition,
    TraderFill,
    TraderProfile,
    SubmitTraderRequest,
    SubmitTraderResponse,
    CopyConfigRequest,
    CopyConfigResponse,
    CopyLogEntry,
)

router = APIRouter(prefix="/api")

ADDRESS_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")


def _mgr(request: Request):
    return request.app.state.manager


def _client(request: Request):
    return request.app.state.manager.client


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    sort_by: str = Query(default="score"),
    min_trades: int = Query(default=5, ge=0),
):
    mgr = _mgr(request)
    board = mgr.get_leaderboard(limit, sort_by, min_trades)
    return [LeaderboardEntry(**t) for t in board]


@router.get("/trader/{address}", response_model=TraderProfile)
async def get_trader(request: Request, address: str):
    if not ADDRESS_RE.match(address):
        raise HTTPException(400, "Invalid address")

    mgr = _mgr(request)
    client = _client(request)

    # Get score from DB
    trader = mgr.get_trader(address)
    if not trader or trader.get("scored_at", 0) == 0:
        # Not tracked yet, score on the fly
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, mgr.add_trader, address)
        if not result:
            raise HTTPException(404, "Could not fetch trader data")
        trader = result

    # Get live positions and recent fills
    loop = asyncio.get_event_loop()
    snapshot = await loop.run_in_executor(None, client.get_snapshot, address)
    fills = await loop.run_in_executor(None, client.get_fills, address, None, 50)

    return TraderProfile(
        score=LeaderboardEntry(**trader),
        positions=[
            TraderPosition(
                coin=p.coin, size=p.size, side=p.side,
                entry_price=p.entry_price, mark_price=p.mark_price,
                unrealized_pnl=p.unrealized_pnl, leverage=p.leverage,
                liquidation_price=p.liquidation_price,
                margin_used=p.margin_used, position_value=p.position_value,
            )
            for p in snapshot.positions
        ],
        recent_fills=[
            TraderFill(
                coin=f.coin, side=f.side, price=f.price, size=f.size,
                time=f.time, fee=f.fee, closed_pnl=f.closed_pnl,
                direction=f.direction,
            )
            for f in fills
        ],
    )


@router.get("/trader/{address}/positions", response_model=list[TraderPosition])
async def get_trader_positions(request: Request, address: str):
    if not ADDRESS_RE.match(address):
        raise HTTPException(400, "Invalid address")

    client = _client(request)
    loop = asyncio.get_event_loop()
    snapshot = await loop.run_in_executor(None, client.get_snapshot, address)

    return [
        TraderPosition(
            coin=p.coin, size=p.size, side=p.side,
            entry_price=p.entry_price, mark_price=p.mark_price,
            unrealized_pnl=p.unrealized_pnl, leverage=p.leverage,
            liquidation_price=p.liquidation_price,
            margin_used=p.margin_used, position_value=p.position_value,
        )
        for p in snapshot.positions
    ]


@router.get("/trader/{address}/fills", response_model=list[TraderFill])
async def get_trader_fills(
    request: Request,
    address: str,
    limit: int = Query(default=100, ge=1, le=2000),
):
    if not ADDRESS_RE.match(address):
        raise HTTPException(400, "Invalid address")

    client = _client(request)
    loop = asyncio.get_event_loop()
    fills = await loop.run_in_executor(None, client.get_fills, address, None, limit)

    return [
        TraderFill(
            coin=f.coin, side=f.side, price=f.price, size=f.size,
            time=f.time, fee=f.fee, closed_pnl=f.closed_pnl,
            direction=f.direction,
        )
        for f in fills
    ]


@router.post("/trader", response_model=SubmitTraderResponse)
async def submit_trader(request: Request, body: SubmitTraderRequest):
    if not ADDRESS_RE.match(body.address):
        raise HTTPException(400, "Invalid address")

    mgr = _mgr(request)
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, mgr.add_trader, body.address, "user")

    if result:
        return SubmitTraderResponse(
            address=body.address,
            status="scored",
            score=result.get("score"),
        )
    return SubmitTraderResponse(
        address=body.address,
        status="added",
        score=None,
    )


@router.post("/copy", response_model=CopyConfigResponse)
async def create_copy(request: Request, body: CopyConfigRequest):
    if not ADDRESS_RE.match(body.copier_address) or not ADDRESS_RE.match(body.leader_address):
        raise HTTPException(400, "Invalid address")

    mgr = _mgr(request)
    config = {
        "max_position_pct": body.max_position_pct,
        "max_total_exposure_pct": body.max_total_exposure_pct,
        "stop_loss_pct": body.stop_loss_pct,
        "max_drawdown_pct": body.max_drawdown_pct,
        "token_whitelist": body.token_whitelist,
        "token_blacklist": body.token_blacklist,
    }
    mgr.db.upsert_copy_config(body.copier_address, body.leader_address, config)
    row = mgr.db.get_copy_config(body.copier_address, body.leader_address)
    return CopyConfigResponse(**row)


@router.get("/copy/{copier}", response_model=list[CopyConfigResponse])
async def get_copies(request: Request, copier: str):
    if not ADDRESS_RE.match(copier):
        raise HTTPException(400, "Invalid address")
    mgr = _mgr(request)
    configs = mgr.db.get_copy_configs(copier)
    return [CopyConfigResponse(**c) for c in configs]


@router.delete("/copy/{copier}/{leader}")
async def stop_copy(request: Request, copier: str, leader: str):
    if not ADDRESS_RE.match(copier) or not ADDRESS_RE.match(leader):
        raise HTTPException(400, "Invalid address")
    mgr = _mgr(request)
    if mgr.db.delete_copy_config(copier, leader):
        return {"status": "stopped"}
    raise HTTPException(404, "Copy config not found")


@router.put("/copy/{copier}/{leader}", response_model=CopyConfigResponse)
async def update_copy(request: Request, copier: str, leader: str, body: CopyConfigRequest):
    if not ADDRESS_RE.match(copier) or not ADDRESS_RE.match(leader):
        raise HTTPException(400, "Invalid address")
    mgr = _mgr(request)
    config = {
        "max_position_pct": body.max_position_pct,
        "max_total_exposure_pct": body.max_total_exposure_pct,
        "stop_loss_pct": body.stop_loss_pct,
        "max_drawdown_pct": body.max_drawdown_pct,
        "token_whitelist": body.token_whitelist,
        "token_blacklist": body.token_blacklist,
    }
    mgr.db.upsert_copy_config(copier, leader, config)
    row = mgr.db.get_copy_config(copier, leader)
    return CopyConfigResponse(**row)


@router.get("/copy/{copier}/log", response_model=list[CopyLogEntry])
async def get_copy_log(
    request: Request,
    copier: str,
    limit: int = Query(default=100, ge=1, le=1000),
):
    if not ADDRESS_RE.match(copier):
        raise HTTPException(400, "Invalid address")
    mgr = _mgr(request)
    logs = mgr.db.get_copy_log(copier, limit)
    return [CopyLogEntry(**l) for l in logs]


@router.get("/account/{address}/value")
async def get_account_value(request: Request, address: str):
    if not ADDRESS_RE.match(address):
        raise HTTPException(400, "Invalid address")
    client = _client(request)
    loop = asyncio.get_event_loop()
    value = await loop.run_in_executor(None, client.get_account_value, address)
    return {"address": address, "account_value": value}


@router.get("/health")
async def health():
    return {"ok": True, "service": "hyper-copy"}
