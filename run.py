from flask import Flask
from app.routes.home import home_bp

app = Flask(__name__, template_folder='app/templates')

app.register_blueprint(home_bp)

if __name__ == "__main__":
    app.run(debug=True)