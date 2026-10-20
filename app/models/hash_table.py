from typing import Any


class HashTable:

    def __init__(self, capacity: int = 11):
        self.capacity: int = capacity
        self.buckets: list[list[tuple[str, Any]]] = [[] for _ in range(capacity)]
        self.size: int = 0
        self.collisions: int = 0
        self.last_search_comparisons: int = 0
        self.last_search_key: str | None = None
        self.last_search_bucket: int | None = None

    def _normalize_key(self, key: str) -> str:
        return key.strip().upper()

    def _hash(self, key: str) -> int:
        norm_key = self._normalize_key(key)
        hash_value = 0
        for char in norm_key:
            hash_value = (hash_value * 31 + ord(char)) % self.capacity
        return hash_value

    def insert(self, key: str, value: Any) -> None:
        if not key or not key.strip():
            raise ValueError("Não pode chave vazia")

        norm_key = self._normalize_key(key)
        index = self._hash(norm_key)
        bucket = self.buckets[index]

        for existing_key, _ in bucket:
            if self._normalize_key(existing_key) == norm_key:
                raise KeyError("País existente")

        if len(bucket) > 0:
            self.collisions += 1

        bucket.append((key.strip(), value))
        self.size += 1

    def get(self, key: str) -> Any | None:
        if not key or not key.strip():
            self.last_search_comparisons = 0
            self.last_search_key = None
            self.last_search_bucket = None
            return None

        norm_key = self._normalize_key(key)
        index = self._hash(norm_key)
        bucket = self.buckets[index]

        self.last_search_key = norm_key
        self.last_search_bucket = index

        comparisons = 0
        for existing_key, value in bucket:
            comparisons += 1
            if self._normalize_key(existing_key) == norm_key:
                self.last_search_comparisons = comparisons
                return value

        self.last_search_comparisons = comparisons
        return None

    def update(self, key: str, value: Any) -> None:
        if not key or not key.strip():
            raise KeyError("País não existente")

        norm_key = self._normalize_key(key)
        index = self._hash(norm_key)
        bucket = self.buckets[index]

        for i, (existing_key, _) in enumerate(bucket):
            if self._normalize_key(existing_key) == norm_key:
                bucket[i] = (existing_key, value)
                return

        raise KeyError("País não existente")

    def delete(self, key: str) -> None:
        if not key or not key.strip():
            raise KeyError("País não existente")

        norm_key = self._normalize_key(key)
        index = self._hash(norm_key)
        bucket = self.buckets[index]

        for i, (existing_key, _) in enumerate(bucket):
            if self._normalize_key(existing_key) == norm_key:
                if len(bucket) > 1 and self.collisions > 0:
                    self.collisions -= 1
                bucket.pop(i)
                self.size -= 1
                return

        raise KeyError("País não existente")

    def get_all(self) -> list[Any]:
        items = []
        for bucket in self.buckets:
            for _, value in bucket:
                items.append(value)
        return items

    def get_instrumentation(self) -> dict[str, Any]:
        occupied_buckets = sum(1 for b in self.buckets if len(b) > 0)
        return {
            "capacity": self.capacity,
            "size": self.size,
            "load_factor": round(self.size / self.capacity, 2) if self.capacity > 0 else 0.0,
            "collisions": self.collisions,
            "occupied_buckets": occupied_buckets,
            "last_search_comparisons": self.last_search_comparisons,
            "last_search_key": self.last_search_key,
            "last_search_bucket": self.last_search_bucket,
            "buckets": [
                {
                    "index": idx,
                    "keys": [k for k, _ in bucket],
                    "items": [v for _, v in bucket],
                    "count": len(bucket),
                    "has_collision": len(bucket) > 1,
                }
                for idx, bucket in enumerate(self.buckets)
            ],
        }

    def __getitem__(self, key: str) -> Any:
        result = self.get(key)
        if result is None:
            raise KeyError("País não existente")
        return result

    def __contains__(self, key: str) -> bool:
        return self.get(key) is not None

