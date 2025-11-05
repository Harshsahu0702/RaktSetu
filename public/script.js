let map;
let geocoder;

function initMap() {
    // Default location (e.g., center of India)
    const defaultLocation = { lat: 20.5937, lng: 78.9629 };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: defaultLocation,
    });
    geocoder = new google.maps.Geocoder();
}

document.addEventListener('DOMContentLoaded', () => {
    // Patient Dashboard: Search for Hospitals
    const searchHospitalsBtn = document.getElementById('searchHospitalsBtn');
    if (searchHospitalsBtn) {
        searchHospitalsBtn.addEventListener('click', () => {
            const bloodType = document.getElementById('blood-type').value;
            const searchStatus = document.getElementById('search-status');
            const hospitalsList = document.getElementById('hospitals-list');
            const mapDiv = document.getElementById('map');

            if (!bloodType) {
                alert('Please select a blood type.');
                return;
            }

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;

                    searchStatus.innerHTML = `<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-red-500"></i><p class="mt-2">Searching for nearby hospitals...</p></div>`;
                    hospitalsList.innerHTML = '';
                    mapDiv.style.display = 'block';

                    try {
                        const response = await fetch('/api/hospitals/search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ latitude, longitude, bloodGroup: bloodType })
                        });

                        if (!response.ok) throw new Error('Network response was not ok.');

                        const hospitals = await response.json();
                        
                        // Center map on user's location
                        const userLocation = { lat: latitude, lng: longitude };
                        map.setCenter(userLocation);
                        map.setZoom(12);
                        new google.maps.Marker({
                            position: userLocation,
                            map: map,
                            title: 'Your Location',
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                fillColor: '#4285F4',
                                fillOpacity: 1,
                                strokeColor: 'white',
                                strokeWeight: 2
                            }
                        });

                        if (hospitals.length === 0) {
                            searchStatus.innerHTML = `<div class="text-center py-8"><i class="fas fa-exclamation-circle text-4xl text-gray-400"></i><h4 class="text-lg font-medium text-gray-600 mt-2">No Nearby Hospitals Found</h4><p class="text-sm text-gray-500">No hospitals within 5km have ${bloodType} blood available.</p></div>`;
                            searchStatus.style.display = 'block';
                        } else {
                            searchStatus.style.display = 'none';
                            hospitals.forEach(hospital => {
                                const hospitalCard = `
                                    <div class="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                                        <h4 class="font-bold text-lg">${hospital.hospitalName}</h4>
                                        <p class="text-sm text-gray-600">${hospital.address}, ${hospital.city}</p>
                                        <p class="text-sm text-gray-500">Contact: ${hospital.contactInfo}</p>
                                        <div class="mt-2 pt-2 border-t">
                                            <p class="text-sm font-medium text-green-600">Available Units (${bloodType}): ${hospital.bloodStock[bloodType]}</p>
                                        </div>
                                    </div>
                                `;
                                hospitalsList.innerHTML += hospitalCard;

                                // Add marker for each hospital
                                new google.maps.Marker({
                                    map: map,
                                    position: { lat: hospital.location.coordinates[1], lng: hospital.location.coordinates[0] },
                                    title: hospital.hospitalName
                                });
                            });
                        }
                    } catch (error) {
                        console.error('Failed to search for hospitals:', error);
                        searchStatus.innerHTML = `<div class="text-center py-8"><i class="fas fa-times-circle text-4xl text-red-400"></i><h4 class="text-lg font-medium text-gray-600 mt-2">Search Failed</h4><p class="text-sm text-gray-500">Could not perform the search. Please try again later.</p></div>`;
                        searchStatus.style.display = 'block';
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
