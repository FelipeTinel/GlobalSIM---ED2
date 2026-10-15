import pytest
from services.country import CountriesManager, Country


@pytest.fixture
def manager():
    return CountriesManager()


@pytest.fixture
def sample_country() -> Country:
    return {
        "code": "BR",
        "country": "Brasil",
        "continent": "América do Sul",
        "provider": "Claro",
        "tech": "3g",
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