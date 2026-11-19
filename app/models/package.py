from typing import TypedDict
from app.repository.package import PackageRepository


class ServicePackage(TypedDict):
    code: int
    name: str
    data: str
    validity: str


class PackagesManager:

    def __init__(self, filepath: str | None = "app/data/packages.json"):
        self.packages: dict[int, ServicePackage] = {}
        self.repo = PackageRepository(filepath) if filepath else None

        if self.repo:
            self._load_from_json()

    def _load_from_json(self) -> None:
        self.packages = {}
        for item in self.repo.load_all():
            raw_code = item.get("code")
            if raw_code is None:
                continue
            try:
                code = int(raw_code)
            except (TypeError, ValueError):
                continue

            self.packages[code] = {
                "code": code,
                "name": str(item.get("name", "")).strip(),
                "data": str(item.get("data", "")).strip(),
                "validity": str(item.get("validity", "")).strip(),
            }

    def get(self, code: int | str | None) -> ServicePackage | None:
        if code is None:
            return None
        try:
            return self.packages.get(int(code))
        except (TypeError, ValueError):
            return None

    def get_all(self) -> list[ServicePackage]:
        return list(self.packages.values())

    def format_label(self, code: int | str | None) -> str:
        pkg = self.get(code)
        if not pkg:
            return f"Pacote #{code}" if code else "Não associado"
        return f"{pkg['name']} ({pkg['data']} • {pkg['validity']})"


packages_manager = PackagesManager()
