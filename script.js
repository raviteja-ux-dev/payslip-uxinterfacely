/* ---------- Utility ---------- */

function getValue(id) {
    return Number(document.getElementById(id).value) || 0;
}

function getText(id) {
    return document.getElementById(id).value.trim();
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
        el.value = value;
    } else {
        el.textContent = value;
    }
}

function show(id) {
    document.getElementById(id).style.display = "block";
}

function hide(id) {
    document.getElementById(id).style.display = "none";
}

/* ========================EXCEL UPLOAD VARIABLES ==================================*/

    let employees = [];
    let currentEmployeeIndex = 0; 
    // Generated Payslips
    let generatedPayslips = [];
    let currentPayslipIndex = 0;
    let generatedMode = false;

/* ========== SINGLE TABLE RENDERER (PAIRS EARNINGS & DEDUCTIONS ROW BY ROW) =======*/

function renderSalaryTable(basic, hra, special, variable, bonus, pfEmployee, pfEmployer, professionalTax, TDS) {
    // 1. Build list of active Earnings
    let earningsList = [
        { label: "Basic Salary", val: basic.toFixed(2) },
        { label: "HRA", val: hra.toFixed(2) },
        { label: "Special Allowance", val: special.toFixed(2) }
    ];

    if (document.getElementById("variablePay").value === "yes") {
        earningsList.push({ label: "Variable Pay", val: variable.toFixed(2) });
    }

    if (document.getElementById("Bonus").value === "yes") {
        earningsList.push({ label: "Bonus", val: bonus.toFixed(2) });
    }

    // 2. Build list of active Deductions (Separate PF rows for Employee & Employer)
    let deductionsList = [];

    if (document.getElementById("PFfield").value === "yes") {
        deductionsList.push({ label: "PF - Employee Fund", val: pfEmployee.toFixed(2) });
        deductionsList.push({ label: "PF - Employer Fund", val: pfEmployer.toFixed(2) });
    }

    deductionsList.push({ label: "Professional Tax", val: professionalTax.toFixed(2) });

    if (document.getElementById("tds").value === "yes") {
        deductionsList.push({ label: "TDS", val: TDS.toFixed(2) });
    }

    // 3. Render rows into the single table
    let tbody = document.getElementById("salaryTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    let maxRows = Math.max(earningsList.length, deductionsList.length);

    for (let i = 0; i < maxRows; i++) {
        let earn = earningsList[i] || { label: "", val: "" };
        let ded = deductionsList[i] || { label: "", val: "" };

        let tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${earn.label}</td>
            <td style="text-align: right;">${earn.label ? `<input value="${earn.val}" readonly>` : ''}</td>
            <td>${ded.label}</td>
            <td style="text-align: right;">${ded.label ? `<input value="${ded.val}" readonly>` : ''}</td>
        `;

        tbody.appendChild(tr);
    }
}
function renderViewedSalaryTable(p) {

    // =========================
    // Calculate salary values
    // =========================

    const annualCTC = Number(p.annual_ctc) || 0;

    const payableDays = Number(p.days_payable) || 0;
    const workedDays = Number(p.days_worked) || 0;

    let monthlyCTC = annualCTC / 12;

    if (p.start_date && payableDays > 0) {

        const date = new Date(p.start_date);

        const totalMonthDays =
            new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                0
            ).getDate();

        const perDaySalary =
            monthlyCTC / totalMonthDays;

        monthlyCTC =
            perDaySalary * workedDays;
    }
    else {

        monthlyCTC = 0;

    }

    // =========================
    // Earnings
    // =========================

    const variable =
        Number(p.variable_pay) || 0;

    const bonus =
        Number(p.bonus) || 0;

    const basic =
        monthlyCTC * 0.50;

    const hra =
        monthlyCTC * 0.20;

    let special =
        monthlyCTC - basic - hra - variable;

    if (special < 0) {
        special = 0;
    }

    // =========================
    // PF
    // =========================

    const pfEmployee =
        Number(p.pf_employee) || 0;

    const pfEmployer =
        Number(p.pf_employer) || 0;

    const pf =
        pfEmployee + pfEmployer;

    // =========================
    // TDS
    // =========================

    const tds =
        Number(p.tds) || 0;

    // =========================
    // Professional Tax
    // =========================

    const professionalTax = 200;

    // =========================
    // Earnings List
    // =========================

    let earningsList = [

        {
            label: "Basic Salary",
            val: basic.toFixed(2)
        },

        {
            label: "HRA",
            val: hra.toFixed(2)
        },

        {
            label: "Special Allowance",
            val: special.toFixed(2)
        }

    ];

    // Variable Pay
    if (variable > 0) {

        earningsList.push({

            label: "Variable Pay",
            val: variable.toFixed(2)

        });

    }

    // Bonus
    if (bonus > 0) {

        earningsList.push({

            label: "Bonus",
            val: bonus.toFixed(2)

        });

    }

    // ============= Deductions List ============


    let deductionsList = [];

    // PF
    if (pf > 0) {

        deductionsList.push({

            label: "Provident Fund",
            val: pf.toFixed(2)

        });

    }

    // Professional Tax
    deductionsList.push({

        label: "Professional Tax",
        val: professionalTax.toFixed(2)

    });

    // TDS
    if (tds > 0) {

        deductionsList.push({

            label: "TDS",
            val: tds.toFixed(2)

        });

    }

    // =========================
    // Render Table
    // =========================

    const tbody =
        document.getElementById("salaryTableBody");

    tbody.innerHTML = "";

    const maxRows =
        Math.max(
            earningsList.length,
            deductionsList.length
        );

    for (let i = 0; i < maxRows; i++) {

        const earn =
            earningsList[i] || {
                label: "",
                val: ""
            };

        const ded =
            deductionsList[i] || {
                label: "",
                val: ""
            };

        const tr =
            document.createElement("tr");

        tr.innerHTML = `

            <td>${earn.label}</td>

            <td>
                <input
                    value="${earn.val}"
                    readonly
                >
            </td>

            <td>${ded.label}</td>

            <td>
                <input
                    value="${ded.val}"
                    readonly
                >
            </td>

        `;

        tbody.appendChild(tr);
    }}
// payslip-month
function updatePayslipMonth() {
    let startDate = document.getElementById("startDate").value;
    if (!startDate) return;

    let date = new Date(startDate);
    const months = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];

    let month = months[date.getMonth()];
    let year = date.getFullYear();

    setValue("paymonth", `PAYSLIP FOR THE MONTH OF ${month} ${year}`);
}

// VARIABLE PAY
function toggleVariablePay() {
    let enabled = document.getElementById("variablePay").value === "yes";
    if (enabled) {
        show("variablePayAmount");
    } else {
        hide("variablePayAmount");
        setValue("variableAmount", "");
    }
    calculateSalary();
}

function updateVariablePay() {
    calculateSalary();
}

/* BONUS */
function toggleBonus() {
    let enabled = document.getElementById("Bonus").value === "yes";
    if (enabled) {
        show("BonusAmountBox");
    } else {
        hide("BonusAmountBox");
        setValue("BonusAmount", "");
    }
    calculateSalary();
}

function updateBonus() {
    calculateSalary();
}

/* PROVIDENT FUND */
function togglePF() {
    let enabled = document.getElementById("PFfield").value === "yes";
    if (enabled) {
        show("PFamountBox");
    } else {
        hide("PFamountBox");
        setValue("pfEmployee", "");
        setValue("pfEmployer", "");
    }
    calculateSalary();
}

/* UAN */
function toggleUan() {
    let enabled = document.getElementById("UAN").value === "yes";
    if (enabled) {
        show("uanNumberBox");
        document.getElementById("uanNumber").required = true;
    } else {
        hide("uanNumberBox");
        setValue("uanNumber", "");
        document.getElementById("uanNumber").required = false;
    }
}

/* LOP */
function toggleLop() {
    let enabled = document.getElementById("lopdays").value === "yes";
    if (enabled) {
        show("Loppaydbox");
    } else {
        hide("Loppaydbox");
        setValue("LopPayField", 0);
    }
    calculateDays();
    calculateSalary();
}

function updatelop() {
    calculateDays();
}

/* Sanitize LOP field (allows .5 half-day entries) without breaking cursor position */
function sanitizeLopInput(input) {

    const cursorPos = input.selectionStart;
    const original = input.value;

    // Strip anything that isn't a digit or a dot
    let stripped = original.replace(/[^0-9.]/g, '');

    // Keep only the first decimal point, drop any extras
    let parts = stripped.split('.');
    let cleaned = parts.length > 1
        ? parts[0] + '.' + parts.slice(1).join('')
        : parts[0];

    if (cleaned !== original) {

        // Cursor should land after the same count of valid chars
        // that existed before the cursor in the original string
        const validCharsBeforeCursor =
            original.slice(0, cursorPos).replace(/[^0-9.]/g, '').length;

        input.value = cleaned;
        input.setSelectionRange(validCharsBeforeCursor, validCharsBeforeCursor);
    }

    updatelop();
}

/* TDS */
function toggleTds() {
    let enabled = document.getElementById("tds").value === "yes";
    if (enabled) {
        show("tdsAmountBox");
    } else {
        hide("tdsAmountBox");
        setValue("tdsAmount", "");
    }
    calculateSalary();
}

/* DAYS CALCULATION */
function calculateDays() {
    let start = new Date(document.getElementById("startDate").value);
    let end = new Date(document.getElementById("endDate").value);

    if (isNaN(start) || isNaN(end)) return;

    let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (days < 0) days = 0;

    setValue("DaysPayable", days);
    let workedDays = days;

    if (document.getElementById("lopdays").value === "yes") {
        let lopDays = getValue("LopPayField");
        if (lopDays > days) {
            lopDays = days;
            setValue("LopPayField", lopDays);
        }
        workedDays = days - lopDays;
    }

    setValue("DaysWorked", workedDays);
    calculateSalary();
}

// /* GENERATE PAYSLIP */
async function generatePayslip() {

    // Trigger HTML5 inline form validation
    const form = document.getElementById("payslipgenerator");
    if (!form.reportValidity()) {
        return; // Stops generation if fields are invalid
    }

    // If Excel is uploaded
    if (employees.length > 0) {
        saveCurrentFormToEmployeeArray();

        // Hide layout during loop to eliminate flickering ("flash mob" effect)
        document.getElementById("payslipLayout").style.display = "none";
        document.getElementById("actionToolbar").style.display = "none";

        generatedPayslips = [];

        for (let i = 0; i < employees.length; i++) {

            loadEmployee(i);

            updatePayslipMonth();

            setValue("empid", getText("AssociateID"));
            setValue("empname", getText("name"));
            setValue("designation", getText("Designation"));

            document.getElementById("baseLocation").innerText =
                getText("location");

            setValue("displayPan", getText("pan").toUpperCase());
            setValue("joindate", formatDateDMY(document.getElementById("JoinDate").value));

            if (document.getElementById("UAN").value === "yes") {

                setValue("displayUan", getText("uanNumber"));

            } else {

                setValue("displayUan", "");

            }
            setValue("displayAnnualCTC", getText("AnnualCTC"));

            calculateDays();
            calculateSalary();

            // Save employee to DB
            await saveEmployeeToDatabase();

            // Save generated payslip
            generatedPayslips.push({

                empid: getText("AssociateID"),
                empname: getText("name"),
                designation: getText("Designation"),
                location: getText("location"),
                pan: getText("pan").toUpperCase(),
                joindate: document.getElementById("JoinDate").value,
                uan: getText("uanNumber"),
                annualCTC: getText("AnnualCTC"),

                paymonth: document.getElementById("paymonth").value,

                salaryTable:
                    document.getElementById("salaryTableBody").innerHTML,

                totalEarnings:
                    document.getElementById("totalEarnings").value,

                totalDeduction:
                    document.getElementById("totalDeduction").value,

                netpay:
                    document.getElementById("netpay").innerText,

                amountWords:
                    document.getElementById("amountWords").innerText

            });

        }

        generatedMode = true;

        currentPayslipIndex = 0;

        showGeneratedPayslip(0);

        document.getElementById("payslipLayout").style.display = "block";
        document.getElementById("actionToolbar").style.display = "flex";

        return;
    }

    // Manual Mode (without Excel)

    document.getElementById("payslipLayout").style.display = "block";
    document.getElementById("actionToolbar").style.display = "flex";

    updatePayslipMonth();

    setValue("empid", getText("AssociateID"));
    setValue("empname", getText("name"));
    setValue("designation", getText("Designation"));

    document.getElementById("baseLocation").innerText =
        getText("location");

    setValue("displayPan", getText("pan").toUpperCase());
    setValue("joindate", formatDateDMY(getText("JoinDate")));

    if (document.getElementById("UAN").value === "yes") {

        setValue("displayUan", getText("uanNumber"));

    } else {

        setValue("displayUan", "");

    }
    setValue("displayAnnualCTC", getText("AnnualCTC"));

    calculateDays();
    calculateSalary();

    await saveEmployeeToDatabase();

    window.scrollTo({
        top: document.getElementById("payslipLayout").offsetTop,
        behavior: "smooth"
    });

}

// ========= Generate all payslips at a time =============
async function generateAllPayslips() {

    if (employees.length === 0) {
        alert("Please upload an Excel file.");
        return;
    }

    // generatePayslip() already loops over every employee in `employees`
    // and builds `generatedPayslips` internally when employees.length > 0.
    // Looping over it again here duplicated every database save N times
    // per employee (N^2 total writes) — so just call it once.
    await generatePayslip();

    alert("All payslips generated successfully.");

}

/* ========== save employee  to database ========*/
async function saveEmployeeToDatabase() {

    // ============= Employee Master =============
   
    const employee = {

        associate_id: getText("AssociateID").trim().toUpperCase(),
        employee_name: getText("name"),
        designation: getText("Designation"),
        email: getText("email"),
        department: getText("Department"),
        location: getText("location"),

        pan: getText("pan").trim().toUpperCase(),
        uan: getText("uanNumber"),
        

        start_date: document.getElementById("startDate").value,
        end_date: document.getElementById("endDate").value,
        join_date: document.getElementById("JoinDate").value,

        annual_ctc: getValue("AnnualCTC"),

        days_payable: getValue("DaysPayable"),
        days_worked: getValue("DaysWorked"),
        lop_days: getValue("LopPayField"),

        variable_pay: getValue("variableAmount"),
        bonus: getValue("BonusAmount"),

        pf_employee: getValue("pfEmployee"),
        pf_employer: getValue("pfEmployer"),

        tds: getValue("tdsAmount"),

        total_earnings: getValue("totalEarnings"),
        total_deductions: getValue("totalDeduction"),

        net_salary: Number(
            document.getElementById("netpay").innerText.replace(/,/g, "")
        ) || 0

    };

    // =============  Payslip =============

    let start = new Date(document.getElementById("startDate").value);

    const payslip = {

       associate_id: getText("AssociateID").trim().toUpperCase(),

        start_date: document.getElementById("startDate").value,
        end_date: document.getElementById("endDate").value,

        pay_month: start.toLocaleString("default", {
            month: "long"
        }),

        pay_year: start.getFullYear(),

        annual_ctc: getValue("AnnualCTC"),

        days_payable: getValue("DaysPayable"),
        days_worked: getValue("DaysWorked"),
        lop_days: getValue("LopPayField"),

        variable_pay: getValue("variableAmount"),
        bonus: getValue("BonusAmount"),

        pf_employee: getValue("pfEmployee"),
        pf_employer: getValue("pfEmployer"),

        tds: getValue("tdsAmount"),

        total_earnings: getValue("totalEarnings"),
        total_deductions: getValue("totalDeduction"),

        net_salary: Number(
            document.getElementById("netpay").innerText.replace(/,/g, "")
        ) || 0

    };

    try {

        console.log("Saving Employee...");
        console.log(employee);

        // ==========================
        // Save Employee
        // ==========================

        const employeeResponse = await fetch(
            "https://payslip-uxinterfacely.onrender.com/employee",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(employee)
            }
        );

        const employeeResult = await employeeResponse.json();

        console.log("Employee Saved");
        console.log(employeeResult);

        console.log("Saving Payslip...");
        console.log(payslip);

        // ==========================
        // Save Payslip
        // ==========================

        const payslipResponse = await fetch(
            "https://payslip-uxinterfacely.onrender.com/payslip",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payslip)
            }
        );

        const payslipResult = await payslipResponse.json();

        console.log("Payslip Saved");
        console.log(payslipResult);

    }
    catch (err) {

        console.error("Database Save Error:", err);

    }

}

async function searchPayslipHistory() {

    let associateId =
        document.getElementById("historyAssociateId")
        .value
        .trim()
        .toUpperCase();

    if (!associateId) {

        alert("Enter Associate ID");

        return;

    }

    try {

        const response = await fetch(

            `https://payslip-uxinterfacely.onrender.com/payslips/${associateId}`

        );

        const payslips = await response.json();
        console.log("HISTORY API RESPONSE:", payslips);

        let html = "";

        if (payslips.length === 0) {

            html = "<h4>No Payslips Found</h4>";

        }

        else {

            payslips.forEach((p,index)=>{

                html += `

                <div class="history-card">

                   <div class="history-info">
                        Employee Name : ${p.employee_name}<br>
                        Designation : ${p.designation}<br>
                        <strong>${p.pay_month} ${p.pay_year}</strong><br>
                        Net Salary :
                        ₹${Number(p.net_salary).toLocaleString("en-IN")}
                    </div>

                    <div class="history-buttons">
                        <button onclick="viewPayslip(${p.id})">View</button> 
                    </div>

                </div>

                `;

            });

        }

        document.getElementById("historyResult").innerHTML = html;

        window.historyPayslips = payslips;

    }

    catch(err){

        console.error(err);

    }

}

