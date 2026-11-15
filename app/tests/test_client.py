import pytest
from app.models.client import ClientManager, Client


@pytest.fixture
def manager(tmp_path):
    test_jsonl = tmp_path / "test_clients.jsonl"
    return ClientManager(filepath=str(test_jsonl), order=5)


@pytest.fixture
def sample_client() -> Client:
    return {
        "id": 10001,
        "name": "Maria Silva",
        "email": "maria.silva@email.com",
        "esim": "ESIM-12345",
        "pkg": 101,
        "status": "ativo",
    }


def test_create_and_get_success(manager, sample_client):
    manager.create(sample_client)
    found = manager.get(10001)

    assert found == sample_client
    assert manager.btree.total_keys == 1


def test_create_duplicate_id_raises_error(manager, sample_client):
    manager.create(sample_client)

    with pytest.raises(ValueError):
        manager.create(sample_client)


def test_create_without_id_raises_error(manager, sample_client):
    invalid_client = sample_client.copy()
    invalid_client["id"] = None

    with pytest.raises(ValueError):
        manager.create(invalid_client)


def test_get_nonexistent_returns_none(manager):
    assert manager.get(99999) is None


def test_update_success(manager, sample_client):
    manager.create(sample_client)

    updated = sample_client.copy()
    updated["name"] = "Maria Silva Santos"
    updated["pkg"] = 202
    updated["status"] = "inativo"

    manager.update(10001, updated)

    result = manager.get(10001)
    assert result["name"] == "Maria Silva Santos"
    assert result["pkg"] == 202
    assert result["status"] == "inativo"


def test_update_nonexistent_raises_key_error(manager, sample_client):
    with pytest.raises(KeyError):
        manager.update(99999, sample_client)


def test_get_all_returns_in_order(manager, sample_client):
    # Inserção fora de ordem para testar o percurso in_order da Árvore B
    ids = [50000, 20000, 80000, 10000, 30000]
    for cid in ids:
        c = {**sample_client, "id": cid, "name": f"Cliente {cid}"}
        manager.create(c)

    all_clients = manager.get_all()
    assert len(all_clients) == 5
    assert [c["id"] for c in all_clients] == [10000, 20000, 30000, 50000, 80000]


def test_jsonl_persistence_reload(tmp_path, sample_client):
    filepath = str(tmp_path / "persist_clients.jsonl")
    mgr1 = ClientManager(filepath=filepath, order=5)
    mgr1.create(sample_client)

    c2 = {**sample_client, "id": 20002, "name": "João Pereira"}
    mgr1.create(c2)

    # Nova instância recarregando do mesmo arquivo jsonl
    mgr2 = ClientManager(filepath=filepath, order=5)
    assert mgr2.btree.total_keys == 2
    assert mgr2.get(10001) == sample_client
    assert mgr2.get(20002) == c2


def test_instrumentation_after_search(manager, sample_client):
    manager.create(sample_client)
    manager.get(10001)

    inst = manager.get_instrumentation()
    assert inst["total_keys"] == 1
    assert inst["order"] == 5
    assert inst["last_search_key"] == 10001
    assert inst["last_search_comparisons"] >= 1
    assert inst["last_search_nodes_visited"] >= 1


def test_btree_splits_and_height(tmp_path, sample_client):
    # Ordem baixa (3) para forçar divisões (splits) com poucos registros
    filepath = str(tmp_path / "splits_test.jsonl")
    low_order_mgr = ClientManager(filepath=filepath, order=3)

    for cid in range(100, 115):
        c = {**sample_client, "id": cid}
        low_order_mgr.create(c)

    inst = low_order_mgr.get_instrumentation()
    assert inst["total_keys"] == 15
    assert inst["splits_count"] > 0
    assert inst["height"] >= 2

    # Garante que todos continuam acessíveis após os splits
    for cid in range(100, 115):
        assert low_order_mgr.get(cid) is not None
