from app.models.country import CountriesManager
from app.models.connectivity import ConnectivityManager
from app.models.package import packages_manager
from app.routes.client import client_manager
from flask import Blueprint, render_template, request, jsonify

home_bp = Blueprint('home', __name__)
countries_manager = CountriesManager()
connectivity_manager = ConnectivityManager(
    client_manager=client_manager,
    countries_manager=countries_manager
)

initial_point = {"lat": -12.9714, "lng": -38.5014, "zoom": 13}

@home_bp.route('/')
def index():
    searched_code = request.args.get('code', '').strip().upper()
    coverage_result = None
    if searched_code:
        country = countries_manager.get(searched_code)
        inst = countries_manager.get_instrumentation()
        if country:
            coverage_result = {
                "available": True,
                "code": country.get("code", searched_code).upper(),
                "name": country.get("country"),
                "continent": country.get("continent"),
                "provider": country.get("provider"),
                "tech": country.get("tech"),
                "comparisons": inst["last_search_comparisons"],
                "bucket": inst["last_search_bucket"],
            }
        else:
            coverage_result = {
                "available": False,
                "code": searched_code,
                "comparisons": inst["last_search_comparisons"],
                "bucket": inst["last_search_bucket"],
            }
    countries = sorted(
        countries_manager.get_all(),
        key=lambda c: (c.get("country") or "").lower()
    )
    return render_template(
        'home.html',
        point=initial_point,
        countries=countries,
        packages=packages_manager.get_all(),
        searched_code=searched_code,
        coverage_result=coverage_result,
    )

@home_bp.route('/api/countries', methods=['GET'])
def list_countries():
    # Retorno de ID, nome do país e coordenadas de todos os países presentes no sistema.
    countries = countries_manager.get_all()
    response = {
        c["code"]: {
            "name": c.get("country"),
            "coordinates": c.get("coordinates"),
        }
        for c in countries
    }

    return jsonify(response), 200


@home_bp.route('/api/countries/<string:country_id>', methods=['GET'])
def get_country(country_id):
    # Retorno de todas as informações do país ID selecionado e métricas de busca.
    country = countries_manager.get(country_id)
    inst = countries_manager.get_instrumentation()

    if not country:
        return jsonify({
            "error": "Country not found",
            "code": country_id.strip().upper(),
            "comparisons": inst["last_search_comparisons"],
            "bucket": inst["last_search_bucket"],
        }), 404

    response = {
        "code": country.get("code", country_id).upper(),
        "name": country.get("country"),
        "continent": country.get("continent"),
        "provider": country.get("provider"),
        "tech": country.get("tech"),
        "comparisons": inst["last_search_comparisons"],
        "bucket": inst["last_search_bucket"],
    }

    return jsonify(response), 200


@home_bp.route('/api/connectivity', methods=['GET'])
def check_connectivity():
    raw_client_id = request.args.get('client_id', '').strip()
    country_code = request.args.get('country_code', '').strip().upper()

    if not raw_client_id or not country_code:
        return jsonify({"error": "Parâmetros 'client_id' e 'country_code' são obrigatórios."}), 400

    try:
        client_id = int(raw_client_id)
    except ValueError:
        return jsonify({"error": "O 'client_id' deve ser um número inteiro."}), 400

    result = connectivity_manager.check(client_id, country_code)
    if not result:
        return jsonify({
            "error": f"Cliente com ID {client_id} não encontrado na Árvore B.",
            "client_found": False
        }), 404

    return jsonify(result), 200




