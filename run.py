from flask import Flask
from app.routes.home import home_bp
from app.routes.admin import admin_bp

app = Flask(__name__, template_folder='app/templates', static_folder='app/static')

app.register_blueprint(home_bp)
app.register_blueprint(admin_bp)

if __name__ == "__main__":
    app.run(debug=True)