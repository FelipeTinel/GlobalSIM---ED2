from typing import Any
from app.models.client import ClientManager
from app.models.country import CountriesManager

PACKAGE_NAMES: dict[int, str] = {
    101: "Global Standard (5 GB)",
    102: "Global Plus (10 GB)",
    103: "Global Ultra (20 GB)",
    104: "Americas & Europa Pass (15 GB)",
    105: "World Traveler Pro (30 GB)",
    201: "Regional Americas (10 GB)",
    202: "Regional Europa (10 GB)",
    203: "Regional Asia-Pacific (10 GB)",
}


class ConnectivityManager:
    def __init__(
        self,
        client_manager: ClientManager | None = None,
        countries_manager: CountriesManager | None = None
    ):
        self.client_manager = client_manager or ClientManager()
        self.countries_manager = countries_manager or CountriesManager()

    def check(self, client_id: int, country_code: str) -> dict[str, Any] | None:
        code = country_code.strip().upper()

        # 1. Árvore B: Busca do cliente pelo ID em O(log n)
        client = self.client_manager.get(client_id)
        if not client:
            return None

        btree_inst = self.client_manager.get_instrumentation()

        # 2. Tabela Hash: Busca do país de destino pelo código em O(1) médio
        country = self.countries_manager.get(code)
        hash_inst = self.countries_manager.get_instrumentation()

        # 3. Consolidação de Conectividade
        is_client_active = (client.get("status") or "").lower() == "ativo"
        has_coverage = country is not None

        if not is_client_active:
            status_key = "inactive"
            status_label = "eSIM Inativo"
            guaranteed = False
            message = f"O eSIM ({client.get('esim')}) de {client.get('name')} está inativo. Ative sua linha antes de viajar."
        elif not has_coverage:
            status_key = "unavailable"
            status_label = "Sem Cobertura no Destino"
            guaranteed = False
            message = f"O destino '{code}' não possui cobertura disponível na rede GlobalSIM."
        else:
            status_key = "guaranteed"
            status_label = "Conectividade Garantida!"
            guaranteed = True
            message = f"O plano de {client.get('name')} funcionará normalmente em {country.get('country')} via rede {country.get('tech')} da operadora {country.get('provider')}."

        pkg_code = client.get("pkg")
        pkg_name = PACKAGE_NAMES.get(pkg_code, f"Pacote #{pkg_code}")

        return {
            "client": {
                "id": client["id"],
                "name": client["name"],
                "email": client.get("email"),
                "esim": client.get("esim"),
                "pkg": pkg_code,
                "pkg_name": pkg_name,
                "status": client.get("status"),
                "btree_search": {
                    "key": btree_inst.get("last_search_key"),
                    "comparisons": btree_inst.get("last_search_comparisons"),
                    "nodes_visited": btree_inst.get("last_search_nodes_visited"),
                }
            },
            "destination": {
                "code": country.get("code", code).upper() if country else code,
                "name": country.get("country") if country else None,
                "continent": country.get("continent") if country else None,
                "provider": country.get("provider") if country else None,
                "tech": country.get("tech") if country else None,
                "available": has_coverage,
                "hash_search": {
                    "bucket": hash_inst.get("last_search_bucket"),
                    "comparisons": hash_inst.get("last_search_comparisons"),
                }
            },
            "connectivity": {
                "status": status_key,
                "label": status_label,
                "message": message,
                "guaranteed": guaranteed,
            }
        }
