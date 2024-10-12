from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
import logging
import bcrypt  # Pour le hachage des mots de passe
from logging.config import dictConfig


dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'stream': 'ext://flask.logging.wsgi_errors_stream',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Remplace par une clé secrète

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'  # Pour SQLite
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/mydatabase'  # Pour PostgreSQL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False



db = SQLAlchemy(app)


with app.app_context():
    db.drop_all()  # Supprimer toutes les tables
    db.create_all()  # Recréer toutes les tables avec les bons schémas

# Modèle pour les utilisateurs
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    age = db.Column(db.Integer, nullable=False)
    password = db.Column(db.String(128), nullable=False)  # Ajout du mot de passe

    favorites = db.relationship('Favorite', backref='user', lazy=True)

    def __repr__(self):
        return f"<User {self.name}>"

class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(300), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f"<Favorite {self.name}, {self.latitude}, {self.longitude}>"

# Créer la base de données et la table
with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return render_template('index.html', user=session.get('user'))

@app.route('/add_user', methods=['POST'])
def add_user():
    name = request.form['name']
    email = request.form['email']
    age = request.form['age']
    password = request.form['password']

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        flash("Email déjà utilisé.")
        return redirect(url_for('home'))

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = User(name=name, email=email, age=age, password=hashed_password)

    db.session.add(new_user)
    db.session.commit()

    session['user'] = {'id': new_user.id, 'name': new_user.name, 'email': new_user.email, 'age': new_user.age}
    logging.info(new_user)
    return redirect(url_for('account'))

@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']
    
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):        
        session['user'] = {'name': user.name, 'email': user.email, 'age': user.age}
        return redirect(url_for('account'))
    
    flash("Identifiants invalides.")
    return redirect(url_for('home'))

@app.route('/logout')
def logout():
    session.pop('user', None)  # Supprime l'utilisateur de la session
    return redirect(url_for('home'))

@app.route('/account')
def account():
    logging.info("toto")
    user = session.get('user')
    if not user:
        return redirect(url_for('home'))
    return render_template('account.html', user=user)

@app.route('/favorites')
def favorites():
    user = session.get('user')
    if not user:
        return redirect(url_for('home'))


    logging.debug(user['id'])
    user_favorites = Favorite.query.filter_by(user_id=user['id']).all()
    return render_template('favorites.html', favorites=user_favorites)

@app.route('/add-favorite/<name>/<float:lat>/<float:lon>')
def add_favorite(name, lat, lon):
    user = session.get('user')
    if not user:
        return redirect(url_for('home'))

    new_favorite = Favorite(name=name, latitude=lat, longitude=lon, user_id=user['id'])
    db.session.add(new_favorite)
    db.session.commit()
    return redirect(url_for('favorites'))

@app.route('/remove_favorite/<int:favorite_id>', methods=['POST'])
def remove_favorite(favorite_id):
    favorite = Favorite.query.get(favorite_id)
    if favorite:
        db.session.delete(favorite)
        db.session.commit()
        return redirect(url_for('favorites'))
    return "Favori non trouvé.", 404

@app.route('/account_info')
def account_info():
    user = session.get('user')
    if not user:
        return redirect(url_for('home'))
    return render_template('account_info.html', user=user)

if __name__ == '__main__':
    logging.info("lancement")
    app.run(debug=True)
