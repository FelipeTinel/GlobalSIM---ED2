import json
import os

class ClientRepository:

    def __init__(self, filepath: str = "app/data/clients.jsonl", country_filepath: str | None = None):
        self.filepath = filepath
        if country_filepath is None:
            if self.filepath == "app/data/clients.jsonl":
                self.country_filepath = "app/data/country_clients.jsonl"
            else:
                base, ext = os.path.splitext(self.filepath)
                self.country_filepath = f"{base}_country{ext}"
        else:
            self.country_filepath = country_filepath

        dir_path = os.path.dirname(self.filepath)
        if dir_path: 
            os.makedirs(dir_path, exist_ok=True)

        country_dir = os.path.dirname(self.country_filepath)
        if country_dir:
            os.makedirs(country_dir, exist_ok=True)

    def load_all_records(self) -> list[tuple[int, str, int]]:
        if not os.path.exists(self.filepath):
            return []

        records = []
        with open(self.filepath, "r", encoding="utf-8") as f:
            while True:
                offset = f.tell()
                line = f.readline()
                if not line:
                    break
                line = line.strip()
                if line:
                    data = json.loads(line)
                    country = str(data.get("country", "")).strip().upper()
                    records.append((data["id"], country, offset))
        return records

    def read_at_offset(self, offset: int) -> dict:
        # reads a client at the given offset in the file
        with open(self.filepath, "r", encoding="utf-8") as f:
            f.seek(offset)
            line = f.readline()
            return json.loads(line)

    def append(self, client: dict) -> int:
        # adds client to the end of the file and returns the offset
        with open(self.filepath, "a", encoding="utf-8") as f:
            offset = f.tell()
            f.write(json.dumps(client, ensure_ascii=False) + "\n")
            return offset

    def save_all(self, clients: list[dict]) -> list[tuple[int, str, int]]:
        records = []
        with open(self.filepath, "w", encoding="utf-8") as f:
            for client in clients:
                offset = f.tell()
                f.write(json.dumps(client, ensure_ascii=False) + "\n")
                country = str(client.get("country", "")).strip().upper()
                records.append((client["id"], country, offset))
        return records

    def save_country_index(self, country_groups: dict[str, list[int]]) -> list[tuple[str, int]]:
        """
        Saves the secondary index file grouping client IDs by country.
        Returns a list of tuples (country_code, file_offset).
        """
        records = []
        with open(self.country_filepath, "w", encoding="utf-8") as f:
            for country_code in sorted(country_groups.keys()):
                offset = f.tell()
                record = {
                    "country": country_code,
                    "client_ids": country_groups[country_code]
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
                records.append((country_code, offset))
        return records

    def read_country_at_offset(self, offset: int) -> dict:
        """Reads a country client group record at the given offset in the secondary file."""
        with open(self.country_filepath, "r", encoding="utf-8") as f:
            f.seek(offset)
            line = f.readline()
            return json.loads(line)

    def load_country_index_records(self) -> list[tuple[str, int]]:
        """Reads the secondary index file and returns a list of (country_code, file_offset)."""
        if not os.path.exists(self.country_filepath):
            return []

        records = []
        with open(self.country_filepath, "r", encoding="utf-8") as f:
            while True:
                offset = f.tell()
                line = f.readline()
                if not line:
                    break
                line = line.strip()
                if line:
                    data = json.loads(line)
                    country = str(data.get("country", "")).strip().upper()
                    records.append((country, offset))
        return records