// ============= VIEW PAYSLIP FROM HISTORY =============

async function viewPayslip(id) {

    try {

        const response = await fetch(
            `https://payslip-uxinterfacely.onrender.com/payslip/${id}`
        );

        const p = await response.json();

        console.log("Selected Payslip:", p);

        // ===================== SHOW PAYSLIP =====================

        document.getElementById("payslipLayout").style.display = "block";
        document.getElementById("actionToolbar").style.display = "flex";


        // =================== HEADER =======================
   
        document.getElementById("paymonth").value =
            `PAYSLIP FOR THE MONTH OF ${p.pay_month.toUpperCase()} ${p.pay_year}`;


        // ================== EMPLOYEE DETAILS ========================

        document.getElementById("empid").value =
            p.associate_id || "";

         setValue("empname", p.employee_name || "");

        document.getElementById("designation").value =
            p.designation || "";

        document.getElementById("baseLocation").innerText =
            p.location || "";

        document.getElementById("displayPan").value =
            (p.pan || "").toString().toUpperCase();

        document.getElementById("displayUan").value =
            p.uan || "";

        document.getElementById("joindate").value =
            formatDateDMY(p.join_date || "");



        if (document.getElementById("displayAnnualCTC")) {
            document.getElementById("displayAnnualCTC").value = p.annual_ctc || "";
        }

        // ====================  CALCULATE SALARY VALUES ======================

        let annualCTC = Number(p.annual_ctc) || 0;

        let startDate = p.start_date;

        let daysWorked = Number(p.days_worked) || 0;

        let monthlyCTC = annualCTC / 12;

        if (startDate && daysWorked > 0) {

            let date = new Date(startDate);

            let totalMonthDays =
                new Date(
                    date.getFullYear(),
                    date.getMonth() + 1,
                    0
                ).getDate();

            let perDaySalary =
                monthlyCTC / totalMonthDays;

            monthlyCTC =
                perDaySalary * daysWorked;

        } else {

            monthlyCTC = 0;

        }


        // ======================  EARNINGS ====================

        let basic =
            monthlyCTC * 0.50;

        let hra =
            monthlyCTC * 0.20;

        let variable =
            Number(p.variable_pay) || 0;

        let bonus =
            Number(p.bonus) || 0;

        let special =
            monthlyCTC - basic - hra - variable;

        if (special < 0) {

            special = 0;

        }


        // =====================  DEDUCTIONS =====================

        let pfEmployee =
            Number(p.pf_employee) || 0;

        let pfEmployer =
            Number(p.pf_employer) || 0;

        let pf =
            pfEmployee + pfEmployer;

        let professionalTax = 200;

        let TDS =
            Number(p.tds) || 0;


        // Restore optional salary selections
        document.getElementById("variablePay").value =
            variable > 0 ? "yes" : "no";

        document.getElementById("Bonus").value =
            bonus > 0 ? "yes" : "no";

        document.getElementById("PFfield").value =
            pf > 0 ? "yes" : "no";

        document.getElementById("tds").value =
            TDS > 0 ? "yes" : "no";

        // ===================== RENDER SALARY TABLE =====================


        renderSalaryTable(
            basic,
            hra,
            special,
            variable,
            bonus,
            pfEmployee,
            pfEmployer,
            professionalTax,
            TDS
        );


        // ====================  TOTALS ======================

        document.getElementById("totalEarnings").value =
            Number(p.total_earnings).toFixed(2);

        document.getElementById("totalDeduction").value =
            Number(p.total_deductions).toFixed(2);


        // ==================== NET PAY ======================

        document.getElementById("netpay").innerText =
            Number(p.net_salary).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });


        // ==================== AMOUNT IN WORDS ======================

        document.getElementById("amountWords").innerText =
            numberToWords(
                Math.round(Number(p.net_salary))
            );


        // ====================== SCROLL TO PAYSLIP ====================

        window.scrollTo({

            top:
                document.getElementById("payslipLayout").offsetTop,
            behavior: "smooth"

        });

    }

    catch (err) {

        console.error("View Payslip Error:", err);

        alert("Unable to load payslip.");

    }

}

