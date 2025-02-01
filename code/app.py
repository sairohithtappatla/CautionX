from flask import Flask, request, jsonify, render_template
import requests
import base64
import os
import math
import re
import tldextract
from datetime import datetime

app = Flask(__name__)
VIRUSTOTAL_API_KEY = ("444ec6e96eb56f7cc57428b59b102053fc8370693394157cef5fab3c9dbf6f47")  
def calculate_entropy(url):
    """Calculate the entropy of a given URL."""
    prob = [float(url.count(c)) / len(url) for c in dict.fromkeys(list(url))]
    entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob])
    return entropy

def heuristic_score(url):
    """Generate a threat score based on URL characteristics."""
    score = 0
    extracted = tldextract.extract(url)
    domain = extracted.domain
    suffix = extracted.suffix

    # Check for risky keywords
    risky_keywords = ["login", "account", "secure", "update", "verify", "password", "bank", "paypal"]
    if any(keyword in domain.lower() for keyword in risky_keywords):
        score += 25

    # URL length and structure
    if len(url) > 75:
        score += 10
    if url.count('/') > 5:
        score += 5
    if any(char in url for char in ['@', '=', '?', '&', '%']):
        score += 5
    if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url):
        score += 15
    if re.search(r'[0-9a-fA-F]{32}', url):
        score += 10

    # Entropy
    entropy = calculate_entropy(url)
    if entropy > 4.5:
        score += 20

    # Domain suffix analysis
    if suffix not in ['com', 'org', 'net', 'edu', 'gov']:
        score += 5

    return min(score, 100)

def analyze_url(url):
    if not VIRUSTOTAL_API_KEY:
        return {"error": "API key is missing. Please set the VIRUSTOTAL_API_KEY environment variable."}

    headers = {"x-apikey": VIRUSTOTAL_API_KEY}
    encoded_url = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
    api_url = f'https://www.virustotal.com/api/v3/urls/{encoded_url}'

    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        data = response.json()

        last_analysis_stats = data['data']['attributes'].get('last_analysis_stats', {})
        malicious = last_analysis_stats.get('malicious', 0)
        suspicious = last_analysis_stats.get('suspicious', 0)
        harmless = last_analysis_stats.get('harmless', 0)
        undetected = last_analysis_stats.get('undetected', 0)

        total_scans = malicious + suspicious + harmless + undetected
        vt_score = ((malicious * 100) + (suspicious * 50)) / total_scans if total_scans else 0

        heuristic = heuristic_score(url)
        threat_score = (vt_score * 0.7) + (heuristic * 0.3)

        return {
            "threat_score": round(threat_score, 2),
            "is_safe": threat_score <= 20,
            "details": {
                "malicious": malicious,
                "suspicious": suspicious,
                "harmless": harmless,
                "undetected": undetected
            }
        }

    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return {"error": "Failed to connect to VirusTotal API."}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/url_detection', methods=['POST'])
def url_detection():
    url = request.form.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    analysis = analyze_url(url)
    return jsonify(analysis)

@app.route('/threat_analysis', methods=['POST'])
def threat_analysis():
    url = request.form.get('url')
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    analysis = analyze_url(url)
    return jsonify(analysis)

if __name__ == "__main__":
    app.run(debug=True)