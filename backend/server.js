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

// Test Route
app.get("/", (req, res) => {
  res.send("Payslip API Running...");
});


// ===== ADD THIS ROUTE =====
app.get("/test", async (req, res) => {
  const { data, error } = await supabase
    .from("employees")
    .select("*");

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});
// ==========================


// Save Employee
app.post("/employee", async (req, res) => {
  const employee = req.body;

  const { data, error } = await supabase
    .from("employees")
    .insert([employee]);

  if (error) {
    return res.status(500).json(error);
  }

  res.json({
    success: true,
    data,
  });
});


// ===== ADD THIS IF IT IS NOT ALREADY THERE =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// ===============================================