/* SALARY CALCULATION */
function calculateSalary() {
    let annualCTC = getValue("AnnualCTC");
    let monthlyCTC = annualCTC / 12;

    let payableDays = getValue("DaysPayable");
    let workedDays = getValue("DaysWorked");

    let startDate = document.getElementById("startDate").value;

    if (startDate && payableDays > 0) {
        let date = new Date(startDate);
        let totalMonthDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        let perDaySalary = monthlyCTC / totalMonthDays;
        monthlyCTC = perDaySalary * workedDays;
    } else {
        monthlyCTC = 0;
    }

    let basic = monthlyCTC * 0.50;
    let hra = monthlyCTC * 0.20;

    let variable = 0;
    if (document.getElementById("variablePay").value === "yes") {
        variable = getValue("variableAmount");
    }

    let bonus = 0;
    if (document.getElementById("Bonus").value === "yes") {
        bonus = getValue("BonusAmount");
    }

    let special = monthlyCTC - basic - hra - variable;
    if (special < 0) special = 0;

    let totalEarnings = basic + hra + special + variable + bonus;
    setValue("totalEarnings", totalEarnings.toFixed(2));

    /* ============================================================
       AUTO CALCULATE PROVIDENT FUND (PF)
       - Basic Pay < 10,000  : PF Employee = 1200, PF Employer = 1200 (Total 2400 / 30 = 80/day)
       - Basic Pay >= 10,000 : PF Employee = 1800, PF Employer = 1800 (Total 3600 / 30 = 120/day)
       - Base = 30 days. Deducts full LOP days AND half-day LOP (e.g. 1.5, 0.5) proportionally
         from the 30-day base (30 - LOP Days, LOP Days kept as-is including .5 fractions).
    ============================================================ */

    let pfEmployee = 0;
    let pfEmployer = 0;

    if (document.getElementById("PFfield").value === "yes") {

        // Base monthly basic calculation (before LOP) to determine tier
        let fullMonthlyBasic = (annualCTC > 0) ? (annualCTC / 12 * 0.50) : basic;
        let basePfEach = (fullMonthlyBasic < 10000) ? 1200 : 1800; // 1200 if < 10000, 1800 if >= 10000

        let lopDays = 0;
        if (document.getElementById("lopdays").value === "yes") {
            lopDays = getValue("LopPayField"); // include half-day (.5) LOP in PF deduction
        }

        let pfDays = 30 - lopDays;
        if (pfDays < 0) pfDays = 0;

        let perDayPfEach = basePfEach / 30; // 40 per day (for 1200) or 60 per day (for 1800)

        pfEmployee = perDayPfEach * pfDays;
        pfEmployer = perDayPfEach * pfDays;

        setValue("pfEmployee", pfEmployee.toFixed(2));
        setValue("pfEmployer", pfEmployer.toFixed(2));
    }

    let pf = pfEmployee + pfEmployer;
    let professionalTax = 200;

    let TDS = 0;
    if (document.getElementById("tds").value === "yes") {
        TDS = getValue("tdsAmount");
    }

    let totalDeduction = pf + professionalTax + TDS;
    setValue("totalDeduction", totalDeduction.toFixed(2));

    // Render table with separate PF rows
    renderSalaryTable(basic, hra, special, variable, bonus, pfEmployee, pfEmployer, professionalTax, TDS);

    let netSalary = totalEarnings - totalDeduction;
    if (netSalary < 0) netSalary = 0;

    let formattedNetPay = netSalary.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.getElementById("netpay").innerText = formattedNetPay;
    document.getElementById("amountWords").innerText = numberToWords(Math.round(netSalary));
}

