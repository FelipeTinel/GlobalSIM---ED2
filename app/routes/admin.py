from flask import Blueprint, render_template

admin_bp = Blueprint('admin',__name__, url_prefix='/admin')

@admin_bp.route('/')
def admin_page():
    return render_template('admin.html')

@admin_bp.route('/api/countries', methods=['GET'])
def get_countries():
    pass

@admin_bp.route('/api/countries/<int:country_id>', methods=['GET'])
def get_country(country_id):
    pass

@admin_bp.route('/api/countries/create', methods=['POST'])
def create_country():
    pass

@admin_bp.route('/api/countries/update', methods=['PUT'])
def update_country():
    pass

@admin_bp.route('/api/countries/delete', methods=['DELETE'])
def delete_country():
    pass