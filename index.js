import "dotenv/config";
import express from "express";
import cors from "cors";
import { requireAuth } from "./auth.js"; 
import booksRouter from "./books.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.use("/books", booksRouter);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});