const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");
const muhammara = require("muhammara");
const fs = require("fs");
const os = require("os");
const path = require("path");

const app = express();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

app.use(cors());
app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);


// ============ Generate password from name + associate ID ==============

function generatePayslipPassword(employeeName, associateId) {

    const namePart = employeeName
        .replace(/\s+/g, "")
        .substring(0, 4)
        .toUpperCase();

    return `${namePart}${associateId}`;

}


// ============ Password-protect a PDF buffer ==============

function protectPdfBuffer(buffer, password) {

    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `payslip-in-${Date.now()}.pdf`);
    const outputPath = path.join(tmpDir, `payslip-out-${Date.now()}.pdf`);

    fs.writeFileSync(inputPath, buffer);

    muhammara.recrypt(inputPath, outputPath, {
        userPassword: password,
        ownerPassword: password,
        userProtectionFlag: 4
    });

    const protectedBuffer = fs.readFileSync(outputPath);

    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    return protectedBuffer;

}


// ================== Test Route =====================

app.get("/", (req, res) => {
    res.send("Payslip API Running...");
});


// ================== Test Employees =====================

app.get("/test", async (req, res) => {

    const { data, error } = await supabase
        .from("employees")
        .select("*");

    if (error) {
        return res.status(500).json(error);
    }

    res.json(data);
});


// ================= Employee Master ======================
// Insert if new Update if Associate ID already exists

