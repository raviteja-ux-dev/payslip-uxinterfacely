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

            const employeeEmail = req.body.employeeEmail;
                
            const employeeName = req.body.employeeName || "Employee";
                
            const associateId = req.body.associateId;
                
            const payMonthYear = req.body.payMonthYear || "this month";

            const pdfFile = req.file;

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

                    subject: `Payslip - ${employeeName} - ${payMonthYear}`,

                        html: `
                            <div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.5; font-size: 14px; text-align: left;">
                            <p style="margin-bottom: 15px;">Dear ${employeeName},</p>
                            
                            <p style="margin-bottom: 15px;">Greetings from UXINTERFACELY IT SOLUTIONS LLP</p>
                            
                            <p style="margin-bottom: 15px;">Please find attached your salary payslip for ${payMonthYear} for your reference and records.</p>
                            
                            <p style="margin-bottom: 15px;">
                                <strong>Payslip Password Format</strong><br>
                                The attached PDF is password protected. To open the payslip, please use:<br>
                                First 4 letters of your name in CAPITAL letters + Associate ID
                            </p>
                            
                            <p style="margin-bottom: 15px;">
                                Example:<br>
                                Name: Apple<br>
                                Associate ID: UX1234<br>
                                Password: APPLUX1234
                            </p>
                            
                            <p style="margin-bottom: 15px;">
                                If you do not know your Associate ID, please contact your respective contact person to obtain the details.<br>
                                If you face any issues accessing your payslip, please reach out to the Team for assistance.
                            </p>
                            
                            <p style="margin-bottom: 0;">Best Regards,</p>
                            <div style="margin-top: 20px;">
                                <img src="${process.env.COMPANY_EMAIL_SIGNATURE_URL}" alt="Company Logo" style="display: block; width: 150px; height: auto;">
                            </div>
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