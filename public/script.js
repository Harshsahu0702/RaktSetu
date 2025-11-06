document.addEventListener('DOMContentLoaded', () => {
    // Patient Dashboard: Search for Hospitals
    const searchHospitalsBtn = document.getElementById('searchHospitalsBtn');
    if (searchHospitalsBtn) {
        searchHospitalsBtn.addEventListener('click', async () => {
            const bloodType = document.getElementById('blood-type').value;
            const searchStatus = document.getElementById('search-status');
            const hospitalsList = document.getElementById('hospitals-list');
            const loadingSpinner = document.getElementById('loading-spinner');

            if (!bloodType) {
                alert('Please select a blood type.');
                return;
            }

            // Disable search button and show loading spinner
            searchHospitalsBtn.disabled = true;
            searchHospitalsBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Searching...';
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');
            searchStatus.style.display = 'none';
            hospitalsList.innerHTML = '';

            try {
                if (navigator.geolocation) {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });

                    const { latitude, longitude } = position.coords;
                    const response = await fetch('/api/hospitals/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude, longitude, bloodGroup: bloodType })
                    });

                    if (!response.ok) throw new Error('Network response was not ok.');

                    const hospitals = await response.json();
                    
                    // Hide loading spinner
                    if (loadingSpinner) loadingSpinner.classList.add('hidden');
                    
                    if (hospitals.length === 0) {
                        searchStatus.innerHTML = `
                            <div class="text-center py-8">
                                <div class="text-4xl mb-2">❌</div>
                                <h4 class="text-lg font-medium text-gray-600">No hospitals found for the selected area.</h4>
                            </div>`;
                        searchStatus.style.display = 'block';
                    } else {
                        searchStatus.style.display = 'none';
                        hospitals.forEach(hospital => {
                                const hospitalCard = document.createElement('div');
                                hospitalCard.className = 'bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between';
                                hospitalCard.innerHTML = `
                                    <div>
                                        <h4 class="font-bold text-lg">${hospital.hospitalName || 'Unnamed Hospital'}</h4>
                                        <p class="text-sm text-gray-600">${hospital.address || 'Address not available'}, ${hospital.city || ''}</p>
                                        ${hospital.contactInfo ? `<p class="text-sm text-gray-500">Contact: ${hospital.contactInfo}</p>` : ''}
                                        <div class="mt-2 pt-2 border-t">
                                            <p class="text-sm font-medium text-green-600">Available Units (${bloodType}): ${hospital.bloodStock?.[bloodType] || 0}</p>
                                        </div>
                                    </div>
                                    <button class="mt-4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600" onclick="openRequestModal('${hospital._id}', '${bloodType}')">
                                        Request Blood
                                    </button>
                                `;
                                hospitalsList.appendChild(hospitalCard);

                            });
                        }
                    } catch (error) {
                        console.error('Search error:', error);
                        if (loadingSpinner) loadingSpinner.classList.add('hidden');
                        searchStatus.innerHTML = `
                            <div class="text-center py-8">
                                <div class="text-4xl mb-2">⚠️</div>
                                <h4 class="text-lg font-medium text-gray-600">Error fetching hospitals</h4>
                                <p class="text-sm text-gray-500">Please try again later.</p>
                            </div>`;
                        searchStatus.style.display = 'block';
                    } finally {
                        // Re-enable search button and reset its text
                        searchHospitalsBtn.disabled = false;
                        searchHospitalsBtn.innerHTML = '<i class="fas fa-search mr-2"></i> Search Hospitals';
                    }
                }, () => {
                    alert('Unable to retrieve your location. Please enable location services.');
                });
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    }

    const useLocationBtn = document.getElementById('useLocationBtn');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', () => {
            // This reuses the same logic as the main search button
            searchHospitalsBtn.click();
        });
    }
    
    // A simple (and incomplete) mapping for districts. A real app would use a library or API.
    const districtsByState = {
        "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
        "Delhi": ["New Delhi", "North Delhi"],
        // Add all other states and districts
    };

    const stateSelect = document.getElementById('state');
    const districtSelect = document.getElementById('district');

    if (stateSelect && districtSelect) {
        stateSelect.addEventListener('change', () => {
            const selectedState = stateSelect.value;
            const districts = districtsByState[selectedState] || [];
            
            // Clear previous options
            districtSelect.innerHTML = '<option value="">Select District</option>';
            
            districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.textContent = district;
                districtSelect.appendChild(option);
            });
        });
    }

    // SOS Button
    const sosBtn = document.getElementById('sosBtn');
    if (sosBtn) {
        sosBtn.addEventListener('click', async () => {
            // In a real app, you'd get the patient's ID from a session or token
            const patientId = "654a1b9a8b3a4c1d8e9a0b1a"; // Replace with a real patient ID from your DB for testing
            const bloodGroup = prompt("Please enter your blood group (e.g., A+):");
            const city = prompt("Please enter your city:");

            if (!bloodGroup || !city) {
                alert("Blood group and city are required for an SOS request.");
                return;
            }

            try {
                const response = await fetch('/api/requests/sos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientId, bloodGroup, city })
                });

                const result = await response.json();

                if (response.ok) {
                    alert('SOS request sent successfully! Nearby donors and hospitals will be notified.');
                } else {
                    throw new Error(result.message || 'Failed to send SOS request.');
                }
            } catch (error) {
                console.error('SOS request failed:', error);
                alert('Could not send SOS request. Please try again later.');
            }
        });
    }
});

// Modal handling
let currentHospitalId = null;
let currentBloodGroup = null;

function openRequestModal(hospitalId, bloodGroup) {
    currentHospitalId = hospitalId;
    currentBloodGroup = bloodGroup;
    document.getElementById('requestModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('requestModal').classList.add('hidden');
}

document.getElementById('closeModalBtn').addEventListener('click', closeModal);

document.getElementById('submitRequestBtn').addEventListener('click', async () => {
    const units = document.getElementById('bloodUnits').value;
    if (!units || units < 1) {
        alert('Please enter a valid number of units.');
        return;
    }

    // This should be dynamically set from the logged-in user
    const patientId = document.body.dataset.patientId; 

    try {
        const response = await fetch('/api/request/hospital', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patientId,
                hospitalId: currentHospitalId,
                bloodGroup: currentBloodGroup,
                units: parseInt(units, 10)
            })
        });

        if (response.ok) {
            alert('Blood request sent successfully!');
            closeModal();
            // Optionally, refresh the requests list
            if (typeof fetchPatientRequests === 'function') {
                fetchPatientRequests();
            }
        } else {
            const errorData = await response.json();
            alert(`Failed to send request: ${errorData.message || 'Server error'}`);
        }
    } catch (error) {
        console.error('Failed to send blood request:', error);
        alert('An error occurred while sending the request.');
    }
});
