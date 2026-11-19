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
    # Out-of-order insertion to test B-Tree in-order traversal
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

    # New instance reloading from the same jsonl file
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
    # Low order (3) to force splits with fewer records
    filepath = str(tmp_path / "splits_test.jsonl")
    low_order_mgr = ClientManager(filepath=filepath, order=3)

    for cid in range(100, 115):
        c = {**sample_client, "id": cid}
        low_order_mgr.create(c)

    inst = low_order_mgr.get_instrumentation()
    assert inst["total_keys"] == 15
    assert inst["splits_count"] > 0
    assert inst["height"] >= 2

    # Ensure all keys remain accessible after splits
    for cid in range(100, 115):
        assert low_order_mgr.get(cid) is not None


def test_secondary_btree_grouping_by_country(manager, sample_client):
    c1 = {**sample_client, "id": 10001, "country": "BR", "name": "Cliente BR 1"}
    c2 = {**sample_client, "id": 10002, "country": "BR", "name": "Cliente BR 2"}
    c3 = {**sample_client, "id": 10003, "country": "US", "name": "Cliente US 1"}

    manager.create(c1)
    manager.create(c2)
    manager.create(c3)

    # Verify that countries are indexed in the secondary B-Tree
    assert manager.country_btree.total_keys == 2
    assert manager.country_btree.search("BR") is not None
    assert manager.country_btree.search("US") is not None

    # Query Brazil clients via the secondary index differential
    br_clients = manager.get_by_country("BR")
    assert len(br_clients) == 2
    br_ids = [c["id"] for c in br_clients]
    assert 10001 in br_ids
    assert 10002 in br_ids

    # Query US clients
    us_clients = manager.get_by_country("US")
    assert len(us_clients) == 1
    assert us_clients[0]["id"] == 10003

    # Query non-existent country
    assert manager.get_by_country("JP") == []
    assert manager.get_by_country("") == []


def test_update_client_country_updates_secondary_btree(manager, sample_client):
    c1 = {**sample_client, "id": 10001, "country": "BR"}
    manager.create(c1)

    assert len(manager.get_by_country("BR")) == 1
    assert len(manager.get_by_country("ES")) == 0

    # Update client country from BR to ES
    updated = c1.copy()
    updated["country"] = "ES"
    manager.update(10001, updated)

    assert len(manager.get_by_country("BR")) == 0
    es_clients = manager.get_by_country("ES")
    assert len(es_clients) == 1
    assert es_clients[0]["id"] == 10001


def test_packages_catalog_and_connectivity_integration(manager, sample_client):
    from app.models.package import PackagesManager
    from app.models.connectivity import ConnectivityManager

    pkg_mgr = PackagesManager()
    pkg_102 = pkg_mgr.get(102)
    assert pkg_102 is not None
    assert pkg_102["name"] == "Europa Plus"
    assert pkg_102["data"] == "10 GB"
    assert pkg_102["validity"] == "30 dias"

    pkg_301 = pkg_mgr.get(301)
    assert pkg_301 is not None
    assert pkg_301["name"] == "Global"
    assert pkg_301["data"] == "20 GB"
    assert pkg_301["validity"] == "30 dias"

    c = {**sample_client, "id": 58372, "pkg": 102, "status": "ativo"}
    manager.create(c)

    conn_mgr = ConnectivityManager(client_manager=manager, packages_mgr=pkg_mgr)
    result = conn_mgr.check(58372, "IT")
    assert result is not None
    assert result["client"]["pkg"] == 102
    assert result["client"]["pkg_name"] == "Europa Plus"
    assert result["client"]["pkg_data"] == "10 GB"
    assert result["client"]["pkg_validity"] == "30 dias"


def test_packages_rendered_via_jinja():
    from run import app

    client = app.test_client()
    for route in ("/", "/admin/", "/session"):
        resp = client.get(route)
        assert resp.status_code == 200
        html = resp.get_data(as_text=True)
        assert "101 — Europa Basic (5 GB • 15 dias)" in html
        assert "102 — Europa Plus (10 GB • 30 dias)" in html
        assert "301 — Global (20 GB • 30 dias)" in html
