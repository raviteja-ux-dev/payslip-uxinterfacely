const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

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


// =======================================
// Test Route
// =======================================

app.get("/", (req, res) => {
    res.send("Payslip API Running...");
});


// =======================================
// Test Employees
// =======================================

app.get("/test", async (req, res) => {

    const { data, error } = await supabase
        .from("employees")
        .select("*");

    if (error) {
        return res.status(500).json(error);
    }

    res.json(data);
});


// =======================================
// Employee Master
// Insert if new
// Update if Associate ID already exists
// =======================================

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


// =======================================
// Payslip
// One Payslip per Month per Employee
// =======================================

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


// =======================================
// View Employees
// =======================================

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

        // -------------------------
        // Get Payslip
        // -------------------------

        const { data: payslip, error: payslipError } =
            await supabase
                .from("payslips")
                .select("*")
                .eq("id", req.params.id)
                .single();

        if (payslipError) {
            return res.status(500).json(payslipError);
        }

        // -------------------------
        // Get Employee
        // -------------------------

        const { data: employee, error: employeeError } =
            await supabase
                .from("employees")
                .select("*")
                .eq("associate_id", payslip.associate_id)
                .single();

        if (employeeError) {
            return res.status(500).json(employeeError);
        }

        // -------------------------
        // Merge both objects
        // -------------------------

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

            const pdfFile =
                req.file;

            // ==========================
            // Validate email
            // ==========================

            if (!employeeEmail) {

                return res.status(400).json({
                    success: false,
                    message: "Employee email is required"
                });

            }

            // ==========================
            // Validate PDF
            // ==========================

            if (!pdfFile) {

                return res.status(400).json({
                    success: false,
                    message: "Payslip PDF is required"
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

            // ==========================
            // Send Email using Resend
            // ==========================

            const emailResult =
                await resend.emails.send({

                    from:
                        "Payslip <onboarding@resend.dev>",

                    to: [employeeEmail],

                    subject:
                        `Payslip - ${employeeName}`,

                    html: `
                        <p>Dear ${employeeName},</p>

                        <p>
                            Please find your payslip
                            attached with this email.
                        </p>

                        <p>
                            Regards,<br>
                            Payroll Team
                        </p>
                    `,

                    attachments: [
                        {
                            filename:
                                `${employeeName}_Payslip.pdf`,

                            content:
                                pdfFile.buffer
                        }
                    ]

                });

            console.log(
                "Resend result:",
                emailResult
            );

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

                data: emailResult.data

            });

        }
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