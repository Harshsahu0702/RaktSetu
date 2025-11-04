// Mock hospital data
const hospitals = [
    {
        id: 1,
        name: "AIIMS Delhi",
        state: "Delhi",
        district: "New Delhi",
        address: "Ansari Nagar, New Delhi - 110029",
        contact: "011-26588500",
        distance: "2.5 km",
        lastUpdated: "10 minutes ago",
        blood: { 
            "A+": 15, "A-": 8, "B+": 12, "B-": 5, 
            "AB+": 7, "AB-": 3, "O+": 20, "O-": 10 
        }
    },
    {
        id: 2,
        name: "KEM Hospital",
        state: "Maharashtra",
        district: "Mumbai",
        address: "Acharya Donde Marg, Parel, Mumbai - 400012",
        contact: "022-24107000",
        distance: "1.2 km",
        lastUpdated: "15 minutes ago",
        blood: { 
            "A+": 10, "A-": 5, "B+": 8, "B-": 3, 
            "AB+": 4, "AB-": 2, "O+": 15, "O-": 7 
        }
    },
    {
        id: 3,
        name: "Apollo Hospital",
        state: "Tamil Nadu",
        district: "Chennai",
        address: "21, Greams Lane, Off Greams Road, Chennai - 600006",
        contact: "1860-500-1066",
        distance: "3.7 km",
        lastUpdated: "25 minutes ago",
        blood: { 
            "A+": 8, "A-": 4, "B+": 10, "B-": 6, 
            "AB+": 5, "AB-": 2, "O+": 12, "O-": 5 
        }
    },
    {
        id: 4,
        name: "PGI Chandigarh",
        state: "Punjab",
        district: "Chandigarh",
        address: "Sector 12, Chandigarh - 160012",
        contact: "0172-2746018",
        distance: "5.1 km",
        lastUpdated: "1 hour ago",
        blood: { 
            "A+": 12, "A-": 6, "B+": 9, "B-": 4, 
            "AB+": 3, "AB-": 1, "O+": 18, "O-": 8 
        }
    },
    {
        id: 5,
        name: "NIMHANS",
        state: "Karnataka",
        district: "Bangalore",
        address: "Hosur Road, Bengaluru - 560029",
        contact: "080-26995000",
        distance: "4.2 km",
        lastUpdated: "45 minutes ago",
        blood: { 
            "A+": 7, "A-": 3, "B+": 11, "B-": 5, 
            "AB+": 6, "AB-": 2, "O+": 14, "O-": 6 
        }
    }
];

// Districts data for states
const districtsByState = {
    "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
    "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
    "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
    "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
    "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
    "Delhi": ["New Delhi", "Central Delhi", "East Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
    "Goa": ["North Goa", "South Goa"],
    "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
    "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
    "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
    "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
    "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
    "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
    "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
    "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
    "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
    "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
    "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
    "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
    "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
    "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Tarn Taran"],
    "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
    "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
    "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
    "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
    "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
    "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
    "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
    "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"]
};

// Function to update districts based on selected state
function updateDistricts() {
    const stateSelect = document.getElementById('state');
    const districtSelect = document.getElementById('district');
    
    if (!stateSelect || !districtSelect) return;
    
    const selectedState = stateSelect.value;
    
    // Clear existing options
    districtSelect.innerHTML = '<option value="">Select District</option>';
    
    if (!selectedState) return;
    
    // Get districts for the selected state
    const districts = districtsByState[selectedState] || [];
    
    // Add district options
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Add event listener for state change
    const stateSelect = document.getElementById('state');
    if (stateSelect) {
        console.log('State select found');
        stateSelect.addEventListener('change', updateDistricts);
        // Initialize districts if a state is already selected
        if (stateSelect.value) {
            updateDistricts();
        }
    } else {
        console.error('State select not found!');
    }
    
    // Initialize hospital search
    const searchBtn = document.getElementById('searchHospitalsBtn');
    if (searchBtn) {
        console.log('Search button found');
        searchBtn.addEventListener('click', searchHospitals);
    } else {
        console.error('Search button not found!');
    }

    // Handle contact button clicks
    document.addEventListener('click', function(e) {
        if (e.target.closest('.contact-hospital-btn')) {
            const button = e.target.closest('.contact-hospital-btn');
            const phoneNumber = button.dataset.phone;
            if (phoneNumber) {
                window.location.href = `tel:${phoneNumber}`;
            } else {
                console.error('No phone number found for contact button');
            }
        }
    });
});

