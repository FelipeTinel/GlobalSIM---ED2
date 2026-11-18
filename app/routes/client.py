from flask import Blueprint, render_template, request, jsonify
from app.models.client import ClientManager, Client

clients_bp = Blueprint('client', __name__)
client_manager = ClientManager()


@clients_bp.route('/session', methods=['GET'])
@clients_bp.route('/login', methods=['GET'])
def session_page():
    return render_template('session.html')


@clients_bp.route('/clients', methods=['GET'])
def get_all_clients():
    clients = client_manager.get_all()
    response = [{"id": c["id"], "name": c["name"]} for c in clients]
    return jsonify(response), 200


@clients_bp.route('/clients/<int:client_id>', methods=['GET'])
def get_client(client_id: int):
    client = client_manager.get(client_id)
    if not client:
        return jsonify({"error": "Client not found"}), 404

    # Garante a presença do atributo is_logged (padrão False se ausente no registro)
    if "is_logged" not in client:
        client["is_logged"] = False

    return jsonify(client), 200


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
        is_logged = True  # Por conveniência no fluxo de login/cadastro, novo cadastro já inicia logado por padrão

    try:
        client_data: Client = {
            "id": client_id,
            "name": str(data.get("name", "")).strip(),
            "email": str(data.get("email", "")).strip(),
            "esim": str(data.get("esim", "")).strip(),
            "pkg": int(data.get("pkg", 0)),
            "status": str(data.get("status", "ativo")).strip(),
            "is_logged": is_logged,
        }
        client_manager.create(client_data)
        return jsonify(client_data), 201
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
            "status": str(data.get("status", existing.get("status", "ativo"))).strip(),
            "is_logged": is_logged,
        }
        client_manager.update(client_id, updated_client)
        return jsonify(updated_client), 200
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

