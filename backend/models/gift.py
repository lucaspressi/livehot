from dataclasses import dataclass

@dataclass
class Gift:
    """Model representing a gift option available on the platform."""

    id: str
    name: str
    emoji: str
    cost_coins: int
    rarity: str  # COMMON, UNCOMMON, RARE, LEGENDARY
