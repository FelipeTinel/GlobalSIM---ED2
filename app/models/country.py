from typing import Any, TypedDict
from app.models.hash_table import HashTable
from app.repository.country import CountryRepository


class Country(TypedDict):
    code: str
    country: str
    continent: str
    provider: str
    tech: str

class CountriesManager:

    def __init__(self, filepath: str | None = "app/data/countries.json", capacity: int = 11):
        self.countries = HashTable(capacity=capacity)
        self.repo = CountryRepository(filepath) if filepath else None

        if self.repo:
            self._load_from_json()

    def _load_from_json(self) -> None:
        saved_countries = self.repo.load_all()
        for item in saved_countries:
            code = item.get("code", "").strip()
            if code and code not in self.countries:
                self.countries.insert(code, item)

    def _persist(self) -> None:
        if self.repo:
            self.repo.save_all(self.countries.get_all())

    def create(self, key: str, country: Country) -> None:
        if not key or not key.strip():
            raise ValueError("Não pode chave vazia")

        if not country.get("code", "").strip():
            raise ValueError("Código inválido")

        self.countries.insert(key, country)
        self._persist()

    def get(self, key: str) -> Country | None:
        return self.countries.get(key)

    def get_all(self) -> list[Country]:
        return self.countries.get_all()

    def update(self, key: str, country: Country) -> None:
        if not country.get("code", "").strip():
            raise ValueError("Código inválido")

        self.countries.update(key, country)
        self._persist()

    def delete(self, key: str) -> None:
        self.countries.delete(key)
        self._persist()

    def get_instrumentation(self) -> dict[str, Any]:
        return self.countries.get_instrumentation()