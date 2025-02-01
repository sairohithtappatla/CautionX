document.addEventListener('DOMContentLoaded', () => {
  const urlForm = document.getElementById('url-form');
  const threatForm = document.getElementById('threat-form');
  const urlResult = document.getElementById('url-result');
  const threatReport = document.getElementById('threat-report');
  const progressContainer = document.getElementById('progress-container-threat');
  const progressCircle = document.getElementById('progress-circle-threat');
  const progressText = document.getElementById('progress-text-threat');
  const threatScoreValue = document.getElementById('threat-score-value');

  // Sidebar navigation
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

  // Close button for modals
  document.querySelectorAll('.close').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => {
          const modal = closeBtn.closest('.modal');
          modal.style.display = 'none';
      });
  });

  // URL Detection Event
  urlForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const url = document.getElementById('url-input').value;

      fetch('/url_detection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ 'url': url })
      }).then(response => response.json()).then(data => {
          if (data.error) {
              urlResult.innerHTML = `<p class="error"><i class="fas fa-exclamation-circle"></i> ${data.error}</p>`;
          } else {
              urlResult.innerHTML = `
                  <p class="${data.is_safe ? 'safe' : 'unsafe'}">
                      <i class="fas ${data.is_safe ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                      ${data.is_safe ? 'This URL is likely safe.' : 'This URL may not be safe.'}
                      Threat score: ${data.threat_score}
                  </p>
              `;
          }
      }).catch(error => {
          console.error("Error:", error);
          urlResult.innerHTML = '<p class="error"><i class="fas fa-exclamation-circle"></i> An error occurred while checking the URL.</p>';
      });
  });

  // Threat Analysis Event
  threatForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const url = document.getElementById('threat-url-input').value;
      threatReport.innerHTML = '<p>Analyzing... Please wait.</p>';
      progressContainer.style.display = 'flex';

      fetch('/threat_analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ 'url': url })
      }).then(response => response.json()).then(data => {
          if (data.error) {
              threatReport.innerHTML = `<p class="error"><i class="fas fa-exclamation-circle"></i> ${data.error}</p>`;
              progressContainer.style.display = 'none';
          } else {
              let progress = 0;
              const interval = setInterval(() => {
                  if (progress >= data.threat_score) {
                      clearInterval(interval);
                  } else {
                      progress++;
                      progressCircle.style.background = `conic-gradient(
                          ${progress <= 20 ? '#28a745' : '#dc3545'} ${progress * 3.6}deg,
                          #2c2c2c 0deg
                      )`;
                      progressText.textContent = `${progress}%`;
                  }
              }, 20);

              threatScoreValue.textContent = data.threat_score;
              threatReport.innerHTML = `
                  <p><strong>Malicious:</strong> ${data.details.malicious}</p>
                  <p><strong>Suspicious:</strong> ${data.details.suspicious}</p>
                  <p><strong>Harmless:</strong> ${data.details.harmless}</p>
                  <p><strong>Undetected:</strong> ${data.details.undetected}</p>
              `;
          }
      }).catch(error => {
          console.error("Error:", error);
          threatReport.innerHTML = '<p class="error"><i class="fas fa-exclamation-circle"></i> An error occurred during threat analysis.</p>';
          progressContainer.style.display = 'none';
      });
  });

  // Retry Button for URL Detection
  document.getElementById('retry-url-btn').addEventListener('click', () => {
      urlResult.innerHTML = '';
      document.getElementById('url-input').value = '';
  });

  // Retry Button for Threat Analysis
  document.getElementById('retry-threat-btn').addEventListener('click', () => {
      threatReport.innerHTML = 'No report available.';
      document.getElementById('threat-url-input').value = '';
      progressContainer.style.display = 'none';
  });
});
