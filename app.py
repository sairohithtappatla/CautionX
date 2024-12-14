from flask import Flask, request, jsonify, render_template
import requests
import base64
import os
from datetime import datetime

app = Flask(__name__)
VIRUSTOTAL_API_KEY = os.getenv("444ec6e96eb56f7cc57428b59b102053fc8370693394157cef5fab3c9dbf6f47")

def heuristic_score(url):
    """Generates a simulated AI-based threat score based on common URL characteristics."""
    score = 0
    risky_keywords = ["login", "bank", "secure", "update", "verify"]
    if any(keyword in url.lower() for keyword in risky_keywords):
        score += 20
    if len(url) > 60:
        score += 15
    if any(char in url for char in ['@', '%', '$', '&', '?']):
        score += 25
    return min(score, 100)

def analyze_url(url):
    if not VIRUSTOTAL_API_KEY:
        return {"error": "API key is missing. Please set the API key."}

    headers = {
        "x-apikey": VIRUSTOTAL_API_KEY
    }
    encoded_url = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
    api_url = f'https://www.virustotal.com/api/v3/urls/{encoded_url}'

    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        last_analysis_stats = data['data']['attributes'].get('last_analysis_stats', {})
        malicious_score = last_analysis_stats.get('malicious', 0)
        threat_score = 100 - (malicious_score * 10) if malicious_score else heuristic_score(url)

        live_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        first_submission = data['data']['attributes'].get('first_submission_date', None)
        last_analysis = data['data']['attributes'].get('last_analysis_date', None)

        first_submission = datetime.utcfromtimestamp(first_submission).strftime('%Y-%m-%d %H:%M:%S') if first_submission else live_time
        last_analysis = datetime.utcfromtimestamp(last_analysis).strftime('%Y-%m-%d %H:%M:%S') if last_analysis else live_time

        return {
            "categories": data['data']['attributes'].get('categories', 'Uncategorized'),
            "first_submission": first_submission,
            "last_analysis": last_analysis,
            "final_url": data['data']['attributes'].get('url', 'No URL Available'),
            "status_code": data['data']['attributes'].get('http_response_code', 'Unavailable'),
            "content_type": data['data']['attributes'].get('content_type', 'Unknown'),
            "serving_ip": data['data']['attributes'].get('ip_address', 'Unavailable'),
            "body_length": data['data']['attributes'].get('body_length', 'Unknown size'),
            "threat_score": threat_score,
            "analysis_summary": "This URL exhibits characteristics of a potentially risky or suspicious link." if threat_score > 50 else "This URL appears to be relatively safe."
        }
    except requests.exceptions.RequestException as e:
        print(f"Error during API request: {e}")
        return {"error": "Request failed. Please check the API key and network connection."}

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/url_detection', methods=['POST'])
def url_detection():
    url = request.form.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    analysis_result = analyze_url(url)
    is_safe = analysis_result.get('threat_score', 0) > 50
    return jsonify({"is_safe": is_safe})

@app.route('/threat_analysis', methods=['POST'])
def threat_analysis():
    url = request.form.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    analysis_result = analyze_url(url)
    if "error" in analysis_result:
        return jsonify(analysis_result), 500
    
    return jsonify(analysis_result)

if __name__ == "__main__":
    app.run(debug=True)
