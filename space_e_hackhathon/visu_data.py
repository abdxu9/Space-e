import sqlite3

# Se connecter à la base de données SQLite
conn = sqlite3.connect('instance/mydatabase.db')
cursor = conn.cursor()

# Fonction pour afficher les données d'une table donnée
def afficher_donnees(table_name):
    try:
        # Exécuter la requête SQL pour récupérer toutes les données de la table
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()

        if rows:
            # Récupérer les noms de colonnes
            col_names = [description[0] for description in cursor.description]
            print(f"--- Données de la table {table_name} ---")
            print(col_names)  # Afficher les noms de colonnes
            for row in rows:
                print(row)
        else:
            print(f"La table {table_name} est vide ou n'existe pas.")
    except sqlite3.OperationalError as e:
        print(f"Erreur : {e}")

# Afficher les données des tables "user" et "favorite"
afficher_donnees("User")
afficher_donnees("Favorite")

# Fermer la connexion à la base de données
conn.close()