/* NUMBER TO WORDS */
function numberToWords(num) {
    if (num === 0) return "Zero";

    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    function convert(n) {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? "-" + ones[n % 10] : "");
        if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + convert(n % 100);
        if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand " + convert(n % 1000);
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh " + convert(n % 100000);
        return convert(Math.floor(n / 10000000)) + " Crore " + convert(n % 10000000);
    }

    return convert(num).replace(/\s+/g, " ").trim();
}

/* print - button */

async function printPayslip() {

    // Hide action buttons
    const toolbar = document.getElementById("actionToolbar");
    toolbar.style.display = "none";

    const { jsPDF } = window.jspdf;
    const payslip = document.getElementById("payslipLayout");

    const canvas = await html2canvas(payslip, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
    });

    // Show buttons again
    toolbar.style.display = "flex";

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "letter"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    let y = 0;
    if (imgHeight < pageHeight) {
        y = (pageHeight - imgHeight) / 2;
    }

    pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);

    // Open PDF in new window
    const blob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    const printWindow = window.open(blobUrl);

    printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
    };
}

/* EXPORT / ADD CURRENT ROW TO EXCEL */
let accumulatedPayslips = JSON.parse(localStorage.getItem("accumulatedPayslips") || "[]");

function addCurrentRowToExcel() {
    let rawName = getText("name") || "Employee";

    let startDateVal = document.getElementById("startDate").value;

    let currentRowData = {
        "S.No": accumulatedPayslips.length + 1,
        "Associate ID": getText("AssociateID"),
        "Employee Name": rawName,
        "Designation": getText("Designation"),
        "Department": getText("Department"),
        "Location": getText("location"),
        "PAN": getText("pan").toUpperCase(),
        "UAN": document.getElementById("UAN").value === "yes" ? getText("uanNumber") : "N/A",
        "Start Date": startDateVal,
        "End Date": document.getElementById("endDate").value,
        "Days Payable": getValue("DaysPayable"),
        "Days Worked": getValue("DaysWorked"),
        "Annual CTC": getValue("AnnualCTC"),
        "Total Earnings": getValue("totalEarnings"),
        "Total Deductions": getValue("totalDeduction"),
        "Net Pay": document.getElementById("netpay").innerText
    };

    accumulatedPayslips.push(currentRowData);
    localStorage.setItem("accumulatedPayslips", JSON.stringify(accumulatedPayslips));

    alert(`Row #${accumulatedPayslips.length} added to export queue! (Click 'Download Excel' to save)`);
}

