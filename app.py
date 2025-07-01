from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import smtplib
from email.mime.text import MIMEText
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")

# ✅ Atlas connection URI from environment
app.config["MONGO_URI"] = os.environ.get("MONGO_URI")
mongo = PyMongo(app)

# ✅ Native PyMongo for users collection (reuse Atlas connection)
client = MongoClient(os.environ.get("MONGO_URI"))
db = client['seniorCircle']
users_collection = db['users']

EMAIL_USER = os.environ.get("EMAIL_USER")
EMAIL_PASS = os.environ.get("EMAIL_PASS")

@app.route("/", methods=["GET", "POST"])
def home():
    return render_template("home_page.html")

services = {
    "Healthcare": [
        {"name": "Visiting Nurse Services", "description": "Registered nurses providing in-home care and wellness checks.", "contact": "nurses@seniorcircle.org"},
        {"name": "Mobile Health Clinic", "description": "Free mobile clinic providing screenings and flu shots.", "contact": "clinic@seniorcircle.org"},
        {"name": "Telehealth for Seniors", "description": "Online doctor consultations via video call.", "contact": "telecare@seniorcircle.org"},
        {"name": "Medication Delivery", "description": "Home delivery of prescriptions and medication reminders.", "contact": "meds@seniorcircle.org"},
        {"name": "Physical Therapy at Home", "description": "In-home physical therapy for post-surgery recovery.", "contact": "pt@seniorcircle.org"},
        {"name": "Nutrition Counseling", "description": "Personalized diet plans and advice from senior nutritionists.", "contact": "nutrition@seniorcircle.org"}
    ],
    "Legal Assistance": [
        {"name": "Senior Legal Aid", "description": "Free legal consultations for wills and power of attorney.", "contact": "legal@seniorcircle.org"},
        {"name": "Tenant Rights Support", "description": "Help for seniors facing rental issues or housing discrimination.", "contact": "tenants@seniorcircle.org"},
        {"name": "Medicare Legal Help", "description": "Assistance with disputes related to Medicare claims.", "contact": "medicarelaw@seniorcircle.org"},
        {"name": "Elder Abuse Protection", "description": "Support and resources for seniors experiencing abuse.", "contact": "abusehelp@seniorcircle.org"},
        {"name": "Estate Planning Services", "description": "Workshops and one-on-one help with estate and asset planning.", "contact": "estate@seniorcircle.org"},
        {"name": "Notary Services", "description": "Free document notarization at community centers.", "contact": "notary@seniorcircle.org"}
    ],
    "Transportation": [
        {"name": "Elder Ride Services", "description": "Affordable rides to appointments, grocery stores, and more.", "contact": "rides@seniorcircle.org"},
        {"name": "Volunteer Drivers Program", "description": "Community volunteers driving seniors to key locations.", "contact": "volunteer@seniorcircle.org"},
        {"name": "Accessible Van Services", "description": "Wheelchair-accessible transport for limited mobility seniors.", "contact": "accessible@seniorcircle.org"},
        {"name": "Shuttle to Health Clinics", "description": "Daily shuttle service to nearby hospitals and clinics.", "contact": "shuttle@seniorcircle.org"},
        {"name": "Senior Transit Pass Assistance", "description": "Help applying for discounted public transit passes.", "contact": "transitpass@seniorcircle.org"},
        {"name": "Grocery Shuttle Bus", "description": "Weekly shuttle for shopping trips with helpers onboard.", "contact": "grocerybus@seniorcircle.org"}
    ],
    "Home Services": [
        {"name": "Home Maintenance Help", "description": "Light plumbing, electrical, and safety upgrades.", "contact": "homefix@seniorcircle.org"},
        {"name": "Meal Delivery Program", "description": "Hot meals delivered daily to senior homes.", "contact": "meals@seniorcircle.org"},
        {"name": "Housekeeping for Seniors", "description": "Weekly cleaning and tidying services.", "contact": "cleaning@seniorcircle.org"},
        {"name": "Gardening Help", "description": "Yard cleanup and seasonal gardening for seniors.", "contact": "garden@seniorcircle.org"},
        {"name": "Home Safety Assessment", "description": "Professional visits to check for fall risks and hazards.", "contact": "safety@seniorcircle.org"},
        {"name": "Winter Heating Aid", "description": "Assistance with heating bills and emergency furnace repairs.", "contact": "heating@seniorcircle.org"}
    ],
}

