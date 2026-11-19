from flask import Blueprint, render_template, request, jsonify
from app.models.client import ClientManager, Client
from app.models.package import packages_manager

clients_bp = Blueprint('client', __name__)
client_manager = ClientManager()


def _enrich_client_package(client: dict) -> dict:
    enriched = dict(client)
    pkg_info = packages_manager.get(enriched.get("pkg"))
    if pkg_info:
        enriched["pkg_name"] = pkg_info["name"]
        enriched["pkg_data"] = pkg_info["data"]
        enriched["pkg_validity"] = pkg_info["validity"]
    else:
        pkg_code = enriched.get("pkg")
        enriched["pkg_name"] = f"Pacote #{pkg_code}" if pkg_code else "Não associado"
        enriched["pkg_data"] = "—"
        enriched["pkg_validity"] = "—"
    return enriched


@clients_bp.route('/session', methods=['GET'])
@clients_bp.route('/login', methods=['GET'])
def session_page():
    return render_template('session.html', packages=packages_manager.get_all())


@clients_bp.route('/packages', methods=['GET'])
def get_all_packages():
    return jsonify(packages_manager.get_all()), 200


@clients_bp.route('/clients', methods=['GET'])
def get_all_clients():
    clients = client_manager.get_all()
    response = [{"id": c["id"], "name": c["name"], "country": c.get("country", "")} for c in clients]
    return jsonify(response), 200


@clients_bp.route('/clients/<int:client_id>', methods=['GET'])
def get_client(client_id: int):
    client = client_manager.get(client_id)
    if not client:
        return jsonify({"error": "Client not found"}), 404

    # Ensure presence of is_logged attribute (default False)
    if "is_logged" not in client:
        client["is_logged"] = False

    return jsonify(_enrich_client_package(client)), 200


@clients_bp.route('/clients', methods=['POST'])
def create_client():
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data:
        return jsonify({"error": "No client data provided"}), 400

    raw_id = data.get("id")
    if raw_id is None or raw_id == "":
        return jsonify({"error": "Client ID is required"}), 400

    try:
        client_id = int(raw_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Client ID must be an integer"}), 400

    raw_is_logged = data.get("is_logged")
    if isinstance(raw_is_logged, str):
        is_logged = raw_is_logged.lower() in ("true", "1", "yes")
    elif isinstance(raw_is_logged, bool):
        is_logged = raw_is_logged
    else:
        is_logged = True

    try:
        client_data: Client = {
            "id": client_id,
            "name": str(data.get("name", "")).strip(),
            "email": str(data.get("email", "")).strip(),
            "esim": str(data.get("esim", "")).strip(),
            "pkg": int(data.get("pkg", 0)),
            "country": str(data.get("country", "")).strip().upper(),
            "status": str(data.get("status", "ativo")).strip(),
            "is_logged": is_logged,
        }
        client_manager.create(client_data)
        return jsonify(_enrich_client_package(client_data)), 201
    except ValueError as err:
        return jsonify({"error": str(err)}), 400


@clients_bp.route('/clients/<int:client_id>', methods=['PUT'])
def update_client(client_id: int):
    existing = client_manager.get(client_id)
    if not existing:
        return jsonify({"error": "Client not found"}), 404

    data = request.get_json(silent=True) or request.form.to_dict()
    if not data:
        return jsonify({"error": "No client data provided"}), 400

    raw_is_logged = data.get("is_logged")
    if raw_is_logged is not None:
        if isinstance(raw_is_logged, str):
            is_logged = raw_is_logged.lower() in ("true", "1", "yes")
        else:
            is_logged = bool(raw_is_logged)
    else:
        is_logged = existing.get("is_logged", False)

    try:
        updated_client: Client = {
            "id": client_id,
            "name": str(data.get("name", existing.get("name", ""))).strip(),
            "email": str(data.get("email", existing.get("email", ""))).strip(),
            "esim": str(data.get("esim", existing.get("esim", ""))).strip(),
            "pkg": int(data.get("pkg", existing.get("pkg", 0))),
            "country": str(data.get("country", existing.get("country", ""))).strip().upper(),
            "status": str(data.get("status", existing.get("status", "ativo"))).strip(),
            "is_logged": is_logged,
        }
        client_manager.update(client_id, updated_client)
        return jsonify(_enrich_client_package(updated_client)), 200
    except (KeyError, ValueError) as err:
        return jsonify({"error": str(err)}), 400


@clients_bp.route('/clients/<int:client_id>', methods=['DELETE'])
def delete_client(client_id: int):
    existing = client_manager.get(client_id)
    if not existing:
        return jsonify({"error": "Client not found"}), 404

    try:
        client_manager.delete(client_id)
        return jsonify({"message": f"Client with ID {client_id} successfully deleted", "id": client_id}), 200
    except KeyError:
        return jsonify({"error": "Client not found"}), 404
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@clients_bp.route('/clients/country/<string:country_code>', methods=['GET'])
def get_clients_by_country(country_code: str):
    """
    Endpoint for the team differential:
    Retrieves clients for a specific country using the Secondary B-Tree.
    """
    code = country_code.strip().upper()
    clients = client_manager.get_by_country(code)
    inst = client_manager.get_instrumentation()
    secondary_metrics = inst.get("secondary", {})

    return jsonify({
        "country": code,
        "total_clients": len(clients),
        "clients": clients,
        "instrumentation": {
            "order": secondary_metrics.get("order"),
            "height": secondary_metrics.get("height"),
            "total_countries": secondary_metrics.get("total_keys"),
            "splits_count": secondary_metrics.get("splits_count"),
            "last_search_key": secondary_metrics.get("last_search_key"),
            "last_search_comparisons": secondary_metrics.get("last_search_comparisons"),
            "last_search_nodes_visited": secondary_metrics.get("last_search_nodes_visited"),
        }
    }), 200


@clients_bp.route('/clients/instrumentation', methods=['GET'])
def get_clients_instrumentation():
    """Returns instrumentation metrics for both primary and secondary B-trees."""
    return jsonify(client_manager.get_instrumentation()), 200
