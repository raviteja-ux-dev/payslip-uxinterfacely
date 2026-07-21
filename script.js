

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

function showTable(id) {
    document.getElementById(id).style.display = "table-cell";
}

function hideTable(id) {
    document.getElementById(id).style.display = "none";
}

// payslip-month
    function updatePayslipMonth() {

    let startDate = document.getElementById("startDate").value;

    if (!startDate) return;

    let date = new Date(startDate);

    const months = [
        "JANUARY",
        "FEBRUARY",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUGUST",
        "SEPTEMBER",
        "OCTOBER",
        "NOVEMBER",
        "DECEMBER"
    ];

    let month = months[date.getMonth()];
    let year = date.getFullYear();

    setValue(
        "paymonth",
        `PAYSLIP FOR THE MONTH OF ${month} ${year}`
    );
}

//   VARIABLE PAY
function toggleVariablePay() {

    let enabled =
        document.getElementById("variablePay").value === "yes";

    if (enabled) {

        show("variablePayAmount");
        document.getElementById("variableRow").style.display = "table-row";
    } else {

        hide("variablePayAmount");
       document.getElementById("variableRow").style.display = "none";

        setValue("variableAmount", "");
        setValue("variableDisplay", "");
    }

    calculateSalary();
}

function updateVariablePay() {
    let amount = getValue("variableAmount");
    setValue("variableDisplay", amount.toFixed(2));
    calculateSalary();
}

/*  BONUS  */
  
function toggleBonus() {
    let enabled =
        document.getElementById("Bonus").value === "yes";

    if (enabled) {

        show("BonusAmountBox");
        document.getElementById("bonusRow").style.display = "table-row";

    } else {

        hide("BonusAmountBox");
       document.getElementById("bonusRow").style.display = "none";

        setValue("BonusAmount", "");
        setValue("bonusDisplay", "");
    }

    calculateSalary();
}

function updateBonus() {

    let amount = getValue("BonusAmount");

    setValue("bonusDisplay", amount.toFixed(2));

    calculateSalary();
}

/*    PROVIDENT FUND */
 
function togglePF() {

    let enabled = document.getElementById("PFfield").value === "yes";

    if (enabled) {
        show("PFamountBox");
        document.getElementById("pfRow").style.display = "table-row";
    } else {
        hide("PFamountBox");
        document.getElementById("pfRow").style.display = "none";

        setValue("pfEmployee", "");
        setValue("pfEmployer", "");
        setValue("displayPF", "");
    }

    calculateSalary();
}

function updatePF() {

    let employee = getValue("pfEmployee");
    let employer = getValue("pfEmployer");

    let totalPF = employee + employer;

    setValue("displayPF", totalPF.toFixed(2));

    calculateSalary();
}
/* ========= Uan =============*/

function toggleUan() {

    let enabled =
        document.getElementById("UAN").value === "yes";

    if (enabled) {

        show("uanNumberBox");

    } else {

        hide("uanNumberBox");

        setValue("uanNumber", "");
    }
}

/* ================== Lop ==================*/
   
 function toggleLop() {

    let enabled =
        document.getElementById("lopdays").value === "yes";

    if (enabled) {

        show("Loppaydbox");

    } else {

        hide("Loppaydbox");

        setValue("LopPayField", 0);

    }

    calculateDays();
    calculateSalary();
}

function updatelop(){

    calculateDays();

}

/* ======================= ADDRESS =====================================*/
   
function toggleAddress() {

    let enabled =
        document.getElementById("address").value === "yes";

    if (enabled) {

        show("addDetailsBox");

    } else {

        hide("addDetailsBox");

        setValue("addDetails", "");
    }
}

/* =====================  TDS  =============================*/

function toggleTds() {
    let enabled =
        document.getElementById("tds").value === "yes";

    if (enabled) {

        show("tdsAmountBox");

    } else {

        hide("tdsAmountBox");

        setValue("tdsAmount", "");
    }

    calculateSalary();
}

/* ==========================- DAYS CALCULATION  ================================= */
   


// function calculateDays() {

//     let start =
//         new Date(document.getElementById("startDate").value);

//     let end =
//         new Date(document.getElementById("endDate").value);

//     if (isNaN(start) || isNaN(end))
//         return;

//     let days =
//         Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

//     if (days < 0)
//         days = 0;

//     setValue("DaysPayable", days);
//     setValue("DaysWorked", days);

//     let totalDaysInMonth =
//         new Date(
//             start.getFullYear(),
//             start.getMonth() + 1,
//             0
//         ).getDate();