function downloadAccumulatedExcel() {
    if (accumulatedPayslips.length === 0) {
        alert("No rows have been added yet. Click 'Add Current Row' first.");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(accumulatedPayslips);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payslips");

    // Download under a fixed file name
    XLSX.writeFile(workbook, "Accumulated_Payslips.xlsx");
}

function clearExcelRows() {
    if (confirm("Clear all accumulated rows and start a fresh Excel sheet?")) {
        accumulatedPayslips = [];
        localStorage.removeItem("accumulatedPayslips");
        alert("Cleared stored rows!");
    }
}

/* PDF DOWNLOAD */
async function downloadPDF() {

    const toolbar = document.getElementById("actionToolbar");
    toolbar.style.display = "none";

    const { jsPDF } = window.jspdf;
    const payslip = document.getElementById("payslipLayout");

    const canvas = await html2canvas(payslip, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
    });

    toolbar.style.display = "flex";

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "letter"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    let y = 0;

    if (imgHeight < pageHeight) {
        y = (pageHeight - imgHeight) / 2;
    }

    pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);

    let employee = (document.getElementById("empname").textContent || document.getElementById("empname").value || "").trim() || "Employee";
    let month = document.getElementById("paymonth").value.replace("PAYSLIP FOR THE MONTH OF ", "");

    pdf.save(`${employee}_${month}_Payslip.pdf`);
}

