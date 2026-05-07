import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. FIND USER
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Wrong password" });
    }

    // 3. CREATE TOKEN
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        studentId: user.studentId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 4. SEND RESPONSE
    res.json({
  token,
  user: {
    id: user._id,
    email: user.email,
    role: user.role,

    studentId: user.studentId, // ✅ ADD THIS

    displayName:
      user.displayName ||
      user.name ||
      "Student",
  },
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, role, displayName, studentId } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = jwt.sign(
  {
    id: user._id,
    role: user.role,
    studentId: user.studentId,
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.json({
  token,
  user: {
    id: user._id,
    email: user.email,
    role: user.role,

    studentId: user.studentId,

    displayName:
      user.displayName ||
      "Student",
  },
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};