//     calculateLOP(totalDaysInMonth);
// }

function calculateDays() {

    let start = new Date(document.getElementById("startDate").value);
    let end = new Date(document.getElementById("endDate").value);

    if (isNaN(start) || isNaN(end)) return;

    let days =
        Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (days < 0) days = 0;

    // Days Payable
    setValue("DaysPayable", days);

    let workedDays = days;

    // LOP
    if (document.getElementById("lopdays").value === "yes") {

        let lopDays = getValue("LopPayField");

        if (lopDays > days) {
            lopDays = days;
            setValue("LopPayField", lopDays);
        }

        workedDays = days - lopDays;
    }

    // Days Worked
    setValue("DaysWorked", workedDays);

    // Recalculate salary
    calculateSalary();
}

/* ============================================================
   LOSS OF PAY
============================================================ */

function calculateLOP() {

    let payable = getValue("DaysPayable");
    let worked = getValue("DaysWorked");

    let lop = payable - worked;

    if (lop < 0) {
        lop = 0;
    }

    setValue("LopPayField", lop);
}

/* ============================================================
   GENERATE PAYSLIP
============================================================ */

function generatePayslip() {

    // Show Payslip Layout

    document.getElementById("payslipLayout").style.display = "block";
    updatePayslipMonth();

    /* --------------------------------------------------------
       Employee Details
    --------------------------------------------------------- */

    setValue("empid", getText("AssociateID"));

    setValue("empname", getText("name"));

    setValue("designation", getText("Designation"));

    document.getElementById("baseLocation").innerText =
        getText("location");

    setValue("displayPan", getText("pan"));

    setValue("joindate", getText("JoinDate"));


    /*
       UAN
     */

    if (document.getElementById("UAN").value === "yes") {

        setValue(
            "displayUan",
            getText("uanNumber")
        );

    } else {

        setValue("displayUan", "");
    }


    /* =================== Address (Optional) ============== */
       
    if (document.getElementById("address").value === "yes") {

        let address = getText("addDetails");

        // Add later if address is displayed in payslip

        console.log(address);

    }
   /* ============= Working days =============*/

    calculateDays();
    /* ================= Scroll to Payslip ============= */

    window.scrollTo({
        top:
        document.getElementById("payslipLayout").offsetTop,

        behavior: "smooth"

    });

}

/* ====================== SALARY CALCULATION ====================================== */

function calculateSalary() {

    /* =============  Annual CTC → Monthly CTC ===============*/

    let annualCTC = getValue("AnnualCTC");
    let monthlyCTC = annualCTC / 12;

    /* ===========  Days =================*/      
    let payableDays = getValue("DaysPayable");
    let workedDays = getValue("DaysWorked");

    let startDate = document.getElementById("startDate").value;

    if (startDate && payableDays > 0) {

        let date = new Date(startDate);

        let totalMonthDays = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0
        ).getDate();

        let perDaySalary = monthlyCTC / totalMonthDays;

        monthlyCTC = perDaySalary * workedDays;

    } else {

        monthlyCTC = 0;
    }

    /* ============================
       Salary Split
    ============================ */

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

    if (special < 0) {
        special = 0;
    }

    /* ============================
       Earnings
    ============================ */

    setValue("basicsalary", basic.toFixed(2));
    setValue("hra", hra.toFixed(2));
    setValue("specialallowance", special.toFixed(2));
    setValue("variableDisplay", variable.toFixed(2));
    setValue("bonusDisplay", bonus.toFixed(2));

    let totalEarnings =
        basic +
        hra +
        special +
        variable +
        bonus;

    setValue("totalEarnings", totalEarnings.toFixed(2));

    /* ============================
       Deductions
    ============================ */

    let pf = 0;

    if (document.getElementById("PFfield").value === "yes") {

        pf =
            getValue("pfEmployee") +
            getValue("pfEmployer");

    }

    setValue("displayPF", pf.toFixed(2));

    let professionalTax = 200;
    setValue("proftax", professionalTax.toFixed(2));

    let incomeTax = 0;

    if (document.getElementById("tds").value === "yes") {
        incomeTax = getValue("tdsAmount");
    }

    setValue("incometax", incomeTax.toFixed(2));

    let welfare = 100;
    setValue("welfare", welfare.toFixed(2));

    let totalDeduction =
        pf +
        professionalTax +
        incomeTax +
        welfare;

    setValue("totalDeduction", totalDeduction.toFixed(2));

    /* ============================
       Net Salary
    ============================ */

    let netSalary =
        totalEarnings -
        totalDeduction;

    if (netSalary < 0) {
        netSalary = 0;
    }

    document.getElementById("netpay").innerText =
        netSalary.toFixed(2);

    document.getElementById("amountWords").innerText =
        numberToWords(Math.round(netSalary));
}
// latest function calculateSalary() {

