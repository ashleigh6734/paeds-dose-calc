const realDrugDatabase = require('../drugs.json');

const appMarkup = `
  <div class="calculator-card">
    <div class="input-group row">
      <div class="half-width">
        <input type="number" id="weight">
      </div>
      <div class="half-width">
        <input type="number" id="ageValue">
        <select id="ageUnit">
          <option value="months">Months</option>
          <option value="years">Years</option>
        </select>
      </div>
    </div>
    <div class="input-group">
      <select id="drugSelect">
        <option value="">-- Select Medication --</option>
      </select>
    </div>
    <div class="input-group" id="formulationContainer" style="display: none;">
      <select id="formulationSelect"></select>
    </div>
    <div class="input-group" id="severityContainer" style="display: none;">
      <select id="severitySelect">
        <option value="standard">Standard</option>
        <option value="severe">Severe</option>
      </select>
    </div>
    <button id="calculateBtn">Calculate Dose</button>
    <div id="resultsSection" style="display: none;">
      <div id="volumeOutput">-- mL</div>
      <div id="doseOutput">(-- mg)</div>
      <div id="guidelineOutput"></div>
    </div>
  </div>
`;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

function changeSelect(element, value) {
  element.value = value;
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
}

async function bootApp({ database = realDrugDatabase, fetchImpl } = {}) {
  jest.resetModules();
  document.body.innerHTML = appMarkup;

  const mockFetch =
    fetchImpl ||
    jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(database),
    });

  global.fetch = mockFetch;
  window.fetch = mockFetch;

  global.alert = jest.fn();
  window.alert = global.alert;

  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  require('../app.js');
  await flushPromises();

  return {
    consoleErrorSpy,
    fetch: mockFetch,
    weightInput: document.getElementById('weight'),
    ageValueInput: document.getElementById('ageValue'),
    ageUnitSelect: document.getElementById('ageUnit'),
    drugSelect: document.getElementById('drugSelect'),
    formulationContainer: document.getElementById('formulationContainer'),
    formulationSelect: document.getElementById('formulationSelect'),
    severityContainer: document.getElementById('severityContainer'),
    severitySelect: document.getElementById('severitySelect'),
    calculateBtn: document.getElementById('calculateBtn'),
    resultsSection: document.getElementById('resultsSection'),
    volumeOutput: document.getElementById('volumeOutput'),
    doseOutput: document.getElementById('doseOutput'),
    guidelineOutput: document.getElementById('guidelineOutput'),
  };
}

afterEach(() => {
  jest.restoreAllMocks();
  document.body.innerHTML = '';
  delete global.fetch;
  delete global.alert;
});

test('loads the drug database and groups medications by class', async () => {
  const database = {
    azithromycin: {
      drug_name: 'Azithromycin',
      class: 'Antibiotic',
    },
    cetirizine: {
      drug_name: 'Cetirizine',
      class: 'Antihistamine',
    },
  };

  const { fetch, drugSelect } = await bootApp({ database });
  const groups = Array.from(drugSelect.querySelectorAll('optgroup'));

  expect(fetch).toHaveBeenCalledWith('drugs.json');
  expect(groups).toHaveLength(2);
  expect(groups.map((group) => group.label)).toEqual(['Antibiotic', 'Antihistamine']);
  expect(groups[0].querySelector('option').textContent).toBe('Azithromycin');
  expect(groups[1].querySelector('option').textContent).toBe('Cetirizine');
});

test('shows severity and formulation controls for drugs with multiple formulations and severity rules', async () => {
  const { drugSelect, formulationContainer, formulationSelect, severityContainer } = await bootApp();

  changeSelect(drugSelect, 'amoxicillin');

  expect(severityContainer.style.display).toBe('block');
  expect(formulationContainer.style.display).toBe('block');
  expect(formulationSelect.options).toHaveLength(3);
  expect(Array.from(formulationSelect.options).map((option) => option.textContent)).toEqual([
    'Amoxicillin 25 mg/mL',
    'Amoxil Forte 50 mg/mL',
    'Maxamox 100 mg/mL',
  ]);
});

test('hides optional controls for drugs with a single formulation and no severity selection', async () => {
  const { drugSelect, formulationContainer, severityContainer } = await bootApp();

  changeSelect(drugSelect, 'azithromycin');

  expect(severityContainer.style.display).toBe('none');
  expect(formulationContainer.style.display).toBe('none');
});

