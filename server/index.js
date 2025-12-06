import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import UserModel from "./Models/UserModel.js";

dotenv.config(); // Load environment variables from .env

const app = express();
app.use(express.json());
app.use(cors());

// Build MongoDB URI from environment variables
const URI = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@postitcluster.t8dzf6q.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority&appName=PostITCluster`;

// Connect to MongoDB
mongoose
  .connect(URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));


// -----------------------------------------
// REGISTER API
// -----------------------------------------
app.post("/registerUser", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
    });

    // Remove password from response
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(201).json({ user: safeUser, message: "User registered successfully." });
  } catch (error) {
    console.log("Register Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// -----------------------------------------
// LOGIN API
// -----------------------------------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    // Prepare safe user object
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(200).json({ user: safeUser, message: "Login successful." });
  } catch (error) {
    console.log("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// -----------------------------------------
// LOGOUT API
// -----------------------------------------
app.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});


// -----------------------------------------
// START SERVER
// -----------------------------------------
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