// ================== SEND PAYSLIP TO EMPLOYEE EMAIL =====================

async function sendPayslipEmail() {

    try {

        const employeeEmail =
            document.getElementById("email").value.trim();

        const employeeName = (document.getElementById("empname").textContent || document.getElementById("empname").value || "").trim() || "Employee";
        
        const associateId =
            document.getElementById("empid").value.trim();

        if (!employeeEmail) {

            alert("Please enter employee email address.");

            return;
        }

        if (!associateId) {

            alert("Associate ID is missing. Please generate the payslip first.");

            return;
        }

        const toolbar =
            document.getElementById("actionToolbar");

        toolbar.style.display = "none";

        const payslip =
            document.getElementById("payslipLayout");

        const canvas = await html2canvas(payslip, {
            scale: 1.5,
            useCORS: true,
            backgroundColor: "#ffffff"
        });

        toolbar.style.display = "flex";

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "letter"
        });

        const imgData =
            canvas.toDataURL("image/jpeg", 0.8);

        const pageWidth =
            pdf.internal.pageSize.getWidth();

        const pageHeight =
            pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth;

        const imgHeight =
            canvas.height * imgWidth / canvas.width;

        let y = 0;

        if (imgHeight < pageHeight) {
            y = (pageHeight - imgHeight) / 2;
        }

        pdf.addImage(
            imgData,
            "JPEG",
            0,
            y,
            imgWidth,
            imgHeight
        );

        // Convert PDF to Blob
        const pdfBlob = pdf.output("blob");

        // Create FormData
        const formData = new FormData();

        formData.append(
            "employeeEmail",
            employeeEmail
        );

        formData.append(
            "employeeName",
            employeeName
        );

        formData.append(
            "associateId",                              
            associateId
        );
        let startDateVal = document.getElementById("startDate").value;
        if (startDateVal) {
            let dateObj = new Date(startDateVal);
            let monthName = dateObj.toLocaleString('default', { month: 'long' });
            let year = dateObj.getFullYear();
            formData.append("payMonthYear", `${monthName}, ${year}`);
        } else {
            formData.append("payMonthYear", "this month");
        }

        formData.append(
            "pdf",
            pdfBlob,
            `${employeeName}_Payslip.pdf`
        );

        console.log(
            "PDF size:",
            (pdfBlob.size / 1024 / 1024).toFixed(2),
            "MB"
        );

        const response = await fetch(
            "https://payslip-uxinterfacely.onrender.com/send-payslip",
            {
                method: "POST",
                body: formData
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            console.error(
                "Email API Error:",
                result
            );

            alert(
                result.message ||
                "Unable to send payslip email."
            );

            return;
        }

        alert(
            `Payslip sent successfully to ${employeeEmail}`
        );

    }
    catch (error) {

        console.error(
            "Send Email Error:",
            error
        );

        alert(
            "Failed to send payslip email."
        );

        const toolbar =
            document.getElementById("actionToolbar");

        if (toolbar) {
            toolbar.style.display = "flex";
        }

    }

}

// loading excel date formats 
function formatExcelDate(value) {

    if (!value) return "";

    // Excel serial number
    if (typeof value === "number") {
        const date = XLSX.SSF.parse_date_code(value);

        return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }

    // Already yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(value))
        return value;

    // dd/mm/yyyy or dd-mm-yyyy
    let parts = value.toString().split(/[\/-]/);

    if (parts.length == 3) {

        return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;

    }

    return "";
}

/* Upload excel sheet to generate Payslip's automatically */

