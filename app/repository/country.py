import json
import os

class CountryRepository:

    def __init__(self, filepath: str = "app/data/countries.json"):
        self.filepath = filepath
        dirname = os.path.dirname(self.filepath)
        if dirname:
            os.makedirs(dirname, exist_ok=True)

    def load_all(self) -> list[dict]:
        if not os.path.exists(self.filepath):
            return []

        try:
            with open(self.filepath, "r", encoding="utf-8") as file:
                data = json.load(file)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, OSError):
            return []

    def save_all(self, countries: list[dict]) -> None:
        with open(self.filepath, "w", encoding="utf-8") as file:
            json.dump(countries, file, indent=4, ensure_ascii=False)