@app.route('/services')
def services_page():
    return render_template("services.html")

@app.route('/api/services')
def get_services():
    category = request.args.get('category', '')
    query = request.args.get('search', '').lower()

    if category not in services:
        return jsonify({"services": []})

    filtered = [s for s in services[category] if query in s['name'].lower() or query in s['description'].lower()]
    return jsonify({"services": filtered})

@app.route("/events")
def events():
    return render_template("events.html")

@app.route("/api/events", methods=["GET"])
def get_events():
    category = request.args.get("category", "").lower()
    location = request.args.get("location", "").lower()

    query = {"status": "approved"}
    if category:
        query["category"] = category
    if location:
        query["location"] = {"$regex": location, "$options": "i"}

    events = list(mongo.db.events.find(query))
    for event in events:
        event["_id"] = str(event["_id"])
    return jsonify(events)

@app.route("/api/events/suggest", methods=["POST"])
def suggest_event():
    data = request.json
    event = {
        "title": data["title"],
        "desc": data["desc"],
        "date": data["date"],
        "location": data["location"],
        "category": data["category"],
        "status": "pending"
    }
    mongo.db.events.insert_one(event)
    return jsonify({"message": "Event suggestion submitted!"}), 201

@app.route("/api/events/pending", methods=["GET"])
def get_pending_events():
    events = list(mongo.db.events.find({"status": "pending"}))
    for event in events:
        event["_id"] = str(event["_id"])
    return jsonify(events)

@app.route("/api/events/<event_id>/status", methods=["POST"])
def update_event_status(event_id):
    status = request.json.get("status")
    if status not in ["approved", "rejected"]:
        return jsonify({"error": "Invalid status"}), 400
    mongo.db.events.update_one({"_id": ObjectId(event_id)}, {"$set": {"status": status}})
    return jsonify({"message": f"Event {status}."})

@app.route('/send_rsvp', methods=['POST'])
def send_rsvp():
    data = request.get_json()
    email = data.get('email')
    event_title = data.get('title')

    subject = f"RSVP Confirmation for '{event_title}'"
    body = f"Thank you for RSVPing to '{event_title}'. We look forward to seeing you!"

    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = EMAIL_USER
        msg['To'] = email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)

        return jsonify({"message": "RSVP confirmation sent!"})
    except Exception as e:
        print("RSVP email error:", e)
        return jsonify({"message": "Failed to send RSVP email."}), 500

@app.route("/support")
def support():
    return render_template("support_program.html")

@app.route("/community")
def community():
    return render_template("community.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        user = users_collection.find_one({"username": username})
        if user and check_password_hash(user["password"], password):
            session["user"] = username
            return redirect("/")
        else:
            return redirect(url_for("login", error="1"))
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if users_collection.find_one({"username": username}):
            return redirect(url_for("register", error="1"))

        hashed_pw = generate_password_hash(password)
        users_collection.insert_one({"username": username, "password": hashed_pw})
        return redirect("/login")

    return render_template("register.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect("/")

@app.route("/api/user")
def api_user():
    if "user" in session:
        return {"loggedIn": True, "username": session["user"]}
    return {"loggedIn": False}

@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        username = request.form.get("username")
        user = users_collection.find_one({"username": username})
        if user:
            return render_template("reset_password.html", username=username)
        else:
            return "<script>alert('User not found!'); window.location='/forgot-password';</script>"
    return render_template("forgot_password.html")

@app.route("/reset-password", methods=["POST"])
def reset_password():
    username = request.form.get("username")
    new_password = request.form.get("new_password")
    hashed_pw = generate_password_hash(new_password)

    result = users_collection.update_one({"username": username}, {"$set": {"password": hashed_pw}})
    if result.modified_count == 1:
        return "<script>alert('Password reset successfully!'); window.location='/login';</script>"
    else:
        return "<script>alert('Error resetting password.'); window.location='/forgot-password';</script>"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
