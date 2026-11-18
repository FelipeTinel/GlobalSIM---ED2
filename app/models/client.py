from typing import TypedDict, Any
from app.models.btree import BTree
from app.repository.client import ClientRepository

class Client(TypedDict, total=False):
    id: int
    name: str
    email: str
    esim: str
    pkg: int
    status: str
    country: str
    is_logged: bool

class ClientManager:

    def __init__(self, filepath: str = "app/data/clients.jsonl", country_filepath: str | None = None, order: int = 5):
        self.btree = BTree(order=order)                   # Primary B-Tree: ID -> offset in clients.jsonl
        self.country_btree = BTree(order=order)           # Secondary B-Tree: Country -> offset in country_clients.jsonl
        self.repo = ClientRepository(filepath=filepath, country_filepath=country_filepath)
        self._load_from_file()

    def _load_from_file(self) -> None:
        self.btree = BTree(order=self.btree.order)
        self.country_btree = BTree(order=self.country_btree.order)

        country_groups: dict[str, list[int]] = {}
        for client_id, country, offset in self.repo.load_all_records():
            self.btree.insert(client_id, offset)
            if country:
                country_groups.setdefault(country, []).append(client_id)

        # Save secondary index file and insert offsets into secondary B-Tree
        country_records = self.repo.save_country_index(country_groups)
        for country_code, country_offset in country_records:
            self.country_btree.insert(country_code, country_offset)

    def _rebuild_country_index(self) -> None:
        """Rebuilds the secondary index file and secondary B-Tree from all clients."""
        country_groups: dict[str, list[int]] = {}
        for client in self.get_all():
            country = str(client.get("country", "")).strip().upper()
            if country:
                country_groups.setdefault(country, []).append(client["id"])

        self.country_btree = BTree(order=self.country_btree.order)
        country_records = self.repo.save_country_index(country_groups)
        for country_code, country_offset in country_records:
            self.country_btree.insert(country_code, country_offset)

    def create(self, client: Client) -> None:
        client_id = client.get("id")

        if not client_id:
            raise ValueError("Client ID not provided")
        elif self.btree.search(client_id) is not None:
            raise ValueError(f"Client with ID {client_id} already exists")

        # Persist client in the main file and insert into the primary B-Tree
        offset = self.repo.append(client)
        self.btree.insert(client_id, offset)

        # Update the secondary index file and secondary B-Tree
        self._rebuild_country_index()

    def get(self, client_id: int) -> Client:
        record = self.btree.search(client_id)
        if not record:
            return None
        
        return self.repo.read_at_offset(record.offset)

    def get_all(self) -> list[Client]:
        records = self.btree.in_order()
        return [self.repo.read_at_offset(record.offset) for record in records]

    def get_by_country(self, country_code: str) -> list[Client]:
        """
        Team Differential:
        1. Searches the country code in the secondary B-Tree in O(log K).
        2. Retrieves the country offset in country_clients.jsonl.
        3. Reads the list of client IDs for that country via f.seek(offset).
        4. Loads each client record using the primary B-Tree in O(log N).
        """
        code = str(country_code).strip().upper()
        if not code:
            return []

        record = self.country_btree.search(code)
        if not record:
            return []

        # Retrieve client IDs from the secondary file using the offset
        country_data = self.repo.read_country_at_offset(record.offset)
        client_ids = country_data.get("client_ids", [])

        # Fetch full client records using the primary B-Tree
        results = []
        for client_id in client_ids:
            client = self.get(client_id)
            if client is not None:
                results.append(client)
        return results

    def update(self, client_id: int, updated_client: Client) -> None:
        record = self.btree.search(client_id)
        if not record:
            raise KeyError(f"Client with ID {client_id} not found")
        
        all_clients = self.get_all()
        for i, client in enumerate(all_clients):
            if client["id"] == client_id:
                all_clients[i] = updated_client
                break

        new_records = self.repo.save_all(all_clients)
        self.btree = BTree(order=self.btree.order)
        country_groups: dict[str, list[int]] = {}
        for current_id, country, offset in new_records:
            self.btree.insert(current_id, offset)
            if country:
                country_groups.setdefault(country, []).append(current_id)

        self.country_btree = BTree(order=self.country_btree.order)
        country_records = self.repo.save_country_index(country_groups)
        for country_code, country_offset in country_records:
            self.country_btree.insert(country_code, country_offset)

    def get_instrumentation(self) -> dict[str, Any]:
        inst = self.btree.get_instrumentation()
        inst["secondary"] = self.country_btree.get_instrumentation()
        return inst
