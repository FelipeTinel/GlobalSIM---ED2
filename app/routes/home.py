from flask import Blueprint, render_template, request, jsonify

home_bp = Blueprint('home', __name__)

initial_point = {"lat": -12.9714, "lng": -38.5014, "zoom": 13}

@home_bp.route('/')
def index():
    return render_template('index.html', point=initial_point)

@home_bp.route('/api/countries', methods=['GET'])
def list_countries():
    countries = {"contries" : "countries"}
    return jsonify(countries)

@home_bp.route('/api/countries/<int:country_id>', methods=['GET'])
def get_country(country_id):
    return 

@home_bp.route('/api/users/<int:user_id>/country', methods=['POST'])
def select_country(user_id):
    return {"message" : "sucess"}

