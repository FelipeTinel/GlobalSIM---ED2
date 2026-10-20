from app.models.country import countries_manager
from flask import Blueprint, render_template, request, redirect, url_for, jsonify

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


def _extract_payload() -> dict:
    if request.is_json:
        return request.get_json(silent=True) or {}
    return request.form.to_dict()


def _parse_coord(value):
    try:
        return float(value) if value not in (None, "") else None
    except (TypeError, ValueError):
        return None


@admin_bp.route('/', methods=['GET'])
def admin_page():
    searched_key = request.args.get('search', '').strip().upper()
    if searched_key:
        countries_manager.get(searched_key)

    countries = sorted(
        countries_manager.get_all(),
        key=lambda c: (c.get("country") or "").lower()
    )
    instrumentation = countries_manager.get_instrumentation()
    return render_template(
        'admin.html',
        countries=countries,
        instrumentation=instrumentation,
    )


@admin_bp.route('/api/instrumentation', methods=['GET'])
def get_instrumentation():
    # Retorno das métricas e estado interno dos buckets da Tabela Hash.
    return jsonify(countries_manager.get_instrumentation()), 200


@admin_bp.route('/api/countries', methods=['GET'])
def get_countries():
    # Retorno dos nomes e IDs de todos os países.
    countries = countries_manager.get_all()
    response = {
        c["code"]: {
            "name": c.get("country"),
            "coordinates": c.get("coordinates"),
            "continent": c.get("continent"),
            "provider": c.get("provider"),
            "tech": c.get("tech"),
        }
        for c in countries
    }

    return jsonify(response), 200


@admin_bp.route('/api/countries/<string:country_id>', methods=['GET'])
def get_country(country_id):
    # Retorno de todos os dados, exceto coordenadas, do país do ID informado.
    country = countries_manager.get(country_id)

    if not country:
        return jsonify({"error": "Country not found"}), 404

    country_info = {
        "code": country.get("code"),
        "country": country.get("country"),
        "continent": country.get("continent"),
        "provider": country.get("provider"),
        "tech": country.get("tech")
    }

    return jsonify(country_info), 200


@admin_bp.route('/api/countries', methods=['POST'])
def create_country():
    # Cadastro de país utilizando POST e padrão Post/Redirect/Get.
    data = _extract_payload()
    if not data:
        return jsonify({"error": "No country data provided"}), 400

    code = (data.get("code") or data.get("id") or "").strip().upper()
    new_country = {
        "code": code,
        "country": data.get("country") or data.get("name"),
        "continent": data.get("continent"),
        "provider": data.get("provider"),
        "tech": data.get("tech"),
        "coordinates": [_parse_coord(data.get("lat")), _parse_coord(data.get("lng"))]
    }

    try:
        countries_manager.create(key=code, country=new_country)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except KeyError as err:
        return jsonify({"error": str(err)}), 409

    if not request.is_json:
        return redirect(url_for('admin.admin_page'))
    return redirect(url_for('admin.get_countries'))


@admin_bp.route('/api/countries/<string:country_id>/update', methods=['POST'])
def update_country(country_id):
    # Alteração dos dados de um país utilizando exclusivamente POST e Post/Redirect/Get.
    data = _extract_payload()
    if not data:
        return jsonify({"error": "No country data provided"}), 400

    updated_country = {
        "code": country_id.strip().upper(),
        "country": data.get("country") or data.get("name"),
        "continent": data.get("continent"),
        "provider": data.get("provider"),
        "tech": data.get("tech"),
        "coordinates": [_parse_coord(data.get("lat")), _parse_coord(data.get("lng"))]
    }

    try:
        countries_manager.update(key=country_id, country=updated_country)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except KeyError:
        return jsonify({"error": "Country not found"}), 404

    if not request.is_json:
        return redirect(url_for('admin.admin_page'))
    return redirect(url_for('admin.get_countries'))


@admin_bp.route('/api/countries/<string:country_id>/delete', methods=['POST'])
def delete_country(country_id):
    # Remoção de país utilizando exclusivamente POST e Post/Redirect/Get.
    try:
        countries_manager.delete(country_id)
    except KeyError:
        return jsonify({"error": "Country not found"}), 404

    if not request.is_json:
        return redirect(url_for('admin.admin_page'))
    return redirect(url_for('admin.get_countries'))


