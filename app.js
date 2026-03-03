// 1. Grab the elements from the HTML
const weightInput = document.getElementById('weight');
const calculateBtn = document.getElementById('calculateBtn');
const resultDisplay = document.getElementById('resultDisplay');

// 2. Tell the button what to do when clicked
calculateBtn.addEventListener('click', function() {
    
    // Get the weight value and convert it to a decimal number
    const weight = parseFloat(weightInput.value);

    // Basic validation to ensure a weight was entered
    if (isNaN(weight) || weight <= 0) {
        resultDisplay.textContent = "Please enter a valid weight.";
        return; // Stop the function here
    }

    // 3. The Math (Hardcoded for Amoxicillin 15mg/kg for now)
    const dosePerKg = 15; 
    let totalDoseMg = weight * dosePerKg;

    // 4. Show the result on the screen
    resultDisplay.textContent = `Give ${totalDoseMg} mg per dose.`;
});