// ═══════════════════════════════════════════════════════════════
// MORTGAGEFLOW API CLIENT
// Add this to your HTML file (before the main script)
// ═══════════════════════════════════════════════════════════════

const API_CONFIG = {
  baseURL: 'http://localhost:5000/api', // Change to your backend URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

class MortgageFlowAPI {
  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.headers = config.headers;
    this.token = localStorage.getItem('mf-token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('mf-token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('mf-token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.headers, ...options.headers };

    if (this.token && !endpoint.includes('/submit') && !endpoint.includes('/track')) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      method: options.method || 'GET',
      headers,
      timeout: this.timeout,
      ...options,
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, ...data };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ──────── AUTH ────────
  async loginOfficer(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  async logout() {
    this.clearToken();
    return this.request('/auth/logout', { method: 'POST' });
  }

  // ──────── APPLICATIONS ────────
  async submitApplication(data) {
    return this.request('/applications/submit', {
      method: 'POST',
      body: data
    });
  }

  async trackApplication(id) {
    return this.request(`/applications/track/${id}`);
  }

  async getApplications(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/applications?${params}`);
  }

  async getApplication(id) {
    return this.request(`/applications/${id}`);
  }

  async updateApplicationStage(id, stage, message) {
    return this.request(`/applications/${id}/stage`, {
      method: 'PUT',
      body: { stage, message }
    });
  }

  async saveCreditAssessment(id, creditScore, creditOutcome, creditNotes) {
    return this.request(`/applications/${id}/credit-assessment`, {
      method: 'POST',
      body: { creditScore, creditOutcome, creditNotes }
    });
  }

  async managerDecision(id, decision, reason) {
    return this.request(`/applications/${id}/manager-decision`, {
      method: 'POST',
      body: { decision, reason }
    });
  }

  async sendCounterOffer(id, amount, term, note) {
    return this.request(`/applications/${id}/counter-offer`, {
      method: 'POST',
      body: { amount, term, note }
    });
  }

  async updateCounterOfferStatus(id, status) {
    return this.request(`/applications/${id}/counter-offer/status`, {
      method: 'PUT',
      body: { status }
    });
  }

  async getAnalytics() {
    return this.request('/applications/analytics');
  }

  // ──────── DOCUMENTS ────────
  async uploadDocument(applicationId, documentType, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId);
    formData.append('documentType', documentType);

    return this.request('/documents/upload', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type with boundary
      body: formData
    });
  }

  async getApplicationDocuments(applicationId) {
    return this.request(`/documents/application/${applicationId}`);
  }

  async deleteDocument(id) {
    return this.request(`/documents/${id}`, {
      method: 'DELETE'
    });
  }

  getDocumentDownloadUrl(filePath) {
    return `${this.baseURL}/documents/url/${filePath}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZE API CLIENT
// ═══════════════════════════════════════════════════════════════

const api = new MortgageFlowAPI();

// ═══════════════════════════════════════════════════════════════
// KEY INTEGRATION FUNCTIONS
// Replace existing functions with these API-backed versions
// ═══════════════════════════════════════════════════════════════

// Modified submitApplication - now uses API
async function submitApplicationViaAPI() {
  try {
    const appData = {
      fname: document.getElementById('f-fname').value,
      lname: document.getElementById('f-lname').value,
      phone: document.getElementById('f-phone').value,
      email: document.getElementById('f-email').value,
      nationalId: document.getElementById('f-nid').value,
      dob: document.getElementById('f-dob').value,
      address: document.getElementById('f-address').value,
      maritalStatus: document.getElementById('f-marital').value,
      dependants: document.getElementById('f-deps').value,
      empStatus: document.getElementById('f-empstatus').value,
      employer: document.getElementById('f-employer').value,
      income: document.getElementById('f-income').value,
      expenses: document.getElementById('f-expenses').value,
      loans: document.getElementById('f-loans').value,
      yearsEmployed: document.getElementById('f-yrs').value,
      propAddr: document.getElementById('f-propaddr').value,
      propType: document.getElementById('f-proptype').value,
      price: document.getElementById('f-price').value,
      deposit: document.getElementById('f-deposit').value,
      term: document.getElementById('f-term').value,
      willingSeller: document.getElementById('f-seller').value,
      docs: {
        id: true,
        payslips: true,
        bankStatements: true,
        empLetter: true,
        proofRes: false
      }
    };

    const response = await api.submitApplication(appData);

    if (response.success) {
      document.getElementById('generated-app-id').textContent = response.applicationId;
      for (let i = 1; i <= 5; i++) {
        document.getElementById('form-step-' + i).style.display = 'none';
      }
      document.getElementById('form-success').style.display = 'block';
      showToast('Application ' + response.applicationId + ' submitted!');

      // Store in localStorage as well for offline capability
      let apps = JSON.parse(localStorage.getItem('mf-apps') || '[]');
      apps.push(response.application);
      localStorage.setItem('mf-apps', JSON.stringify(apps));
    }
  } catch (error) {
    showToast('Error submitting application: ' + error.message, true);
  }
}

// Modified trackApplication - now uses API
async function trackApplicationViaAPI() {
  try {
    const id = document.getElementById('track-input').value.trim().toUpperCase();

    const response = await api.trackApplication(id);

    if (response.application) {
      const app = response.application;
      document.getElementById('tr-name').textContent = app.applicant_name;
      document.getElementById('tr-amount').textContent = '$' + app.loan_amount.toLocaleString() + ' — ' + app.property_address;
      document.getElementById('tr-status-pill').textContent = STAGE_LABELS[app.stage];
      document.getElementById('tr-status-pill').className = 'pill ' + STAGE_PILLS[app.stage];

      const stagesEl = document.getElementById('progress-steps');
      const currentIdx = STAGES.indexOf(app.stage);
      let html = '<div class="progress-line"></div><div class="progress-line-fill" style="height:' + Math.min(90, currentIdx * 20) + '%"></div>';

      STAGES.forEach((s, i) => {
        const cls = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending';
        const icon = cls === 'done' ? '✓' : (i + 1).toString();
        const hist = app.history && app.history.find(h => h.stage === s);
        const dateStr = hist ? new Date(hist.created_at).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'}) : '';

        html += `<div class="progress-step">
          <div class="step-dot ${cls}">${icon}</div>
          <div class="step-info">
            <div class="step-name ${cls === 'pending' ? 'pending' : ''}">${STAGE_LABELS[s]}</div>
            ${dateStr ? `<div class="step-date">${dateStr}</div>` : ''}
            ${cls === 'active' ? `<div class="step-msg">${STAGE_MSGS[s]}</div>` : ''}
          </div>
        </div>`;
      });

      stagesEl.innerHTML = html;
      document.getElementById('track-result').style.display = 'block';
      document.getElementById('track-not-found').style.display = 'none';
    }
  } catch (error) {
    document.getElementById('track-result').style.display = 'none';
    document.getElementById('track-not-found').style.display = 'block';
  }
}

// Modified doLogin - now uses API
async function doLoginViaAPI() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pwd = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  try {
    const response = await api.loginOfficer(email, pwd);

    if (response.success) {
      currentOfficer = response.user;
      isOfficer = true;
      closeLoginModal();

      document.getElementById('officer-login-btn').style.display = 'none';
      const sessionEl = document.getElementById('officer-session');
      sessionEl.style.display = 'flex';
      document.getElementById('officer-avatar').textContent = response.user.initials;
      document.getElementById('officer-name-display').textContent = response.user.name;
      document.getElementById('officer-role-display').textContent = response.user.role;

      document.querySelectorAll('.officer-only').forEach(el => el.style.display = '');
      document.querySelectorAll('.manager-only').forEach(el => {
        el.style.display = response.user.role === 'Loan Officer' ? 'none' : '';
      });
      document.querySelector('.nav').style.borderBottom = '2px solid var(--crimson)';
      showView('dashboard');
      showToast('Welcome back, ' + response.user.name);

      // Refresh dashboard
      renderDashboardViaAPI();
    }
  } catch (error) {
    errEl.textContent = 'Incorrect email or password. Please try again.';
    errEl.style.display = 'block';
    document.getElementById('login-password').value = '';
  }
}

// Modified renderDashboard - now uses API
async function renderDashboardViaAPI() {
  try {
    const response = await api.getApplications();

    if (response.applications) {
      applications = response.applications;
      renderDashboard(applications);
    }
  } catch (error) {
    showToast('Error loading dashboard: ' + error.message, true);
  }
}

// Upload document via API
async function uploadDocumentViaAPI(applicationId, documentType, file) {
  try {
    const response = await api.uploadDocument(applicationId, documentType, file);

    if (response.success) {
      showToast('Document uploaded successfully');
      return response.document;
    }
  } catch (error) {
    showToast('Error uploading document: ' + error.message, true);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// USAGE IN EXISTING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Update the submitApplication function to use the API version:
// Replace: submitApplication() { ... }
// With:    submitApplicationViaAPI()

// Update trackApplication function:
// Replace existing trackApplication() with trackApplicationViaAPI()

// Update login function:
// Replace doLogin() with doLoginViaAPI()
