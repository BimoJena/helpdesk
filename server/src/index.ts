import express from "express";
import cors from "cors";
import { prisma } from '../lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post('/create-test-name', async (req, res) => {
  const user = await prisma.test.create({
    data: {
      testName: req.body.testName
    }
  })
  return res.status(201).json({
    message: "user created",
    data: user
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});