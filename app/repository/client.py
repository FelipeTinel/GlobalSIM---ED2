import json
import os

class ClientRepository:

    def __init__(self, filepath: str = "app/data/clients.jsonl"):
        self.filepath = filepath
        dir = os.path.dirname(self.filepath)
        if dir: 
            os.makedirs(dir, exist_ok=True)

    def load_all_records(self) -> list[tuple[int, int]]:
        # loads all clients and returns a list of tuples
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
                    records.append((data["id"], offset))
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

    def save_all(self, clients: list[dict]) -> list[tuple[int, int]]:
        # saves all clients to the file and returns a list of tuples
        records = []
        with open(self.filepath, "w", encoding="utf-8") as f:
            for client in clients:
                offset = f.tell()
                f.write(json.dumps(client, ensure_ascii=False) + "\n")
                records.append((client["id"], offset))
        return records
