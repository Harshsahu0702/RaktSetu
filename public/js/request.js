class RequestButton {
  constructor(button, donorId, bloodGroup) {
    this.button = button;
    this.donorId = donorId;
    this.bloodGroup = bloodGroup;
    this.init();
  }

  init() {
    this.button.addEventListener('click', () => this.handleClick());
  }

  async handleClick() {
    try {
      this.button.disabled = true;
      this.button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Sending...';
      
      // Get the selected state from the dropdown
      const stateSelect = document.getElementById('state');
      if (!stateSelect) {
        throw new Error('State dropdown not found');
      }
      const selectedState = stateSelect.value.trim();
      if (!selectedState) {
        throw new Error('Please select a state');
      }
      
      const response = await fetch('/api/request/donor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: document.body.dataset.userId,
          patientName: document.body.dataset.userName || 'Patient',
          state: selectedState,
          donorId: this.donorId,
          donorName: this.button.dataset.donorName || 'Donor',
          bloodGroup: this.bloodGroup,
          units: 1, // Default to 1 unit if not specified
          contactNumber: document.body.dataset.userPhone || '',
          notes: 'Request from patient portal'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.button.innerHTML = '<i class="bi bi-check-circle"></i> Requested';
        this.button.classList.remove('btn-primary');
        this.button.classList.add('btn-success');
        
        // Show success message
        this.showAlert('Request sent successfully!', 'success');
        
        // If we're on the patient page, refresh the requests list
        if (document.getElementById('patient-requests')) {
          const patientRequests = new RequestList(
            document.getElementById('patient-requests'), 
            'patient'
          );
          await patientRequests.loadRequests();
        }
      } else {
        throw new Error(data.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error:', error);
      this.button.innerHTML = 'Error';
      this.button.classList.add('btn-danger');
      this.showAlert('Failed to send request. Please try again.', 'danger');
      
      setTimeout(() => {
        this.button.innerHTML = 'Request';
        this.button.disabled = false;
        this.button.classList.remove('btn-danger');
        this.button.classList.add('btn-primary');
      }, 2000);
    }
  }
  
  showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert after the button's parent element
    this.button.parentNode.parentNode.insertBefore(alertDiv, this.button.parentNode.nextSibling);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alertDiv);
      bsAlert.close();
    }, 5000);
  }
}

class RequestList {
  constructor(container, type) {
    this.container = container;
    this.type = type; // 'patient' or 'donor'
    this.userId = document.body.dataset.userId;
    this.initialize();
  }

  async initialize() {
    await this.loadRequests();
    // Refresh requests every 30 seconds
    this.refreshInterval = setInterval(() => this.loadRequests(), 30000);
  }

  async loadRequests() {
    try {
      this.showLoading();
      const response = await fetch(`/api/requests/${this.type}/${this.userId}`);
      const requests = await response.json();
      this.render(requests);
      
      // Update notification badge if this is the donor's request list
      if (this.type === 'donor') {
        this.updateNotificationBadge(requests.length);
      }
    } catch (error) {
      console.error(`Error loading ${this.type} requests:`, error);
      this.showError('Failed to load requests. Please refresh the page.');
    }
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="text-center my-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading requests...</p>
      </div>
    `;
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${message}
      </div>
    `;
  }

  render(requests) {
    if (requests.length === 0) {
      this.container.innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle-fill me-2"></i>
          No ${this.type === 'patient' ? 'sent' : 'incoming'} requests found.
        </div>
      `;
      return;
    }

    this.container.innerHTML = requests.map(request => this.createRequestCard(request)).join('');
    
    // Add event listeners for status updates if this is the donor's request list
    if (this.type === 'donor') {
      document.querySelectorAll('.request-actions .btn').forEach(button => {
        button.addEventListener('click', (e) => this.handleStatusUpdate(e));
      });
    }
  }

  createRequestCard(request) {
    const date = new Date(request.date).toLocaleString();
    const statusBadge = this.getStatusBadge(request.status);
    
    if (this.type === 'patient') {
      return `
        <div class="card mb-3 request-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="card-title">Donor ID: ${request.donorId}</h5>
                <p class="card-text">Blood Group: ${request.bloodGroup}</p>
                <p class="card-text"><small class="text-muted">Requested on: ${date}</small></p>
              </div>
              <div class="request-actions">
                ${statusBadge}
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="card mb-3 request-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="card-title">${request.patientId?.fullName || 'Patient'}</h5>
                <p class="card-text">Blood Group: ${request.bloodGroup}</p>
                ${request.patientId?.contactInfo ? 
                  `<p class="card-text">Contact: ${request.patientId.contactInfo}</p>` : ''}
                <p class="card-text"><small class="text-muted">Requested on: ${date}</small></p>
              </div>
              <div class="request-actions">
                ${statusBadge}
                ${request.status === 'pending' ? `
                  <div class="btn-group">
                    <button class="btn btn-sm btn-success me-2" 
                            data-request-id="${request._id}" 
                            data-status="accepted">
                      <i class="bi bi-check-lg"></i> Accept
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            data-request-id="${request._id}" 
                            data-status="rejected">
                      <i class="bi bi-x-lg"></i> Reject
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  getStatusBadge(status) {
    const statusClasses = {
      pending: 'bg-warning',
      accepted: 'bg-success',
      rejected: 'bg-danger',
      completed: 'bg-info'
    };
    
    return `<span class="badge ${statusClasses[status] || 'bg-secondary'}">
      ${status.charAt(0).toUpperCase() + status.slice(1)}
    </span>`;
  }

  async handleStatusUpdate(event) {
    const button = event.currentTarget;
    const requestId = button.dataset.requestId;
    const status = button.dataset.status;
    const actionButtons = button.closest('.request-actions');
    
    try {
      button.disabled = true;
      const originalText = button.innerHTML;
      button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
      
      const response = await fetch(`/api/request/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Show success message
      this.showAlert(
        `Request ${status === 'accepted' ? 'accepted' : 'rejected'} successfully!`,
        status === 'accepted' ? 'success' : 'info'
      );

      // Reload requests after update
      await this.loadRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      button.disabled = false;
      button.innerHTML = originalText;
      
      this.showAlert(
        'Failed to update request. Please try again.',
        'danger'
      );
    }
  }
  
  updateNotificationBadge(count) {
    const badge = document.getElementById('request-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    }
  }
  
  showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert at the top of the container
    this.container.prepend(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alertDiv);
      bsAlert.close();
    }, 5000);
  }
}

// Initialize request system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize request buttons
  document.querySelectorAll('.request-btn').forEach(button => {
    const donorId = button.dataset.donorId;
    const bloodGroup = button.dataset.bloodGroup;
    if (donorId && bloodGroup) {
      new RequestButton(button, donorId, bloodGroup);
    }
  });

  // Initialize request lists if on patient or donor dashboard
  const patientRequests = document.getElementById('patient-requests');
  const donorRequests = document.getElementById('donor-requests');
  
  if (patientRequests) {
    new RequestList(patientRequests, 'patient');
  }
  
  if (donorRequests) {
    new RequestList(donorRequests, 'donor');
  }
});
