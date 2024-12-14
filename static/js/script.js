// Sidebar navigation for sections
document.querySelectorAll('.sidebar ul li').forEach(item => {
  item.addEventListener('click', () => {
      document.querySelectorAll('.section').forEach(section => {
          section.classList.remove('active');
      });
      document.getElementById(item.id.replace('-btn', '')).classList.add('active');
  });
});

// Show popups for Logs and Settings
document.getElementById('logs-btn').addEventListener('click', () => {
  document.getElementById('popup-logs').style.display = 'flex';
});
document.getElementById('settings-btn').addEventListener('click', () => {
  document.getElementById('popup-settings').style.display = 'flex';
});

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Animated circular progress bar
function updateProgress(score, circleId, textId) {
  const circle = document.getElementById(circleId);
  const text = document.getElementById(textId);
  let progress = 0;
  const interval = setInterval(() => {
    if (progress >= score) {
      clearInterval(interval);
    } else {
      progress++;
      circle.style.background = `conic-gradient(green ${progress * 3.6}deg, red 0deg)`;
      text.textContent = `${progress}% Safe`;
    }
  }, 10); // Animation speed
}

// Display analysis report
function displayReport(reportElement, reportData) {
  reportElement.innerHTML = `
    <h4>Analysis Report</h4>
    <p><strong>Categories:</strong> ${reportData.categories || 'None'}</p>
    <p><strong>First Submission:</strong> ${reportData.first_submission || 'Not Available'}</p>
    <p><strong>Last Analysis:</strong> ${reportData.last_analysis || 'Not Available'}</p>
    <p><strong>Final URL:</strong> ${reportData.final_url || 'No URL Available'}</p>
    <p><strong>HTTP Status:</strong> ${reportData.status_code || 'Unavailable'}</p>
    <p><strong>Content Type:</strong> ${reportData.content_type || 'Unknown'}</p>
    <p><strong>IP Address:</strong> ${reportData.serving_ip || 'Unavailable'}</p>
    <p><strong>Body Length:</strong> ${reportData.body_length || 'Unknown'} MB</p>
  `;
}

// URL Detection Event
document.getElementById('url-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const url = document.getElementById('url-input').value;

  fetch('/url_detection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'url': url })
  }).then(response => response.json()).then(data => {
      const resultElement = document.getElementById('url-result');
      resultElement.innerHTML = data.is_safe ? '✅ This url is  Safe' : '❌ This url is not safe Threat detected';
      setTimeout(() => {
          resultElement.innerHTML = ''; // Clear message after 3 seconds
      }, 3000);
  }).catch(error => {
      console.error("Error:", error);
  });
});

// Threat Analysis Event
document.getElementById('threat-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const url = document.getElementById('threat-url-input').value;
  document.getElementById('progress-container-threat').style.display = 'flex';
  updateProgress(0, 'progress-circle-threat', 'progress-text-threat');

  fetch('/threat_analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'url': url })
  }).then(response => response.json()).then(data => {
      const score = data.threat_score || 0;
      updateProgress(score, 'progress-circle-threat', 'progress-text-threat');
      document.getElementById('threat-score-value').textContent = score;
      displayReport(document.getElementById('threat-report'), data);
  }).catch(error => {
      console.error("Error:", error);
  });
});

// Retry Button for URL Detection
document.getElementById('retry-url-btn').addEventListener('click', () => {
  document.getElementById('url-result').innerHTML = '';
  document.getElementById('url-input').value = '';
});

// Retry Button for Threat Analysis
document.getElementById('retry-threat-btn').addEventListener('click', () => {
  document.getElementById('threat-report').innerHTML = 'No report available.';
  document.getElementById('threat-url-input').value = '';
  document.getElementById('progress-container-threat').style.display = 'none';
});
