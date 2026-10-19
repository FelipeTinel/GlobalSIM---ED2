from app.models.country import countries_manager
from flask import Blueprint, render_template, request, redirect, url_for, jsonify

admin_bp = Blueprint('admin',__name__, url_prefix='/admin')

@admin_bp.route('/')
def admin_page():
    return render_template('admin.html')

@admin_bp.route('/api/countries', methods=['GET'])
def get_countries():
    # Retorno dos nomes e IDs de todos os países.
    countries = countries_manager.get_all()
    response = {
        c["code"]: {
            "name": c.get("country")
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
        "code": country.code,
        "country": country.country,
        "continent": country.continent,
        "provider": country.provider,
        "tech": country.tech
    }

    return jsonify(country_info), 200

@admin_bp.route('/api/countries', methods=['POST'])
def create_country():
    # Recebe todas as informações de um país, inclusive coordenadas (depois vejo como trato melhor isso).
    code = request.form.get('code')
    country = request.form.get('country')
    continent = request.form.get('continent')
    provider = request.form.get('provider')
    tech = request.form.get('tech')
    coordinates = request.form.get('coordinates') 

    new_country = {
        "code": code,
        "country": country,
        "continent": continent,
        "provider": provider,
        "tech": tech,
        "coordinates": coordinates
    }

    countries_manager.create(key=code, country=new_country)

    return redirect(url_for('admin.get_countries'))

@admin_bp.route('/api/countries/<string:country_id>', methods=['PUT'])
def update_country(country_id):
    # Recebe, novamente, todos os dados de um país, mas dessa vez você só atualiza o do ID informado.
    data = request.get_json()
    if not data:
        return jsonify({"error": "No country data provided"}), 400

    updated_country = {
        "code": country_id,
        "country": data.get("country") or data.get("name"),
        "continent": data.get("continent"),
        "provider": data.get("provider"),
        "tech": data.get("tech"),
        "coordinates": [data.get("lat"), data.get("lng")]
    }

    try: 
        countries_manager.update(key=country_id, country=updated_country)
        return jsonify({"message": f"Country {country_id} succesfully updated"}), 200
    except KeyError:
        return jsonify({"error": "Country not found"}), 404



@admin_bp.route('/api/countries/<string:country_id>', methods=['DELETE'])
def delete_country(country_id):
    # Recebe um ID e você vrau.
    try:
        countries_manager.delete(country_id)
        return jsonify({"message": f"Country: {country_id} successfully deleted"}), 200
    except KeyError:
        return jsonify({"error": "Country not found"}), 404

