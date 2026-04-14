import logging

from hyper_copy.models import CopyOrder
from hyper_copy import config

logger = logging.getLogger(__name__)


class OrderExecutor:
    """Executes copy orders on Hyperliquid with Builder Code fees.

    Requires:
    - AGENT_WALLET_KEY env var (approved via approveAgent)
    - BUILDER_ADDRESS env var (your builder wallet)
    - BUILDER_FEE env var (fee in tenths of bps, default 50 = 0.05%)
    """

    def __init__(self):
        if not config.AGENT_WALLET_KEY:
            raise ValueError(
                "AGENT_WALLET_KEY not set. The agent wallet must be approved "
                "via approveAgent on the copier's Hyperliquid account."
            )
        if not config.BUILDER_ADDRESS:
            raise ValueError(
                "BUILDER_ADDRESS not set. Required for Builder Code fee collection."
            )

        # Import SDK here to avoid import errors when not executing
        from hyperliquid.exchange import Exchange
        from hyperliquid.utils import constants

        api_url = constants.TESTNET_API_URL if config.IS_TESTNET else constants.MAINNET_API_URL
        self.exchange = Exchange(
            wallet=None,
            base_url=api_url,
            account_address=None,
        )
        self._setup_wallet()

    def _setup_wallet(self):
        """Configure the agent wallet for signing."""
        from eth_account import Account
        self._wallet = Account.from_key(config.AGENT_WALLET_KEY)
        self.exchange.wallet = self._wallet

    def execute_order(self, order: CopyOrder, account_address: str) -> dict:
        """Place an order on Hyperliquid with Builder Code fee.

        Args:
            order: The copy order to execute
            account_address: The copier's master account address

        Returns:
            dict with order result (oid, status, fill info)
        """
        self.exchange.account_address = account_address

        is_buy = order.side == "B"

        # Build order with Builder Code
        builder_info = {
            "b": config.BUILDER_ADDRESS,
            "f": config.BUILDER_FEE,
        }

        try:
            result = self.exchange.market_open(
                coin=order.coin,
                is_buy=is_buy,
                sz=order.size,
                builder=builder_info,
            )
            logger.info(
                f"Order executed: {order.side} {order.size} {order.coin} "
                f"builder_fee={config.BUILDER_FEE/10}bps result={result}"
            )
            return {"status": "filled", "result": result}

        except Exception as e:
            logger.error(f"Order failed: {order.coin} {order.side} {order.size}: {e}")
            return {"status": "rejected", "error": str(e)}

    def close_position(self, coin: str, account_address: str) -> dict:
        """Close an entire position."""
        self.exchange.account_address = account_address

        builder_info = {
            "b": config.BUILDER_ADDRESS,
            "f": config.BUILDER_FEE,
        }

        try:
            result = self.exchange.market_close(
                coin=coin,
                builder=builder_info,
            )
            logger.info(f"Position closed: {coin} result={result}")
            return {"status": "filled", "result": result}

        except Exception as e:
            logger.error(f"Close failed: {coin}: {e}")
            return {"status": "rejected", "error": str(e)}