//     /* -----------------------------
//        Monthly CTC
//     ------------------------------ */

//     let annualCTC = getValue("AnnualCTC");

//     let monthlyCTC = annualCTC / 12;


//     /* -----------------------------
//        Salary based on Days Payable
//     ------------------------------ */

//     let startDate = document.getElementById("startDate").value;

//     let daysPayable = getValue("DaysPayable");

//     if (startDate && daysPayable > 0) {

//         let date = new Date(startDate);

//         let totalDaysInMonth = new Date(
//             date.getFullYear(),
//             date.getMonth() + 1,
//             0
//         ).getDate();

//         let perDaySalary = monthlyCTC / totalDaysInMonth;

//         monthlyCTC = perDaySalary * daysPayable;
//     }


//     /* -----------------------------
//        Earnings
//     ------------------------------ */

//     let basic = monthlyCTC * 0.50;

//     let hra = monthlyCTC * 0.20;


//     /* -----------------------------
//        Variable Pay
//     ------------------------------ */

//     let variable = 0;

//     if (document.getElementById("variablePay").value === "yes") {

//         variable = getValue("variableAmount");

//     }


//     /* -----------------------------
//        Bonus
//     ------------------------------ */

//     let bonus = 0;

//     if (document.getElementById("Bonus").value === "yes") {

//         bonus = getValue("BonusAmount");

//     }


//     /* -----------------------------
//        Special Allowance
//     ------------------------------ */

//     let special =
//         monthlyCTC -
//         basic -
//         hra -
//         variable;

//     if (special < 0) {

//         special = 0;

//     }


//     /* -----------------------------
//        Update Earnings Table
//     ------------------------------ */

//     setValue(
//         "basicsalary",
//         basic.toFixed(2)
//     );

//     setValue(
//         "hra",
//         hra.toFixed(2)
//     );

//     setValue(
//         "specialallowance",
//         special.toFixed(2)
//     );

//     setValue(
//         "variableDisplay",
//         variable.toFixed(2)
//     );

//     setValue(
//         "bonusDisplay",
//         bonus.toFixed(2)
//     );


//     /* -----------------------------
//        Total Earnings
//     ------------------------------ */

//     let totalEarnings =
//         basic +
//         hra +
//         special +
//         variable +
//         bonus;

//     setValue(
//         "totalEarnings",
//         totalEarnings.toFixed(2)
//     );


//     /* =======================================================
//        DEDUCTIONS
//     ======================================================== */

//     /* -----------------------------
//        Provident Fund
//     ------------------------------ */

//     let pf = 0;

//     if (document.getElementById("PFfield").value === "yes") {

//         pf = getValue("pffund");

//     }

//     setValue(
//         "displayPF",
//         pf.toFixed(2)
//     );


//     /* -----------------------------
//        Professional Tax
//     ------------------------------ */

//     let professionalTax = 200;

//     setValue(
//         "proftax",
//         professionalTax.toFixed(2)
//     );


//     /* -----------------------------
//        Income Tax (TDS)
//     ------------------------------ */

//     let incomeTax = 0;

//     if (document.getElementById("tds").value === "yes") {

//         incomeTax = getValue("tdsAmount");

//     }

//     setValue(
//         "incometax",
//         incomeTax.toFixed(2)
//     );


//     /* -----------------------------
//        Employee Welfare
//     ------------------------------ */

//     let welfare = 100;

//     setValue(
//         "welfare",
//         welfare.toFixed(2)
//     );


//     /* -----------------------------
//        Total Deductions
//     ------------------------------ */

//     let totalDeduction =
//         pf +
//         professionalTax +
//         incomeTax +
//         welfare;

//     setValue(
//         "totalDeduction",
//         totalDeduction.toFixed(2)
//     );


//     /* -----------------------------
//        Net Salary
//     ------------------------------ */

//     let netSalary =
//         totalEarnings -
//         totalDeduction;

//     if (netSalary < 0) {

//         netSalary = 0;

//     }

//     document.getElementById("netpay").innerText =
//         netSalary.toFixed(2);


//     /* -----------------------------
//        Amount in Words
//     ------------------------------ */

