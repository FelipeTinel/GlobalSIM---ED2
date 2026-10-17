from flask import Blueprint, render_template

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
    pass

@admin_bp.route('/api/countries/<int:country_id>', methods=['PUT'])
def update_country(country_id):
    # Recebe, novamente, todos os dados de um país, mas dessa vez você só atualiza o do ID informado.
    pass

@admin_bp.route('/api/countries', methods=['DELETE'])
def delete_country():
    # Recebe um ID e você vrau.
    pass