import pytest
from app.models.country import CountriesManager, Country


@pytest.fixture
def manager(tmp_path):
    test_json = tmp_path / "test_paises.json"
    return CountriesManager(filepath=str(test_json), capacity=11)


@pytest.fixture
def sample_country() -> Country:
    return {
        "code": "BR",
        "country": "Brasil",
        "continent": "América do Sul",
        "provider": "Claro",
        "tech": "3g",
        "coordinates": [-14.235, -51.9253],
    }


def test_create_success(manager, sample_country):
    manager.create("br_1", sample_country)
    assert manager.countries["br_1"] == sample_country


def test_create_duplicate_key_raises_error(manager, sample_country):
    manager.create("br_1", sample_country)

    with pytest.raises(KeyError):
        manager.create("br_1", sample_country)


def test_create_empty_key_raises_error(manager, sample_country):
    with pytest.raises(ValueError):
        manager.create("", sample_country)


def test_create_empty_field_raises_error(manager, sample_country):
    invalid_country = sample_country.copy()
    invalid_country["code"] = "   "

    with pytest.raises(ValueError):
        manager.create("br_1", invalid_country)


def test_update_success(manager, sample_country):
    manager.create("br_1", sample_country)

    updated_country = sample_country.copy()
    updated_country["tech"] = "4g"

    manager.update("br_1", updated_country)
    assert manager.countries["br_1"]["tech"] == "4g"


def test_update_nonexistent_key_raises_error(manager, sample_country):
    with pytest.raises(KeyError):
        manager.update("chave_inexistente", sample_country)


def test_delete_success(manager, sample_country):
    manager.create("br_1", sample_country)

    manager.delete("br_1")
    assert "br_1" not in manager.countries


def test_delete_nonexistent_key_raises_error(manager):
    with pytest.raises(KeyError):
        manager.delete("chave_inexistente")


def test_get_and_instrumentation(manager, sample_country):
    manager.create("BR", sample_country)
    found = manager.get("br")  # busca case-insensitive
    assert found == sample_country

    metrics = manager.get_instrumentation()
    assert metrics["size"] == 1
    assert metrics["capacity"] == 11
    assert metrics["last_search_comparisons"] == 1


def test_json_persistence_reload(tmp_path, sample_country):
    json_path = str(tmp_path / "persist.json")
    mgr1 = CountriesManager(filepath=json_path, capacity=11)
    mgr1.create("BR", sample_country)

    # Nova instância deve carregar automaticamente do JSON para a Tabela Hash
    mgr2 = CountriesManager(filepath=json_path, capacity=11)
    assert mgr2.get("BR") == sample_country


def test_multiple_insert_search_and_delete(manager, sample_country):
    pt_country = {**sample_country, "code": "PT", "country": "Portugal"}
    us_country = {**sample_country, "code": "US", "country": "Estados Unidos"}

    manager.create("PT", pt_country)
    manager.create("US", us_country)

    inst = manager.get_instrumentation()
    assert inst["size"] == 2

    manager.get("US")
    inst_after_search = manager.get_instrumentation()
    assert inst_after_search["last_search_key"] == "US"
    assert inst_after_search["last_search_comparisons"] == 1

    manager.delete("US")
    assert manager.get("US") is None
    assert manager.get_instrumentation()["size"] == 1


def test_admin_post_redirect_get_routes(tmp_path, monkeypatch, sample_country):
    from run import app
    import app.routes.admin as admin_module
    import app.routes.home as home_module

    test_mgr = CountriesManager(filepath=str(tmp_path / "routes_test.json"), capacity=11)
    monkeypatch.setattr(admin_module, "countries_manager", test_mgr)
    monkeypatch.setattr(home_module, "countries_manager", test_mgr)

    client = app.test_client()

    # 1. Create via POST (JSON -> 302 Redirect -> GET)
    resp_create = client.post(
        "/admin/api/countries",
        json={
            "code": "BR",
            "country": "Brasil",
            "continent": "América do Sul",
            "provider": "Operadora BR",
            "tech": "5G",
            "lat": -14.235,
            "lng": -51.9253,
        },
    )
    assert resp_create.status_code == 302
    assert test_mgr.get("BR")["tech"] == "5G"

    # 2. Update via POST (Form data -> 302 Redirect -> GET)
    resp_update = client.post(
        "/admin/api/countries/BR/update",
        data={
            "country": "Brasil",
            "continent": "América do Sul",
            "provider": "Nova Operadora BR",
            "tech": "5G+",
            "lat": "-14.235",
            "lng": "-51.9253",
        },
    )
    assert resp_update.status_code == 302
    assert test_mgr.get("BR")["provider"] == "Nova Operadora BR"
    assert test_mgr.get("BR")["tech"] == "5G+"

    # 3. Delete via POST (JSON -> 302 Redirect -> GET)
    resp_delete = client.post("/admin/api/countries/BR/delete", json={})
    assert resp_delete.status_code == 302
    assert test_mgr.get("BR") is None

    # 4. Renderização Jinja nas rotas GET (/ e /admin/)
    test_mgr.create("IT", {**sample_country, "code": "IT", "country": "Itália", "tech": "5G"})
    resp_home = client.get("/?code=IT")
    assert resp_home.status_code == 200
    assert "COBERTURA DISPONÍVEL" in resp_home.get_data(as_text=True)

    resp_admin = client.get("/admin/?search=IT")
    assert resp_admin.status_code == 200
    assert "Instrumentação da Tabela Hash" in resp_admin.get_data(as_text=True)