function loadEmployee(index) {

    if (employees.length === 0) return;

    const emp = employees[index];

    // ============= BASIC DETAILS ==================

    setValue("name", emp["Employee Name"] || "");
    setValue("AssociateID", emp["Associate ID"] || "");
    setValue("Designation", emp["Designation"] || "");
    setValue("email", emp["Email"] || "");
    setValue("Department", emp["Department"] || "");
    setValue("location", emp["Location"] || "");

    setValue("AnnualCTC", emp["Annual CTC"] || "");

    console.log("Start Date:", emp["Start Date"]);
    console.log("End Date:", emp["End Date"]);
    console.log("Join Date:", emp["Join Date"]);

    setValue("startDate", formatExcelDate(emp["Start Date"]));
    setValue("endDate", formatExcelDate(emp["End Date"]));
    setValue("JoinDate", formatExcelDate(emp["Join Date"]));

    setValue("pan", (emp["PAN"] || "").toString().trim().toUpperCase());

    // ================  VARIABLE PAY ===============

    let variable = Number(emp["Variable Pay"]) || 0;

    if (variable > 0) {

        document.getElementById("variablePay").value = "yes";
        toggleVariablePay();

        setValue("variableAmount", variable);

    } else {

        document.getElementById("variablePay").value = "no";
        toggleVariablePay();

    }

    // =========== BONUS ===========
  
    let bonus = Number(emp["Bonus"]) || 0;

    if (bonus > 0) {

        document.getElementById("Bonus").value = "yes";
        toggleBonus();

        setValue("BonusAmount", bonus);

    } else {

        document.getElementById("Bonus").value = "no";
        toggleBonus();

    }

    // ============== PF =================

    let pfEmp = Number(emp["PF Employee"]) || 0;
    let pfEmployer = Number(emp["PF Employer"]) || 0;

    if (pfEmp > 0 || pfEmployer > 0 || emp["PF"] === "yes") {

        document.getElementById("PFfield").value = "yes";
        togglePF();

    } else {

        document.getElementById("PFfield").value = "no";
        togglePF();

    }

    // =============== TDS ================

    let tds = Number(emp["TDS"]) || 0;

    if (tds > 0) {

        document.getElementById("tds").value = "yes";
        toggleTds();

        setValue("tdsAmount", tds);

    } else {

        document.getElementById("tds").value = "no";
        toggleTds();

    }

    // ================  UAN ===============

    let uan = emp["UAN"] || "";

    if (uan !== "") {

        document.getElementById("UAN").value = "yes";
        toggleUan();

        setValue("uanNumber", uan);

    } else {

        document.getElementById("UAN").value = "no";
        toggleUan();

    }

    // ================== LOP =============

    let lop = Number(emp["LOP Days"]) || 0;

    if (lop > 0) {

        document.getElementById("lopdays").value = "yes";
        toggleLop();

        setValue("LopPayField", lop);

    } else {

        document.getElementById("lopdays").value = "no";
        toggleLop();

    }

    // =============== RECALCULATE ================

    calculateDays();
    calculateSalary();

    updateNavigation();
}


// ================= SHOW GENERATED PAYSLIP =================

function showGeneratedPayslip(index) {

    if (generatedPayslips.length === 0) return;

    const p = generatedPayslips[index];

    // --> NEW: Keep the top form fields synchronized with the viewed payslip
    if (employees.length > 0) {
        currentEmployeeIndex = index; // Sync form index
        loadEmployee(index);          // Load data into top form controls
    }
    // <-- END NEW

    document.getElementById("payslipLayout").style.display = "block";
    document.getElementById("actionToolbar").style.display = "flex";

    // Header
    document.getElementById("paymonth").value = p.paymonth;

    // Employee Details
    document.getElementById("empid").value = p.empid;
    setValue("empname", p.empname); // Sync span name
    document.getElementById("designation").value = p.designation;

    document.getElementById("baseLocation").innerText = p.location;

    document.getElementById("displayPan").value = (p.pan || "").toString().toUpperCase();
    document.getElementById("joindate").value = formatDateDMY(p.joindate);
    document.getElementById("displayUan").value = p.uan;
    document.getElementById("displayAnnualCTC").value = p.annualCTC;

    // Salary Table
    document.getElementById("salaryTableBody").innerHTML = p.salaryTable;

    // Totals
    document.getElementById("totalEarnings").value =
        p.totalEarnings;

    document.getElementById("totalDeduction").value =
        p.totalDeduction;

    document.getElementById("netpay").innerText =
        p.netpay;

    document.getElementById("amountWords").innerText =
        p.amountWords;

    // Navigation text
    document.getElementById("currentEmployee").innerText =
    `Payslip ${index + 1} of ${generatedPayslips.length}`;

    document.getElementById("prevEmployee").disabled =
        index === 0;

    document.getElementById("nextEmployee").disabled =
        index === generatedPayslips.length - 1;

}

// ========= Update Navigation ==========
function updateNavigation() {

    // After Generate Payslip
    if (generatedMode) {

        document.getElementById("currentEmployee").innerText =
            `Payslip ${currentPayslipIndex + 1} of ${generatedPayslips.length}`;

        document.getElementById("prevEmployee").disabled =
            currentPayslipIndex === 0;

        document.getElementById("nextEmployee").disabled =
            currentPayslipIndex === generatedPayslips.length - 1;

    }

    // Before Generate Payslip (Excel Upload)
    else {

        document.getElementById("currentEmployee").innerText =
            `Payslip ${currentEmployeeIndex + 1} of ${employees.length}`;

        document.getElementById("prevEmployee").disabled =
            currentEmployeeIndex === 0;

        document.getElementById("nextEmployee").disabled =
            currentEmployeeIndex === employees.length - 1;

    }

}

// ============ Previous button ============
document.getElementById("prevEmployee").addEventListener("click", function () {
    if (generatedMode) {
        if (currentPayslipIndex > 0) {
            currentPayslipIndex--;
            showGeneratedPayslip(currentPayslipIndex);
            updateNavigation();
        }
    } else {
        if (currentEmployeeIndex > 0) {
            saveCurrentFormToEmployeeArray(); // <-- ADD THIS
            currentEmployeeIndex--;
            loadEmployee(currentEmployeeIndex);
        }
    }
});

// ============ Next button ============
document.getElementById("nextEmployee").addEventListener("click", function () {
    if (generatedMode) {
        if (currentPayslipIndex < generatedPayslips.length - 1) {
            currentPayslipIndex++;
            showGeneratedPayslip(currentPayslipIndex);
            updateNavigation();
        }
    } else {
        if (currentEmployeeIndex < employees.length - 1) {
            saveCurrentFormToEmployeeArray(); // <-- ADD THIS
            currentEmployeeIndex++;
            loadEmployee(currentEmployeeIndex);
        }
    }
});


