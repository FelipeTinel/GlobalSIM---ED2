from typing import TypedDict


class Client(TypedDict):
    id: int
    name: str
    email: str
    esim: str
    pkg: int
    status: str

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
        elif client["id"] in self.clients:
            raise ValueError("Client with this ID already exists")

        offset = self.repo.append(client)
        self.btree.insert(client_id, offset)

    def get(self, client_id: int) -> Client:
        record = self.btree.search(client_id)
        if not record:
            return None
        
        return self.repo.read_at_offset(record.offset)

    def update(self, client_id: int, updated_client: Client) -> None:
        record = self.btree.search(client_id)
        if not record:
            return None

        #TODO: finalize update, get_all and get_instrumentation methods
