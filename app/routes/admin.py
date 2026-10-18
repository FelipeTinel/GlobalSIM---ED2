from app.models.country import countries_manager
from flask import Blueprint, render_template, request, redirect, url_for

admin_bp = Blueprint('admin',__name__, url_prefix='/admin')

@admin_bp.route('/')
def admin_page():
    return render_template('admin.html')

@admin_bp.route('/api/countries', methods=['GET'])
def get_countries():
    # Retorno dos nomes e IDs de todos os países.
    pass

@admin_bp.route('/api/countries/<int:country_id>', methods=['GET'])
def get_country(country_id):
    # Retorno de todos os dados, exceto coordenadas, do país do ID informado.
    pass

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

@admin_bp.route('/api/countries/<int:country_id>', methods=['PUT'])
def update_country(country_id):
    # Recebe, novamente, todos os dados de um país, mas dessa vez você só atualiza o do ID informado.
    pass

@admin_bp.route('/api/countries', methods=['DELETE'])
def delete_country():
    # Recebe um ID e você vrau.
    pass