app.post("/employee", async (req, res) => {

    try {

        const employee = req.body;

        const { data, error } = await supabase
            .from("employees")
            .upsert(employee, {
                onConflict: "associate_id"
            })
            .select();

        if (error) {
            console.error(error);
            return res.status(500).json(error);
        }

        res.json({
            success: true,
            message: "Employee saved successfully",
            data
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


// ================ One Payslip per Month per Employee =======================

app.post("/payslip", async (req, res) => {

    try {

        const payslip = req.body;

        const { data, error } = await supabase
            .from("payslips")
            .upsert(payslip, {
                onConflict: "associate_id,pay_month,pay_year"
            })
            .select();

        if (error) {
            console.error(error);
            return res.status(500).json(error);
        }

        res.json({
            success: true,
            message: "Payslip saved successfully",
            data
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


// =======================================
// View Payslips
// =======================================

app.get("/payslips", async (req, res) => {

    const { data, error } = await supabase
        .from("payslips")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json(error);
    }

    res.json(data);
});


// ================== Employee Payslip History =====================

app.get("/payslips/:associateId", async (req, res) => {

    try {

        const associateId =
            req.params.associateId.trim().toUpperCase();

        // Get payslips
        const { data: payslips, error: payslipError } =
            await supabase
                .from("payslips")
                .select("*")
                .eq("associate_id", associateId)
                .order("pay_year", { ascending: false })
                .order("created_at", { ascending: false });

        if (payslipError) {
            console.error(payslipError);
            return res.status(500).json(payslipError);
        }

        // Get employee details
        const { data: employee, error: employeeError } =
            await supabase
                .from("employees")
                .select("employee_name, designation")
                .eq("associate_id", associateId)
                .single();

        if (employeeError) {
            console.error(employeeError);
            return res.status(500).json(employeeError);
        }

        // Add employee details to every payslip
        const result = payslips.map(p => ({
            ...p,
            employee_name: employee.employee_name,
            designation: employee.designation
        }));

        res.json(result);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


// ================== View Employees =====================

app.get("/employees", async (req, res) => {

    const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("employee_name");

    if (error) {
        return res.status(500).json(error);
    }

    res.json(data);
});


// ================== Get Single Payslip + Employee Details =====================

app.get("/payslip/:id", async (req, res) => {

    try {

        // ------------ Get Payslip -------------

        const { data: payslip, error: payslipError } =
            await supabase
                .from("payslips")
                .select("*")
                .eq("id", req.params.id)
                .single();

        if (payslipError) {
            return res.status(500).json(payslipError);
        }

        // ------------- Get Employee ------------

        const { data: employee, error: employeeError } =
            await supabase
                .from("employees")
                .select("*")
                .eq("associate_id", payslip.associate_id)
                .single();

        if (employeeError) {
            return res.status(500).json(employeeError);
        }

        // ------------- Merge both objects ------------

        const result = {
            ...employee,
            ...payslip
        };

        res.json(result);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});

// ================== Send Payslip Email =====================

app.post(
    "/send-payslip",
    upload.single("pdf"),
    async (req, res) => {

        try {

            const employeeEmail =
                req.body.employeeEmail;

            const employeeName =
                req.body.employeeName || "Employee";

            const associateId =
                req.body.associateId;

            const pdfFile =
                req.file;


            // ============ Validate email ==============

            if (!employeeEmail) {

                return res.status(400).json({
                    success: false,
                    message: "Employee email is required"
                });

            }


            // =========== Validate PDF ===============

            if (!pdfFile) {

                return res.status(400).json({
                    success: false,
                    message: "Payslip PDF is required"
                });

            }


            // =========== Validate associate ID ===============

            if (!associateId) {

                return res.status(400).json({
                    success: false,
                    message: "Associate ID is required"
                });

            }


            console.log(
                "Sending payslip to:",
                employeeEmail
            );

            console.log(
                "PDF size:",
                pdfFile.size,
                "bytes"
            );


            // ============ Password-protect the PDF ==============

            const payslipPassword =
                generatePayslipPassword(employeeName, associateId);

            const protectedPdfBuffer =
                protectPdfBuffer(pdfFile.buffer, payslipPassword);


            // ============ Send Email using Resend ==============

            const emailResult =
                await resend.emails.send({

                    from:
                        process.env.RESEND_FROM_EMAIL,

                    to: [employeeEmail],

                    subject:
                        `Payslip - ${employeeName}`,

                    html: `
                        <div style="
                            font-family: Arial, sans-serif;
                            color: #333333;
                            width: 100%;
                            max-width: 600px;
                            margin: 0;
                            padding: 0;
                            text-align: left;
                        ">

                            <!-- Greeting -->

                            <p style="
                                margin: 0 0 20px 0;
                                padding: 0;
                                text-align: left;
                            ">
                                Dear ${employeeName},
                            </p>


                            <!-- Introduction -->

                            <p style="
                                margin: 0 0 20px 0;
                                padding: 0;
                                text-align: left;
                                line-height: 1.5;
                            ">
                                Welcome to another pay cycle! We're pleased to share
                                your payslip for this month. Please find it attached
                                as a PDF to this email.
                            </p>


                            <!-- Password Information -->

                            <p style="
                                margin: 0 0 20px 0;
                                padding: 0;
                                text-align: left;
                                line-height: 1.5;
                            ">
                                This PDF is password protected. To open it, use the
                                first 4 letters of your name (in capital letters)
                                followed by your Associate ID.
                            </p>


                            <!-- Discrepancy Information -->

                            <p style="
                                margin: 0 0 20px 0;
                                padding: 0;
                                text-align: left;
                                line-height: 1.5;
                            ">
                                If you notice any discrepancy in the amounts or
                                details, please reach out to the Payroll team at
                                the earliest so we can look into it.
                            </p>


                            <!-- Thank You -->

                            <p style="
                                margin: 0 0 20px 0;
                                padding: 0;
                                text-align: left;
                                line-height: 1.5;
                            ">
                                Thank you for your continued hard work and
                                dedication.
                            </p>


                            <!-- Regards -->

                            <p style="
                                margin: 0;
                                padding: 0;
                                text-align: left;
                                line-height: 1.5;
                            ">
                                Regards,<br>
                                Payroll Team
                            </p>


                            <!-- Company Logo -->

                            <div style="
                                margin-top: 20px;
                                padding: 0;
                                text-align: left;
                                margin-left: 0;
                            ">

                                <img
                                    src="${process.env.COMPANY_LOGO_URL}"
                                    alt="Company Logo"
                                    width="150"
                                    style="
                                        display: block;
                                        width: 100px;
                                        max-width: 150px;
                                        height: auto;
                                        border: 0;
                                        outline: none;
                                        text-decoration: none;
                                    "
                                >

                            </div>


                            <!-- Footer Disclaimer -->

                            <p style="
                                margin: 20px 0 0 0;
                                padding: 0;
                                font-size: 12px;
                                color: #999999;
                                text-align: left;
                                line-height: 1.4;
                            ">
                                This is a computer-generated email.
                                Please do not reply directly.
                            </p>

                        </div>
                    `,


                    // ============ PDF Attachment ============

                    attachments: [

                        {
                            filename:
                                `${employeeName}_Payslip.pdf`,

                            content:
                                protectedPdfBuffer
                        }

                    ]

                });


            console.log(
                "Resend result:",
                emailResult
            );


            // ============ Resend Error ============

            if (emailResult.error) {

                console.error(
                    "Resend error:",
                    emailResult.error
                );

                return res.status(500).json({

                    success: false,

                    message:
                        emailResult.error.message ||
                        "Failed to send email"

                });

            }


            // ==========================
            // Success
            // ==========================

            res.json({

                success: true,

                message:
                    "Payslip email sent successfully",

                data:
                    emailResult.data

            });

        }


        // ==========================
        // Catch Error
        // ==========================

        catch (err) {

            console.error(
                "Send Payslip Error:",
                err
            );

            res.status(500).json({

                success: false,

                message:
                    err.message ||
                    "Failed to send payslip email"

            });

        }

    }
);

// ================ Start Server =======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});