test('calculates a weight-based dose and renders the result details', async () => {
  const {
    weightInput,
    ageValueInput,
    ageUnitSelect,
    drugSelect,
    formulationSelect,
    severitySelect,
    calculateBtn,
    resultsSection,
    volumeOutput,
    doseOutput,
    guidelineOutput,
  } = await bootApp();

  weightInput.value = '10';
  ageValueInput.value = '2';
  ageUnitSelect.value = 'years';

  changeSelect(drugSelect, 'amoxicillin');
  formulationSelect.value = '1';
  severitySelect.value = 'severe';

  calculateBtn.click();

  expect(resultsSection.style.display).toBe('block');
  expect(volumeOutput.textContent).toBe('6 mL');
  expect(doseOutput.textContent).toBe('(300 mg of amoxicillin)');
  expect(guidelineOutput.innerHTML).toContain('<strong>Target:</strong> 30 mg/kg');
  expect(guidelineOutput.innerHTML).toContain('every 8 hours');
});

test('applies the maximum adult dose cap before calculating the final volume', async () => {
  const {
    weightInput,
    ageValueInput,
    ageUnitSelect,
    drugSelect,
    formulationSelect,
    severitySelect,
    calculateBtn,
    volumeOutput,
    doseOutput,
    guidelineOutput,
  } = await bootApp();

  weightInput.value = '40';
  ageValueInput.value = '5';
  ageUnitSelect.value = 'years';

  changeSelect(drugSelect, 'amoxicillin');
  formulationSelect.value = '1';
  severitySelect.value = 'severe';

  calculateBtn.click();

  expect(volumeOutput.textContent).toBe('20 mL');
  expect(doseOutput.textContent).toBe('(1000 mg of amoxicillin)');
  expect(guidelineOutput.innerHTML).toContain('(Max: 1000 mg/dose).');
});

test('alerts when no dosing rule matches the selected age, severity, and formulation', async () => {
  const {
    weightInput,
    ageValueInput,
    ageUnitSelect,
    drugSelect,
    formulationSelect,
    severitySelect,
    calculateBtn,
    resultsSection,
  } = await bootApp();

  weightInput.value = '5';
  ageValueInput.value = '1';
  ageUnitSelect.value = 'months';

  changeSelect(drugSelect, 'amoxicillin_clavulanic_acid');
  formulationSelect.value = '1';
  severitySelect.value = 'severe';

  calculateBtn.click();

  expect(global.alert).toHaveBeenCalledWith(
    'No dosing guidelines found for a patient aged 1 months with this severity/formulation.'
  );
  expect(resultsSection.style.display).toBe('none');
});

test('supports fixed-dose rules when they are present in the database', async () => {
  const database = {
    loratadine: {
      drug_name: 'Loratadine',
      class: 'Antihistamine',
      base_active_ingredient: 'loratadine',
      requires_severity: false,
      formulations: [
        {
          id: 'loratadine_1',
          name: 'Loratadine 1 mg/mL',
          concentration_mg_per_ml: 1,
          dosing_rules: [
            {
              min_age_months: 24,
              max_age_months: 216,
              severity: 'standard',
              fixed_dose_mg: 5,
              frequency: 'once daily',
              max_dose_mg: null,
            },
          ],
        },
      ],
      indication: 'Allergic rhinitis',
    },
  };

  const {
    weightInput,
    ageValueInput,
    ageUnitSelect,
    drugSelect,
    calculateBtn,
    volumeOutput,
    doseOutput,
    guidelineOutput,
  } = await bootApp({ database });

  weightInput.value = '30';
  ageValueInput.value = '4';
  ageUnitSelect.value = 'years';

  changeSelect(drugSelect, 'loratadine');
  calculateBtn.click();

  expect(volumeOutput.textContent).toBe('5 mL');
  expect(doseOutput.textContent).toBe('(5 mg of loratadine)');
  expect(guidelineOutput.innerHTML).toContain('<strong>Fixed Dose:</strong> 5 mg');
  expect(guidelineOutput.innerHTML).toContain('once daily');
});

test('shows a friendly error message when the database cannot be loaded', async () => {
  const failingFetch = jest.fn().mockRejectedValue(new Error('Network failure'));
  const { consoleErrorSpy, guidelineOutput } = await bootApp({ fetchImpl: failingFetch });

  expect(consoleErrorSpy).toHaveBeenCalled();
  expect(guidelineOutput.textContent).toBe('Error: Could not load drug database.');
});