function updateDistricts() {
    console.log('updateDistricts called');
    const stateSelect = this;
    const state = stateSelect.value || (stateSelect.options[stateSelect.selectedIndex] && stateSelect.options[stateSelect.selectedIndex].value);
    const districtSelect = document.getElementById('district');
    
    if (!districtSelect) {
        console.error('District select element not found!');
        return;
    }
    
    console.log('State selected:', state);
    
    // Clear existing options except the first one
    districtSelect.innerHTML = '<option value="">Select District</option>';
    
    if (!state) {
        console.log('No state selected, clearing districts');
        return;
    }

    const districts = districtsByState[state];
    console.log('Districts for', state, ':', districts);
    
    if (!districts || districts.length === 0) {
        console.warn('No districts found for state:', state);
        return;
    }
    
    // Add district options
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
    });
    
    console.log('Updated districts dropdown with', districts.length, 'options');
}

async function searchHospitals(event) {
    if (event) event.preventDefault();
    
    const state = document.getElementById('state').value;
    const district = document.getElementById('district').value;
    const bloodType = document.getElementById('blood-type').value;
    
    // Show loading state
    const searchBtn = document.getElementById('searchHospitalsBtn');
    const searchStatus = document.getElementById('search-status');
    const hospitalsList = document.getElementById('hospitals-list');
    
    if (!searchBtn || !searchStatus || !hospitalsList) return;
    
    const originalBtnText = searchBtn.innerHTML;
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Searching...';
    
    // Show loading in status
    searchStatus.innerHTML = `
        <div class="animate-pulse">
            <div class="text-red-500 mb-3">
                <i class="fas fa-spinner fa-spin text-4xl"></i>
            </div>
            <h4 class="text-lg font-medium text-gray-600">Searching for blood availability...</h4>
            <p class="text-sm text-gray-500">Please wait while we check nearby hospitals</p>
        </div>
    `;
    
    // Clear previous results
    hospitalsList.innerHTML = '';
    
    // Scroll to results
    searchStatus.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
        // Filter hospitals based on search criteria
        let filteredHospitals = [...hospitals];
        
        if (state) {
            filteredHospitals = filteredHospitals.filter(h => h.state === state);
        }
        
        if (district) {
            filteredHospitals = filteredHospitals.filter(h => h.district === district);
        }
        
        // Further filter by blood type if selected
        if (bloodType) {
            filteredHospitals = filteredHospitals.filter(h => h.blood[bloodType] > 0);
        }
        
        if (filteredHospitals.length === 0) {
            // No results found
            searchStatus.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-3">
                        <i class="fas fa-hospital text-4xl"></i>
                    </div>
                    <h4 class="text-lg font-medium text-gray-600">No hospitals found</h4>
                    <p class="text-sm text-gray-500 mb-4">We couldn't find any hospitals matching your criteria.</p>
                    <button onclick="document.getElementById('searchHospitalsBtn').click()" class="text-red-600 hover:text-red-700 text-sm font-medium">
                        <i class="fas fa-redo mr-1"></i> Try different search
                    </button>
                </div>
            `;
        } else {
            // Hide the status and show results
            searchStatus.style.display = 'none';
            
            // Show results count
            const resultsCount = document.createElement('div');
            resultsCount.className = 'col-span-full text-sm text-gray-600 mb-2';
            resultsCount.innerHTML = `Showing ${filteredHospitals.length} ${filteredHospitals.length === 1 ? 'hospital' : 'hospitals'} with available blood units`;
            hospitalsList.appendChild(resultsCount);
            
            // Render each hospital card
            filteredHospitals.forEach(hospital => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200';
                
                // Get available blood types (only show those with units > 0)
                const availableBloodTypes = Object.entries(hospital.blood)
                    .filter(([_, units]) => units > 0)
                    .sort((a, b) => b[1] - a[1]); // Sort by units (descending)
                
                // Get the blood type with most units (for the header)
                const mainBloodType = availableBloodTypes[0] ? availableBloodTypes[0][0] : '';
                
                card.innerHTML = `
                    <div class="p-5">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-bold text-gray-900 mb-1">${hospital.name}</h3>
                                <p class="text-sm text-gray-500 mb-3">
                                    <i class="fas fa-map-marker-alt text-red-500 mr-2"></i>
                                    ${hospital.district}, ${hospital.state}
                                </p>
                            </div>
                            <span class="px-3 py-1 rounded-full text-xs font-medium ${getBloodGroupColor(mainBloodType)} bg-opacity-10">
                                <i class="fas fa-tint mr-1"></i> ${mainBloodType}
                            </span>
                        </div>
                        
                        <div class="mt-4">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">Available Blood Units</h4>
                            <div class="grid grid-cols-2 gap-2 mb-4">
                                ${availableBloodTypes.map(([type, units]) => `
                                    <div class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                        <span class="text-sm font-medium ${getBloodGroupColor(type)}">${type}</span>
                                        <span class="text-sm font-semibold">${units} ${units === 1 ? 'unit' : 'units'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <div class="text-xs text-gray-500">
                                <i class="far fa-clock mr-1"></i> Updated ${hospital.lastUpdated}
                            </div>
                            <div class="flex space-x-2">
                                <a href="https://maps.google.com/?q=${encodeURIComponent(hospital.address)}" 
                                   target="_blank" 
                                   class="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    <i class="fas fa-directions mr-1"></i> Map
                                </a>
                                <button class="contact-hospital-btn px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                        data-phone="${hospital.contact}">
                                    <i class="fas fa-phone-alt mr-1"></i> Call
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                hospitalsList.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Search error:', error);
        searchStatus.innerHTML = `
            <div class="text-center py-8">
                <div class="text-red-500 mb-3">
                    <i class="fas fa-exclamation-circle text-4xl"></i>
                </div>
                <h4 class="text-lg font-medium text-gray-600">Error loading results</h4>
                <p class="text-sm text-gray-500 mb-4">There was a problem searching for hospitals. Please try again.</p>
                <button onclick="document.getElementById('searchHospitalsBtn').click()" class="text-red-600 hover:text-red-700 text-sm font-medium">
                    <i class="fas fa-redo mr-1"></i> Try again
                </button>
            </div>
        `;
    } finally {
        // Reset button
        searchBtn.disabled = false;
        searchBtn.innerHTML = originalBtnText;
        
        // Re-show status if it was hidden
        if (searchStatus.style.display === 'none') {
            searchStatus.style.display = 'block';
        }
    }
}

function getBloodGroupColor(bloodGroup) {
    const colors = {
        'A+': 'text-red-600',
        'A-': 'text-red-700',
        'B+': 'text-blue-600',
        'B-': 'text-blue-700',
        'AB+': 'text-purple-600',
        'AB-': 'text-purple-700',
        'O+': 'text-green-600',
        'O-': 'text-green-700'
    };
    return colors[bloodGroup] || 'text-gray-600';
}

function renderDonors(donors) {
    const container = document.getElementById('donors-results');
    if (!container) return;
    
    if (donors.length === 0) {
        container.innerHTML = `
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-circle text-yellow-400 text-xl"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">
                            No donors found matching your criteria. Try adjusting your search.
                        </p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = donors.map(donor => `
        <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div class="flex flex-col md:flex-row md:items-center justify-between">
                <div class="flex items-center">
                    <div class="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-medium text-gray-600">
                        ${donor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-medium text-gray-900">${donor.name}</h3>
                        <div class="mt-1 flex items-center text-sm text-gray-500">
                            <span class="font-medium ${getBloodGroupColor(donor.bloodGroup)} px-2 py-0.5 rounded-full bg-opacity-10">
                                ${donor.bloodGroup}
                            </span>
                            <span class="mx-2">•</span>
                            <span>${donor.age} years, ${donor.gender}</span>
                            <span class="mx-2">•</span>
                            <span>${donor.location}</span>
                            <span class="mx-2">•</span>
                            <span><i class="fas fa-map-marker-alt text-red-500 mr-1"></i> ${donor.distance} away</span>
                        </div>
                        <div class="mt-2 text-sm text-gray-500">
                            <span>Last donated: ${donor.lastDonation}</span>
                        </div>
                    </div>
                </div>
                <div class="mt-4 md:mt-0 flex space-x-3">
                    <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        <i class="fas fa-phone-alt mr-2"></i> Call
                    </button>
                    <button class="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 request-blood-btn" 
                            data-donor-id="${donor.id}">
                        <i class="fas fa-tint mr-2"></i> Request Blood
                    </button>
                </div>
            </div>
            ${!donor.available ? `
                <div class="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fas fa-info-circle text-yellow-400"></i>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                                This donor may not be available for immediate donation. Please contact to confirm availability.
                            </p>
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getBloodGroupColor(bloodGroup) {
    const colors = {
        'A+': 'text-red-600',
        'A-': 'text-red-700',
        'B+': 'text-blue-600',
        'B-': 'text-blue-700',
        'AB+': 'text-purple-600',
        'AB-': 'text-purple-700',
        'O+': 'text-green-600',
        'O-': 'text-green-700'
    };
    return colors[bloodGroup] || 'text-gray-600';
}

function getSampleFacilities() {
    // Sample data - replace with real API call in production
    return [
        {
            name: "City General Hospital",
            vicinity: "123 Main St, Anytown",
            types: ["hospital", "health"],
            distance: 1.5,
            geometry: { location: { lat: 0, lng: 0 } },
            opening_hours: { open_now: true }
        },
        {
            name: "Central Blood Bank",
            vicinity: "456 Oak Ave, Anytown",
            types: ["blood_bank", "health"],
            distance: 2.3,
            geometry: { location: { lat: 0, lng: 0 } },
            opening_hours: { open_now: true }
        },
        {
            name: "Community Medical Center",
            vicinity: "789 Pine Rd, Anytown",
            types: ["hospital", "health"],
            distance: 3.7,
            geometry: { location: { lat: 0, lng: 0 } },
            opening_hours: { open_now: false }
        }
    ];
}

function renderHealthcareFacilities(facilities) {
    const container = document.getElementById('healthcare-facilities');
    if (!container) return;
    
    container.innerHTML = facilities.map(facility => `
        <div class="facility-card bg-white rounded-lg shadow-sm p-4 mb-4 hover:shadow-md transition-shadow">
            <div class="flex items-start">
                <div class="flex-shrink-0 bg-red-100 p-3 rounded-lg text-red-600">
                    <i class="fas fa-${facility.types.includes('hospital') ? 'hospital' : 'tint'}"></i>
                </div>
                <div class="ml-4 flex-1">
                    <h3 class="font-medium text-gray-900">${facility.name}</h3>
                    <p class="text-sm text-gray-500 mt-1">${facility.vicinity}</p>
                    <div class="mt-2 flex items-center text-sm text-gray-500">
                        <i class="fas fa-map-marker-alt mr-1 text-red-500"></i>
                        ${facility.distance} km away
                    </div>
                    <div class="mt-2 flex flex-wrap gap-2">
                        <button class="px-3 py-1 bg-red-100 text-red-600 text-sm rounded-full hover:bg-red-200">
                            <i class="fas fa-phone-alt mr-1"></i> Call
                        </button>
                        <button class="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full hover:bg-blue-200">
                            <i class="fas fa-directions mr-1"></i> Directions
                        </button>
                        <button class="request-blood-btn px-3 py-1 bg-green-100 text-green-600 text-sm rounded-full hover:bg-green-200">
                            <i class="fas fa-tint mr-1"></i> Request Blood
                        </button>
                    </div>
                </div>
                <div class="text-right">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${facility.types.includes('hospital') ? 'Hospital' : 'Blood Bank'}
                    </span>
                    ${facility.opening_hours?.open_now ? 
                        '<span class="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Open Now</span>' : 
                        '<span class="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Closed</span>'}
                </div>
            </div>
        </div>
    `).join('');
}

function showBloodRequestModal(facilityName) {
    // Simple implementation - in production, you'd show a modal or redirect
    alert(`Initiating blood request for ${facilityName}\nThis would open a request form in a real implementation.`);
}

// Helper function to get user's location
function handleUseLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // For demo, we'll just show a success message
                document.getElementById('location').value = "Current Location";
                alert("Using your current location for search");
                // In production, you would reverse geocode to get the address
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Could not get your location. Please enter it manually.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please enter your location manually.');
    }
}