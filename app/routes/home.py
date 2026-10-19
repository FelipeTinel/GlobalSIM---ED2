from app.models.country import countries_manager
from flask import Blueprint, render_template, request, jsonify

"""
OBS OPAA FELIPE TINEL OLHAR OI VEJA AQUI PFV OI

Acho que dá pra ver, não temos lógica nenhuma aplicada nas rotas. Só fiz as rotas. O mesmo fale pra admin,
depois vamos ter que implementar. Um detalhe importante, as coordenadas talvez tenham que ser implementadas
no DF, mas deixa que eu olho melhor a respeito disso.

"""


home_bp = Blueprint('home', __name__)

initial_point = {"lat": -12.9714, "lng": -38.5014, "zoom": 13}

@home_bp.route('/')
def index():
    return render_template('home.html', point=initial_point)

@home_bp.route('/api/countries', methods=['GET'])
def list_countries():
    # Retorno de ID, nome do país e coordenadas de todos os países presentes no sistema.
    countries = countries_manager.get_all()
    response = {
        c["code"]: {
            "name": c.get("country"),
            "coordinates": c.get("coordinates")
        }
        for c in countries
    }

    return jsonify(response), 200

@home_bp.route('/api/countries/<string:country_id>', methods=['GET'])
def get_country(country_id):
    # Retorno de todas as informações do país ID selecionado, menos as coordenadas.
    country = countries_manager.get(country_id)

    if not country:
        return jsonify({"error": "Country not found"}), 404

    response = {
        "name": country.get("country"),
        "continent": country.get("continent"),
        "provider": country.get("provider"),
        "tech": country.get("tech"),
    }

    return jsonify(response), 200

@home_bp.route('/api/users/<int:user_id>/country', methods=['POST'])
def select_country(user_id):
    # Acho que isso aqui não precisa por enquanto, deixa baixo.
    pass

