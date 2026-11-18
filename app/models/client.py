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
    is_logged: bool

class ClientManager:

    def __init__(self, filepath: str = "app/data/clients.jsonl", order: int = 5):
        self.btree = BTree(order=order)
        self.repo = ClientRepository(filepath)
        self._load_from_file()

    def _load_from_file(self) -> None:
        #inserts all clients into btree
        self.btree = BTree(order=self.btree.order)
        for client_id, offset in self.repo.load_all_records():
            self.btree.insert(client_id, offset)

    def create(self, client: Client) -> None:
        client_id = client.get("id")

        if not client.get("id"):
            raise ValueError("Client ID not provided")
        elif self.btree.search(client_id) is not None:
            raise ValueError(f"Client with ID {client_id} already exists")

        # persist the client in the repository and get the offset
        offset = self.repo.append(client)
        self.btree.insert(client_id, offset)

    def get(self, client_id: int) -> Client:
        record = self.btree.search(client_id)
        if not record:
            return None
        
        return self.repo.read_at_offset(record.offset)

    def get_all(self) -> list[Client]:
        records = self.btree.in_order()
        return [self.repo.read_at_offset(record.offset) for record in records]

    def update(self, client_id: int, updated_client: Client) -> None:
        record = self.btree.search(client_id)
        if not record:
            raise KeyError(f"Client with ID {client_id} not found")
        
        all_clients = self.get_all()
        for i, c in enumerate(all_clients):
            if c["id"] == client_id:
                all_clients[i] = updated_client
                break

        new_records = self.repo.save_all(all_clients)
        self.btree = BTree(order=self.btree.order)
        for cid, off in new_records:
            self.btree.insert(cid, off)

    def get_instrumentation(self) -> dict[str, Any]:
        return self.btree.get_instrumentation()