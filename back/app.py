import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app) # Allows frontend to communicate with backend

# Configuration
UPLOAD_FOLDER = 'uploads'
DB_FILE = 'gallery.db'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Database
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            filename TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Route 1: Upload a new image and save data
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image']
    name = request.form.get('name')
    description = request.form.get('description')

    if file.filename == '' or not name or not description:
        return jsonify({"error": "Missing data"}), 400

    # Secure the filename and save the file
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    # Save details to SQLite Database
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO images (name, description, filename) VALUES (?, ?, ?)", 
              (name, description, filename))
    conn.commit()
    new_id = c.lastrowid
    conn.close()

    return jsonify({
        "id": new_id,
        "name": name,
        "description": description,
        "filename": filename
    }), 201

# Route 2: Get all images for the gallery
@app.route('/images', methods=['GET'])
def get_images():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id, name, description, filename FROM images ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()

    # Format the data into a list of dictionaries
    images = []
    for row in rows:
        images.append({
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "imageUrl": f"http://127.0.0.1:5000/uploads/{row[3]}" # URL to view the image
        })
    return jsonify(images)

# Route 3: Serve the image files to the browser
@app.route('/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Route 4: Edit an existing image
# Route 4: Edit an existing image
@app.route('/edit/<int:image_id>', methods=['POST'])
def edit_image(image_id):
    print(f"\n--- EDIT REQUEST RECEIVED FOR ID: {image_id} ---")
    
    name = request.form.get('name')
    description = request.form.get('description')
    
    print(f"New Name: {name}")
    print(f"New Description: {description}")
    
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        # Check if a new image was uploaded
        if 'image' in request.files and request.files['image'].filename != '':
            print("New image file detected in request.")
            file = request.files['image']
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            c.execute("UPDATE images SET name = ?, description = ?, filename = ? WHERE id = ?", (name, description, filename, image_id))
            new_image_url = f"http://127.0.0.1:5000/uploads/{filename}"
            print(f"Saved new image to: {file_path}")
            
        else:
            print("No new image provided. Updating text only.")
            c.execute("UPDATE images SET name = ?, description = ? WHERE id = ?", (name, description, image_id))
            
            # Fetch existing filename so we don't break the image display
            c.execute("SELECT filename FROM images WHERE id = ?", (image_id,))
            result = c.fetchone()
            if result:
                filename = result[0]
                new_image_url = f"http://127.0.0.1:5000/uploads/{filename}"
            else:
                print("Error: Could not find image in database!")
                return jsonify({"error": "Image not found"}), 404
            
        conn.commit()
        conn.close()
        
        print("Database updated successfully!")
        return jsonify({
            "id": image_id,
            "name": name,
            "description": description,
            "imageUrl": new_image_url
        }), 200
        
    except Exception as e:
        print(f"ERROR DURING EDIT: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)