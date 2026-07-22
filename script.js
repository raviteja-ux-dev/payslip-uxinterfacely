/* ---------- Utility ---------- */

function getValue(id) {
    return Number(document.getElementById(id).value) || 0;
}

function getText(id) {
    return document.getElementById(id).value.trim();
}

function setValue(id, value) {
    document.getElementById(id).value = value;
}

function show(id) {
    document.getElementById(id).style.display = "block";
}

function hide(id) {
    document.getElementById(id).style.display = "none";
}

/* ============================================================
   SINGLE TABLE RENDERER (PAIRS EARNINGS & DEDUCTIONS ROW BY ROW)
============================================================ */

function renderSalaryTable(basic, hra, special, variable, bonus, pf, professionalTax, incomeTax, ) {
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

    // 2. Build list of active Deductions
    let deductionsList = [];

    if (document.getElementById("PFfield").value === "yes") {
        deductionsList.push({ label: "Provident Fund", val: pf.toFixed(2) });
    }

    deductionsList.push({ label: "Professional Tax", val: professionalTax.toFixed(2) });

    if (document.getElementById("tds").value === "yes") {
        deductionsList.push({ label: "Income Tax", val: incomeTax.toFixed(2) });
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
            <td><input value="${earn.val}" readonly></td>
            <td>${ded.label}</td>
            <td><input value="${ded.val}" readonly></td>
        `;

        tbody.appendChild(tr);
    }
}

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

function updatePF() {
    calculateSalary();
}

/* UAN */
function toggleUan() {
    let enabled = document.getElementById("UAN").value === "yes";
    if (enabled) {
        show("uanNumberBox");
    } else {
        hide("uanNumberBox");
        setValue("uanNumber", "");
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

/* GENERATE PAYSLIP */
function generatePayslip() {
    document.getElementById("payslipLayout").style.display = "block";
    document.getElementById("actionToolbar").style.display = "flex";

    updatePayslipMonth();

    setValue("empid", getText("AssociateID"));
    setValue("empname", getText("name"));
    setValue("designation", getText("Designation"));
    document.getElementById("baseLocation").innerText = getText("location");
    setValue("displayPan", getText("pan"));
    setValue("joindate", getText("JoinDate"));

    if (document.getElementById("UAN").value === "yes") {
        setValue("displayUan", getText("uanNumber"));
    } else {
        setValue("displayUan", "");
    }

    calculateDays();

    window.scrollTo({
        top: document.getElementById("payslipLayout").offsetTop,
        behavior: "smooth"
    });
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

    let pf = 0;
    if (document.getElementById("PFfield").value === "yes") {
        pf = getValue("pfEmployee") + getValue("pfEmployer");
    }

    let professionalTax = 200;

    let incomeTax = 0;
    if (document.getElementById("tds").value === "yes") {
        incomeTax = getValue("tdsAmount");
    }



    let totalDeduction = pf + professionalTax + incomeTax ;
    setValue("totalDeduction", totalDeduction.toFixed(2));

    // Render paired single table
    renderSalaryTable(basic, hra, special, variable, bonus, pf, professionalTax, incomeTax,);

    let netSalary = totalEarnings - totalDeduction;
    if (netSalary < 0) netSalary = 0;

    let formattedNetPay = netSalary.toLocaleString('en-US', {
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
        if (n < 1000000) return convert(Math.floor(n / 1000)) + " Thousand " + convert(n % 1000);
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh " + convert(n % 100000);
        return convert(Math.floor(n / 10000000)) + " Crore " + convert(n % 10000000);
    }

    return convert(num).replace(/\s+/g, " ").trim();
}

/* EXPORT / ADD CURRENT ROW TO EXCEL */
let accumulatedPayslips = JSON.parse(localStorage.getItem("accumulatedPayslips") || "[]");

function addCurrentRowToExcel() {
    let rawName = getText("name") || "Employee";
    let sanitizedName = rawName.trim().replace(/\s+/g, "_");

    let startDateVal = document.getElementById("startDate").value;
    let year = startDateVal ? new Date(startDateVal).getFullYear() : new Date().getFullYear();

    let fileName = `${sanitizedName}_${year}.xlsx`;

    let currentRowData = {
        "S.No": accumulatedPayslips.length + 1,
        "Associate ID": getText("AssociateID"),
        "Employee Name": rawName,
        "Designation": getText("Designation"),
        "Department": getText("Department"),
        "Location": getText("location"),
        "PAN": getText("pan"),
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

    const worksheet = XLSX.utils.json_to_sheet(accumulatedPayslips);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payslips");

    XLSX.writeFile(workbook, fileName);
    alert(`Row #${accumulatedPayslips.length} added to ${fileName}!`);
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
    const { jsPDF } = window.jspdf;
    const payslip = document.getElementById("payslipLayout");

    const canvas = await html2canvas(payslip, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
    });

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

    let employee = document.getElementById("empname").value || "Employee";
    let month = document.getElementById("paymonth").value.replace("PAYSLIP FOR THE MONTH OF ", "");

    pdf.save(`${employee}_${month}_Payslip.pdf`);
}

/* INITIAL LOAD */
window.onload = function () {
    hide("variablePayAmount");
    hide("BonusAmountBox");
    hide("PFamountBox");
    hide("uanNumberBox");
    hide("tdsAmountBox");
};

/* AUTO CALCULATE LISTENERS */
const autoCalculateFields = [
    "AnnualCTC", "variableAmount", "BonusAmount", "pfEmployee", "pfEmployer", "tdsAmount"
];

autoCalculateFields.forEach(id => {
    let field = document.getElementById(id);
    if (field) {
        field.addEventListener("input", calculateSalary);
    }
});