from flask import Blueprint, render_template

home_bp = Blueprint('home', __name__)

@home_bp.route('/')
def index():
    initial_point = {"lat": -12.9714, "lng": -38.5014, "zoom": 13}
    
    return render_template('index.html', point=initial_point)