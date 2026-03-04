# Paediatric Dose Calculator 💊

A lightweight, purely client-side web application designed to safely and rapidly calculate pediatric antibiotic liquid doses. This tool reduces cognitive load by calculating both the raw milligram (mg) target and the final administrable volume (mL) based on standard Australian guidelines.

**Live :** https://ashleigh6734.github.io/paeds-dose-calc/

## ✨ Features
* **Clinical Guardrails:** Automatically caps pediatric weight-based calculations at the maximum recommended adult single dose.
* **Dynamic Logic:** Adjusts calculations and available formulations based on the patient's age (months/years) and the severity of the infection.
* **Comprehensive Australian Database:** Includes a significantly wider range of oral liquid antibiotics compared to standard calculators, with calculations specifically tailored to formulations available on the Australian PBS.
* **Zero-Latency:** 100% client-side execution means the calculator works instantly.
* **Mobile-Responsive:** CSS designed specifically to be readable and easily tappable on phones and tablets.

## 🗺️ Future Scope
While the current MVP focuses on oral antibiotics, the underlying JSON architecture was built to scale. Future updates will expand the calculator to include other common pediatric drug classes, such as:
* **Analgesics & Antipyretics** 
* **Corticosteroids** 
* **Antihistamines** 

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
* **Database:** A statically hosted `drugs.json` file acting as a scalable clinical database.
* **Hosting:** GitHub Pages (Static file hosting).

## 🗂️ Data Architecture
The application separates the clinical data from the core logic engine. New medications, guidelines, or PBS formulation strengths can be added by simply updating the `drugs.json` file without needing to refactor the underlying JavaScript. 

```json
// Example Data Structure
"amoxicillin": {
  "base_active_ingredient": "amoxicillin",
  "requires_severity": true,
  "formulations": [ ... ]
}
```

## ⚖️ Disclaimer & Referencing
This tool calculates standard reference doses only. A patient's clinical condition (e.g., renal/liver disease, immunosuppression, overweight, malnutrition) may require alteration of doses. If in doubt, seek senior or specialist medical advice. This tool is for educational/reference purposes and does not replace independent clinical judgment.

Clinical Reference:
```bash
Australian Medicines Handbook Pty Ltd. AMH Children's Dosing Companion [Internet]. Adelaide: Australian Medicines Handbook Pty Ltd; 2024 [cited 2026 Mar 3]. Available from: https://childrens.amh.net.au/
```
## 👩‍💻 About the Developer
Developed by Ashleigh Henna, BPharm(Hons), GradCertPharmPrac, Cert IV (CybSec).

This project was built to bridge the gap between clinical pharmacy practice and functional software engineering, creating secure, scalable, and clinically safe digital healthcare tools.