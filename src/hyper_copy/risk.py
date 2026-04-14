from hyper_copy.models import CopyConfig, CopyOrder, TraderPosition


class RiskManager:
    """Validates copy orders against risk controls."""

    def check_position(
        self,
        config: CopyConfig,
        order: CopyOrder,
        copier_account_value: float,
    ) -> tuple[bool, str]:
        """Check if a single order passes risk controls."""
        # Max position size (% of account)
        order_value = order.size * order.price
        position_pct = order_value / copier_account_value if copier_account_value > 0 else 1
        if position_pct > config.max_position_pct:
            return False, f"Position size {position_pct:.1%} exceeds max {config.max_position_pct:.1%}"

        # Token whitelist
        if config.token_whitelist and order.coin not in config.token_whitelist:
            return False, f"{order.coin} not in whitelist"

        # Token blacklist
        if config.token_blacklist and order.coin in config.token_blacklist:
            return False, f"{order.coin} is blacklisted"

        return True, "ok"

    def check_exposure(
        self,
        config: CopyConfig,
        current_positions: list[TraderPosition],
        copier_account_value: float,
    ) -> tuple[bool, str]:
        """Check total exposure against max."""
        total_value = sum(p.position_value for p in current_positions)
        exposure_pct = total_value / copier_account_value if copier_account_value > 0 else 1
        if exposure_pct > config.max_total_exposure_pct:
            return False, f"Total exposure {exposure_pct:.1%} exceeds max {config.max_total_exposure_pct:.1%}"
        return True, "ok"

    def check_drawdown(
        self,
        config: CopyConfig,
        initial_value: float,
        current_value: float,
    ) -> tuple[bool, str]:
        """Check if drawdown kill switch should trigger."""
        if initial_value <= 0:
            return True, "ok"
        drawdown = (initial_value - current_value) / initial_value
        if drawdown > config.max_drawdown_pct:
            return False, f"Drawdown {drawdown:.1%} exceeds kill switch {config.max_drawdown_pct:.1%}"
        return True, "ok"
