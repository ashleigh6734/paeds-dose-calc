// ==========================================
// 1. STATE & DOM ELEMENTS
// ==========================================
let drugDatabase = {}; // This will hold our JSON data

// Inputs
const weightInput = document.getElementById('weight');
const ageValueInput = document.getElementById('ageValue');
const ageUnitSelect = document.getElementById('ageUnit');
const drugSelect = document.getElementById('drugSelect');

// Dynamic Containers & Selectors
const formulationContainer = document.getElementById('formulationContainer');
const formulationSelect = document.getElementById('formulationSelect');
const severityContainer = document.getElementById('severityContainer');
const severitySelect = document.getElementById('severitySelect');

// Outputs & Buttons
const calculateBtn = document.getElementById('calculateBtn');
const resultsSection = document.getElementById('resultsSection');
const volumeOutput = document.getElementById('volumeOutput');
const doseOutput = document.getElementById('doseOutput');
const guidelineOutput = document.getElementById('guidelineOutput');

// ==========================================
// 2. INITIALIZATION (Fetching the Database)
// ==========================================
async function initApp() {
    try {
        // Fetch the external JSON file
        const response = await fetch('drugs.json');
        drugDatabase = await response.json();
        
        // Dynamically populate the main drug dropdown based on JSON keys
        populateDrugDropdown();
    } catch (error) {
        console.error("Failed to load clinical data:", error);
        guidelineOutput.textContent = "Error: Could not load drug database.";
    }
}

function populateDrugDropdown() {
    // Clear existing options except the placeholder
    drugSelect.innerHTML = '<option value="">-- Select Medication --</option>';
    
    // Loop through the database and create an option for each drug
    for (const [key, data] of Object.entries(drugDatabase)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = data.drug_name;
        drugSelect.appendChild(option);
    }
}

// ==========================================
// 3. UI REACTIVITY (Dynamic Dropdowns)
// ==========================================
drugSelect.addEventListener('change', (e) => {
    const selectedDrugKey = e.target.value;
    
    // Hide dynamic fields if no drug is selected
    if (!selectedDrugKey) {
        formulationContainer.style.display = 'none';
        severityContainer.style.display = 'none';
        return;
    }

    const drug = drugDatabase[selectedDrugKey];

    // Handle Severity Toggle Visibility
    if (drug.requires_severity) {
        severityContainer.style.display = 'block';
    } else {
        severityContainer.style.display = 'none';
    }

    // Handle Formulation Dropdown Visibility
    if (drug.formulations.length > 1) {
        formulationSelect.innerHTML = ''; // Clear old options
        drug.formulations.forEach((formulation, index) => {
            const option = document.createElement('option');
            option.value = index; // Store the array index for easy lookup later
            option.textContent = formulation.name;
            formulationSelect.appendChild(option);
        });
        formulationContainer.style.display = 'block';
    } else {
        // If only one formulation exists, hide the dropdown to save space
        formulationContainer.style.display = 'none';
    }
});

// ==========================================
// 4. THE CLINICAL MATH ENGINE
// ==========================================
calculateBtn.addEventListener('click', () => {
    // 1. Validate Core Inputs
    const weight = parseFloat(weightInput.value);
    const ageValue = parseFloat(ageValueInput.value);
    const ageUnit = ageUnitSelect.value;
    const selectedDrugKey = drugSelect.value;

    if (isNaN(weight) || weight <= 0 || isNaN(ageValue) || ageValue < 0 || !selectedDrugKey) {
        alert("Please ensure weight, age, and medication are correctly entered.");
        return;
    }

    // 2. Convert age strictly to months for logic comparison
    const ageInMonths = ageUnit === 'years' ? ageValue * 12 : ageValue;

    // 3. Retrieve Selected Data
    const drug = drugDatabase[selectedDrugKey];
    const severity = drug.requires_severity ? severitySelect.value : 'standard';
    
    // If formulation dropdown is hidden (only 1 formulation), default to index 0
    const formulationIndex = drug.formulations.length > 1 ? parseInt(formulationSelect.value) : 0;
    const formulation = drug.formulations[formulationIndex];

    // 4. Find the matching clinical rule based on age and severity
    const rule = formulation.dosing_rules.find(r => 
        ageInMonths >= r.min_age_months && 
        ageInMonths <= r.max_age_months && 
        r.severity === severity
    );

    if (!rule) {
        alert(`No dosing guidelines found for a patient aged ${ageValue} ${ageUnit} with this severity/formulation.`);
        return;
    }

    // 5. Calculate Doses
    let calculatedMg = weight * rule.dose_mg_per_kg;

    // Apply adult cap if one exists in the rule
    if (rule.max_dose_mg && calculatedMg > rule.max_dose_mg) {
        calculatedMg = rule.max_dose_mg;
    }

    // Calculate volume and round to 1 decimal place
    const calculatedMl = calculatedMg / formulation.concentration_mg_per_ml;
    const finalMl = Math.round(calculatedMl * 10) / 10;
    const finalMg = Math.round(calculatedMg);

    // 6. Push to UI
    volumeOutput.textContent = `${finalMl} mL`;
    doseOutput.textContent = `(${finalMg} mg of ${drug.base_active_ingredient})`;
    
    // Build a clean guideline text string to show the user the exact math used
    guidelineOutput.textContent = `Target: ${rule.dose_mg_per_kg} mg/kg/dose ${rule.frequency}. ` + 
                                  (rule.max_dose_mg ? `(Max: ${rule.max_dose_mg} mg/dose).` : '');

    resultsSection.style.display = 'block';
});

// Boot up the app
initApp();