//     document.getElementById("amountWords").innerText =
//         numberToWords(
//             Math.round(netSalary)
//         );
// }
// old function calculateSalary() {

//     /* -----------------------------
//        Monthly CTC
//     ------------------------------ */

//     let annualCTC = getValue("AnnualCTC");

//     let monthlyCTC = annualCTC / 12;

//     // Days
//     let daysWorked = getValue("DaysWorked");

//     let totalDays = new Date(
//         new Date().getFullYear(),
//         new Date().getMonth() + 1,
//         0
//     ).getDate();

//     // Per-day salary
//     let perDaySalary = monthlyCTC / totalDays;

//     // Adjust salary based on worked days
//     monthlyCTC = perDaySalary * daysWorked;

//     /* -----------------------------
//        Earnings
//     ------------------------------ */

//     let basic = monthlyCTC * 0.50;

//     let hra = monthlyCTC * 0.20;


//     /* -----------------------------
//        Variable Pay
//     ------------------------------ */

//     let variable = 0;

//     if (document.getElementById("variablePay").value === "yes") {

//         variable = getValue("variableAmount");

//     }


//     /* -----------------------------
//        Bonus
//     ------------------------------ */

//     let bonus = 0;

//     if (document.getElementById("Bonus").value === "yes") {

//         bonus = getValue("BonusAmount");

//     }


//     /* -----------------------------
//        Special Allowance
//     ------------------------------ */

//     let special =
//         monthlyCTC -
//         basic -
//         hra -
//         variable;

//     // Prevent negative allowance

//     if (special < 0) {

//         special = 0;

//     }


//     /* -----------------------------
//        Update Earnings Table
//     ------------------------------ */

//     setValue(
//         "basicsalary",
//         basic.toFixed(2)
//     );

//     setValue(
//         "hra",
//         hra.toFixed(2)
//     );

//     setValue(
//         "specialallowance",
//         special.toFixed(2)
//     );

//     setValue(
//         "variableDisplay",
//         variable.toFixed(2)
//     );

//     setValue(
//         "bonusDisplay",
//         bonus.toFixed(2)
//     );


//     /* -----------------------------
//        Total Earnings
//     ------------------------------ */

//     let totalEarnings =
//         basic +
//         hra +
//         special +
//         variable +
//         bonus;

//     setValue(
//         "totalEarnings",
//         totalEarnings.toFixed(2)
//     );


//     /* =======================================================
//        DEDUCTIONS
//     ======================================================== */


//     /* -----------------------------
//        PF
//     ------------------------------ */

//     let pf = 0;

//     if (document.getElementById("PFfield").value === "yes") {

//         pf = getValue("pfEmployee") + getValue("pfEmployer");

//         document.getElementById("pfRow").style.display = "table-row";

//         setValue("displayPF", pf.toFixed(2));

//     } else {

//         document.getElementById("pfRow").style.display = "none";

//         setValue("displayPF", "");
//     }

//     /* -----------------------------
//        Professional Tax
//     ------------------------------ */

//     let professionalTax = 200;

//     setValue(
//         "proftax",
//         professionalTax.toFixed(2)
//     );


//     /* -----------------------------
//        Income Tax (TDS)
//     ------------------------------ */

//     let incomeTax = 0;

//     if (document.getElementById("tds").value === "yes") {

//         incomeTax = getValue("tdsAmount");

//     }

//     setValue(
//         "incometax",
//         incomeTax.toFixed(2)
//     );


//     /* -----------------------------
//        Welfare
//     ------------------------------ */

//     let welfare = 100;

//     setValue(
//         "welfare",
//         welfare.toFixed(2)
//     );


//     /* -----------------------------
//        Total Deductions
//     ------------------------------ */

//     let totalDeduction =
//         pf +
//         professionalTax +
//         incomeTax +
//         welfare;

//     setValue(
//         "totalDeduction",
//         totalDeduction.toFixed(2)
//     );


//     /* -----------------------------
//        Net Salary
//     ------------------------------ */

//     let netSalary =
//         totalEarnings -
//         totalDeduction;

//     if (netSalary < 0) {

//         netSalary = 0;

//     }

//     document.getElementById("netpay").innerText =
//         netSalary.toFixed(2);


//     /* -----------------------------
//        Amount in Words
//     ------------------------------ */

//     document.getElementById("amountWords").innerText =
//         numberToWords(
//             Math.round(netSalary)
//         );

// }