// ========================= EXCEL FILE UPLOAD =================================

const excelInput = document.getElementById("excelFile");

if (excelInput) {

    excelInput.addEventListener("change", function (e) {

        const file = e.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (event) {

            const data = new Uint8Array(event.target.result);

            const workbook = XLSX.read(data, {
                type: "array"
            });

            const firstSheet = workbook.SheetNames[0];

            const worksheet = workbook.Sheets[firstSheet];

            employees = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
                .filter(emp => emp["Associate ID"] && emp["Employee Name"]);

            console.log("Employees:", employees);
            console.log("Total Employees:", employees.length);

            currentEmployeeIndex = 0;

            document.getElementById("excelCount").innerText = employees.length;
                

            if (employees.length > 0) {

                loadEmployee(0);

            } else {

                alert("No employee records found in Excel.");

            }

        };

        reader.readAsArrayBuffer(file);

    });

}

// =========== Download excel template ============
document.getElementById("downloadTemplate").addEventListener("click", downloadExcelTemplate);

function downloadExcelTemplate() {

    const template = [

        {

            "Employee Name": "",
            "Associate ID": "",
            "Designation": "",
            "Email": "",
            "Department": "",
            "Location": "",

            "Annual CTC": "",

            "Start Date": "",
            "End Date": "",
            "Join Date": "",

            "LOP Days": "",

            "PAN": "",
            "UAN": "",

            "Variable Pay": "",
            "Bonus": "",

            "PF Employee": "",
            "PF Employer": "",

            "TDS": ""

        }

    ];

    const worksheet = XLSX.utils.json_to_sheet(template);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Template");

    XLSX.writeFile(workbook, "Payslip_Employee_Template.xlsx");

}

/* INITIAL LOAD */
window.onload = function () {
    hide("variablePayAmount");
    hide("BonusAmountBox");
    hide("PFamountBox");
    hide("uanNumberBox");
    hide("tdsAmountBox");

    // Clear any cached Excel file input and count on refresh
    const excelInput = document.getElementById("excelFile");
    if (excelInput) {
        excelInput.value = "";
    }
    employees = [];
    currentEmployeeIndex = 0;
    
    const excelCountEl = document.getElementById("excelCount");
    if (excelCountEl) excelCountEl.innerText = "0";

    const currentEmployeeEl = document.getElementById("currentEmployee");
    if (currentEmployeeEl) currentEmployeeEl.innerText = "Payslip 0 of 0";
};

/* AUTO CALCULATE LISTENERS */
const autoCalculateFields = [
    "AnnualCTC", "variableAmount", "BonusAmount", "tdsAmount", "LopPayField"
];

autoCalculateFields.forEach(id => {
    let field = document.getElementById(id);
    if (field) {
        field.addEventListener("input", calculateSalary);
    }
});

function validateUan(input) {
    // Strip non-numeric characters and limit to 12 digits
    let val = input.value.replace(/[^0-9]/g, '').slice(0, 12);
    input.value = val;
    
    // Check for length and sequential strings like "1234567"
    if (val.length !== 12) {
        input.setCustomValidity("UAN must be exactly 12 digits.");
    } else if (val.includes("1234567") || /^(\d)\1{11}$/.test(val)) {
        input.setCustomValidity("Invalid UAN sequence (e.g. sequential or repeating digits).");
    } else {
        input.setCustomValidity(""); // Valid UAN
    }
}

// Helper to format any YYYY-MM-DD date to DD-MM-YYYY

function formatDateDMY(dateString) {
    if (!dateString) return "";
    
    // 1. If it's already in DD-MM-YYYY format, return it as-is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        return dateString;
    }
    
    // 2. If it is in YYYY-MM-DD format (like "2026-06-11"), swap it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        let parts = dateString.split("-");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // 3. Fallback for other formats (like Excel numbers)
    let date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Saves current form inputs back to the Excel memory array
function saveCurrentFormToEmployeeArray() {
    if (employees.length === 0) return;
    
    let emp = employees[currentEmployeeIndex];
    
    emp["Employee Name"] = getText("name");
    emp["Associate ID"] = getText("AssociateID");
    emp["Designation"] = getText("Designation");
    emp["Email"] = getText("email");
    emp["Department"] = getText("Department");
    emp["Location"] = getText("location");
    
    emp["Annual CTC"] = getValue("AnnualCTC");
    emp["Start Date"] = document.getElementById("startDate").value;
    emp["End Date"] = document.getElementById("endDate").value;
    emp["Join Date"] = document.getElementById("JoinDate").value;
    
    emp["PAN"] = getText("pan").trim().toUpperCase();
    emp["UAN"] = document.getElementById("UAN").value === "yes" ? getText("uanNumber") : "";
    emp["Variable Pay"] = document.getElementById("variablePay").value === "yes" ? getValue("variableAmount") : 0;
    emp["Bonus"] = document.getElementById("Bonus").value === "yes" ? getValue("BonusAmount") : 0;
    emp["PF Employee"] = document.getElementById("PFfield").value === "yes" ? getValue("pfEmployee") : 0;
    emp["PF Employer"] = document.getElementById("PFfield").value === "yes" ? getValue("pfEmployer") : 0;
    emp["TDS"] = document.getElementById("tds").value === "yes" ? getValue("tdsAmount") : 0;
    emp["LOP Days"] = document.getElementById("lopdays").value === "yes" ? getValue("LopPayField") : 0;
}