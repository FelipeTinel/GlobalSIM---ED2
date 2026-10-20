from app.models.country import countries_manager
from flask import Blueprint, render_template, request, jsonify

home_bp = Blueprint('home', __name__)

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
    return render_template(
        'home.html',
        point=initial_point,
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

@home_bp.route('/api/users/<int:user_id>/country', methods=['POST'])
def select_country(user_id):
    # Acho que isso aqui não precisa por enquanto, deixa baixo.
    pass