/* ============================================================
   NUMBER TO WORDS
============================================================ */

function numberToWords(num) {

    if (num === 0) {
        return "Zero Rupees Only";
    }

    const ones = [
        "", "One", "Two", "Three", "Four",
        "Five", "Six", "Seven", "Eight",
        "Nine", "Ten", "Eleven", "Twelve",
        "Thirteen", "Fourteen", "Fifteen",
        "Sixteen", "Seventeen", "Eighteen",
        "Nineteen"
    ];

    const tens = [
        "", "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety"
    ];

    function convert(n) {

        if (n < 20)
            return ones[n];

        if (n < 100)
            return tens[Math.floor(n / 10)] + " " + ones[n % 10];

        if (n < 1000)
            return ones[Math.floor(n / 100)] +
                " Hundred " +
                convert(n % 100);

        if (n < 100000)
            return convert(Math.floor(n / 1000)) +
                " Thousand " +
                convert(n % 1000);

        if (n < 10000000)
            return convert(Math.floor(n / 100000)) +
                " Lakh " +
                convert(n % 100000);

        return convert(Math.floor(n / 10000000)) +
            " Crore " +
            convert(n % 10000000);

    }

    return convert(num).replace(/\s+/g, " ").trim() + " Rupees Only";

}


/* ============================================================
   PRINT / PDF
============================================================ */

async function downloadPDF() {

    const { jsPDF } = window.jspdf;

    const payslip = document.getElementById("payslipLayout");

    const canvas = await html2canvas(payslip, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");

    // US Letter Landscape
    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "letter"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();   // 279.4
    const pageHeight = pdf.internal.pageSize.getHeight(); // 215.9

    const imgWidth = pageWidth;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    // Center vertically if image is shorter
    let y = 0;
    if (imgHeight < pageHeight) {
        y = (pageHeight - imgHeight) / 2;
    }

    pdf.addImage(
        imgData,
        "PNG",
        0,
        y,
        imgWidth,
        imgHeight
    );

    let employee = document.getElementById("empname").value || "Employee";

    let month = document.getElementById("paymonth").value
        .replace("PAYSLIP FOR THE MONTH OF ", "");

    pdf.save(`${employee}_${month}_Payslip.pdf`);
}

// async function downloadPDF() {

//     const { jsPDF } = window.jspdf;

//     const payslip = document.getElementById("payslipLayout");

//     const canvas = await html2canvas(payslip, {
//         scale: 2,
//         useCORS: true,
//         backgroundColor: "#ffffff"
//     });

//     const imgData = canvas.toDataURL("image/png");

//     const pdf = new jsPDF("p", "mm", "a4");

//     const pdfWidth = 210;
//     const pdfHeight = 297;

//     const imgWidth = pdfWidth;
//     const imgHeight = canvas.height * imgWidth / canvas.width;

//     pdf.addImage(
//         imgData,
//         "PNG",
//         0,
//         0,
//         imgWidth,
//         imgHeight
//     );

//     let employee =
//         document.getElementById("empname").value || "Employee";

//     let month =
//         document.getElementById("paymonth").value
//         .replace("PAYSLIP FOR THE MONTH OF ", "");

//     pdf.save(employee + "_" + month + "_Payslip.pdf");

// }


/* ============================================================
   INITIAL PAGE LOAD
============================================================ */

window.onload = function () {

    hide("variablePayAmount");

    hide("BonusAmountBox");

    hide("PFamountBox");

    hide("uanNumberBox");

    hide("addDetailsBox");

    hide("tdsAmountBox");

    document.getElementById("pfRow").style.display = "none";

    hideTable("variableHead");

    hideTable("variableCell");

    hideTable("bonusHead");

    hideTable("bonusCell");
};

/* ============================================================
   AUTO CALCULATE
============================================================ */

const autoCalculateFields = [

    "AnnualCTC",

    "variableAmount",

    "BonusAmount",

    "pfEmployee",

    "pfEmployer",

    "tdsAmount"

];

autoCalculateFields.forEach(id => {

    let field = document.getElementById(id);

    if (field) {

        field.addEventListener("input", calculateSalary);

    }

});


/* ============================================================
   OPTIONAL
============================================================ */

/*
Future Features

✔ ESI
✔ Gratuity
✔ Leave Encashment
✔ Incentives
✔ Overtime
✔ Arrears
✔ Reimbursements
✔ Professional Tax by State
✔ Income Tax Slabs
✔ Export Excel
✔ Download PDF using jsPDF
✔ Email Payslip

*/