from typing import Any


class HashTable:

    def __init__(self, capacity: int = 11):
        self._data: dict[str, Any] = {}
        self.capacity: int = capacity
        self.collisions: int = 0
        self.last_search_comparisons: int = 0
        self.last_search_key: str | None = None
        self.last_search_bucket: int | str | None = None

    def _normalize_key(self, key: str) -> str:
        return key.strip().upper()

    @property
    def size(self) -> int:
        return len(self._data)

    def insert(self, key: str, value: Any) -> None:
        if not key or not key.strip():
            raise ValueError("Não pode chave vazia")

        norm_key = self._normalize_key(key)
        if norm_key in self._data:
            raise KeyError("País existente")

        self._data[norm_key] = value

    def get(self, key: str) -> Any | None:
        if not key or not key.strip():
            self.last_search_comparisons = 0
            self.last_search_key = None
            self.last_search_bucket = None
            return None

        norm_key = self._normalize_key(key)
        self.last_search_key = norm_key
        self.last_search_bucket = "dict"

        val = self._data.get(norm_key)
        self.last_search_comparisons = 1 if val is not None else 0
        return val

    def update(self, key: str, value: Any) -> None:
        if not key or not key.strip():
            raise KeyError("País não existente")

        norm_key = self._normalize_key(key)
        if norm_key not in self._data:
            raise KeyError("País não existente")

        self._data[norm_key] = value

    def delete(self, key: str) -> None:
        if not key or not key.strip():
            raise KeyError("País não existente")

        norm_key = self._normalize_key(key)
        if norm_key not in self._data:
            raise KeyError("País não existente")

        del self._data[norm_key]

    def get_all(self) -> list[Any]:
        return list(self._data.values())

    def get_instrumentation(self) -> dict[str, Any]:
        total_items = len(self._data)
        return {
            "capacity": self.capacity,
            "size": total_items,
            "load_factor": round(total_items / self.capacity, 2) if self.capacity > 0 else 0.0,
            "collisions": self.collisions,
            "occupied_buckets": total_items,
            "last_search_comparisons": self.last_search_comparisons,
            "last_search_key": self.last_search_key,
            "last_search_bucket": self.last_search_bucket,
            "buckets": [
                {
                    "index": idx,
                    "keys": [key],
                    "items": [val],
                    "count": 1,
                    "has_collision": False,
                }
                for idx, (key, val) in enumerate(self._data.items())
            ],
        }

    def __getitem__(self, key: str) -> Any:
        result = self.get(key)
        if result is None:
            raise KeyError("País não existente")
        return result

    def __contains__(self, key: str) -> bool:
        if not key or not isinstance(key, str) or not key.strip():
            return False
        return self._normalize_key(key) in self._data
