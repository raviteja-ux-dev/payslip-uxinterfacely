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

/* ========================EXCEL UPLOAD VARIABLES ==================================*/

    let employees = [];
    let currentEmployeeIndex = 0; 
    // Generated Payslips
    let generatedPayslips = [];
    let currentPayslipIndex = 0;
    let generatedMode = false;

/* ============  SINGLE TABLE RENDERER (PAIRS EARNINGS & DEDUCTIONS ROW BY ROW) ======================*/

function renderSalaryTable(basic, hra, special, variable, bonus, pf, professionalTax, TDS, ) {
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

// /* GENERATE PAYSLIP */
async function generatePayslip() {

    // If Excel is uploaded
    if (employees.length > 0) {

        generatedPayslips = [];

        for (let i = 0; i < employees.length; i++) {

            loadEmployee(i);

            updatePayslipMonth();

            setValue("empid", getText("AssociateID"));
            setValue("empname", getText("name"));
            setValue("designation", getText("Designation"));

            document.getElementById("baseLocation").innerText =
                getText("location");

            setValue("displayPan", getText("pan"));
            setValue("joindate", getText("JoinDate"));

            if (document.getElementById("UAN").value === "yes") {

                setValue("displayUan", getText("uanNumber"));

            } else {

                setValue("displayUan", "");

            }

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
                pan: getText("pan"),
                joindate: document.getElementById("JoinDate").value,
                uan: getText("uanNumber"),

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

    setValue("displayPan", getText("pan"));
    setValue("joindate", getText("JoinDate"));

    if (document.getElementById("UAN").value === "yes") {

        setValue("displayUan", getText("uanNumber"));

    } else {

        setValue("displayUan", "");

    }

    calculateDays();
    calculateSalary();

    await saveEmployeeToDatabase();

    window.scrollTo({
        top: document.getElementById("payslipLayout").offsetTop,
        behavior: "smooth"
    });

}

// =========Generate all payslips at a time =============
async function generateAllPayslips() {

    if (employees.length === 0) {
        alert("Please upload an Excel file.");
        return;
    }

    generatedPayslips = [];

    for (let i = 0; i < employees.length; i++) {

        currentEmployeeIndex = i;

        loadEmployee(i);

        await generatePayslip();

        generatedPayslips.push({

            empid: document.getElementById("empid").value,
            empname: document.getElementById("empname").value,
            designation: document.getElementById("designation").value,
            location: document.getElementById("baseLocation").innerText,
            pan: document.getElementById("displayPan").value,
            uan: document.getElementById("displayUan").value,
            joinDate: document.getElementById("joindate").value,

            salaryHTML:
                document.getElementById("salaryTableBody").innerHTML,

            totalEarnings:
                document.getElementById("totalEarnings").value,

            totalDeduction:
                document.getElementById("totalDeduction").value,

            netPay:
                document.getElementById("netpay").innerText,

            words:
                document.getElementById("amountWords").innerText,

            payMonth:
                document.getElementById("paymonth").value

        });

    }

    currentPayslipIndex = 0;

    showGeneratedPayslip(0);

    alert("All payslips generated successfully.");

}

// =================== show generated payslip =============

function showGeneratedPayslip(index) {

    if (generatedPayslips.length === 0) return;

    let p = generatedPayslips[index];

    document.getElementById("paymonth").value = p.payMonth;

    document.getElementById("empid").value = p.empid;
    document.getElementById("empname").value = p.empname;
    document.getElementById("designation").value = p.designation;

    document.getElementById("baseLocation").innerText = p.location;

    document.getElementById("displayPan").value = p.pan;
    document.getElementById("displayUan").value = p.uan;

    document.getElementById("joindate").value = p.joinDate;

    document.getElementById("salaryTableBody").innerHTML = p.salaryHTML;

    document.getElementById("totalEarnings").value = p.totalEarnings;
    document.getElementById("totalDeduction").value = p.totalDeduction;

    document.getElementById("netpay").innerText = p.netPay;

    document.getElementById("amountWords").innerText = p.words;

}

/* ========== save employee  to database ========*/
async function saveEmployeeToDatabase() {

    // ============= Employee Master =============
   

    const employee = {

        associate_id: getText("AssociateID"),
        employee_name: getText("name"),
        designation: getText("Designation"),
        department: getText("Department"),
        location: getText("location"),

        pan: getText("pan"),
        uan: getText("uanNumber"),
        gst: getText("gst"),

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

    // ==========================
    // Payslip
    // ==========================

    let start = new Date(document.getElementById("startDate").value);

    const payslip = {

        associate_id: getText("AssociateID"),

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

    let TDS = 0;
    if (document.getElementById("tds").value === "yes") {
        TDS = getValue("tdsAmount");
    }

    let totalDeduction = pf + professionalTax + TDS ;
    setValue("totalDeduction", totalDeduction.toFixed(2));

    // Render paired single table
    renderSalaryTable(basic, hra, special, variable, bonus, pf, professionalTax, TDS,);

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

    let employee = document.getElementById("empname").value || "Employee";
    let month = document.getElementById("paymonth").value.replace("PAYSLIP FOR THE MONTH OF ", "");

    pdf.save(`${employee}_${month}_Payslip.pdf`);
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
    setValue("Department", emp["Department"] || "");
    setValue("location", emp["Location"] || "");

    setValue("AnnualCTC", emp["Annual CTC"] || "");

    console.log("Start Date:", emp["Start Date"]);
    console.log("End Date:", emp["End Date"]);
    console.log("Join Date:", emp["Join Date"]);

    setValue("startDate", formatExcelDate(emp["Start Date"]));
    setValue("endDate", formatExcelDate(emp["End Date"]));
    setValue("JoinDate", formatExcelDate(emp["Join Date"]));

    setValue("pan", emp["PAN"] || "");

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

    if (pfEmp > 0 || pfEmployer > 0) {

        document.getElementById("PFfield").value = "yes";
        togglePF();

        setValue("pfEmployee", pfEmp);
        setValue("pfEmployer", pfEmployer);

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

    document.getElementById("payslipLayout").style.display = "block";
    document.getElementById("actionToolbar").style.display = "flex";

    // Header
    document.getElementById("paymonth").value = p.paymonth;

    // Employee Details
    document.getElementById("empid").value = p.empid;
    document.getElementById("empname").value = p.empname;
    document.getElementById("designation").value = p.designation;

    document.getElementById("baseLocation").innerText = p.location;

    document.getElementById("displayPan").value = p.pan;
    document.getElementById("joindate").value = p.joindate;
    document.getElementById("displayUan").value = p.uan;

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

    // Viewing generated payslips
    if (generatedMode) {

        if (currentPayslipIndex > 0) {

            currentPayslipIndex--;

            showGeneratedPayslip(currentPayslipIndex);

            updateNavigation();

        }

    }

    // Viewing uploaded Excel
    else {

        if (currentEmployeeIndex > 0) {

            currentEmployeeIndex--;

            loadEmployee(currentEmployeeIndex);

        }

    }

});


// ============ Next button ============
document.getElementById("nextEmployee").addEventListener("click", function () {

    // Viewing generated payslips
    if (generatedMode) {

        if (currentPayslipIndex < generatedPayslips.length - 1) {

            currentPayslipIndex++;

            showGeneratedPayslip(currentPayslipIndex);

            updateNavigation();

        }

    }

    // Viewing uploaded Excel
    else {

        if (currentEmployeeIndex < employees.length - 1) {

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

            employees = XLSX.utils.sheet_to_json(worksheet, {
                defval: ""
            });

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