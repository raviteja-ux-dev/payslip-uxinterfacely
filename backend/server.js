const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);



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



// =======================================
// Start Server
// =======================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});