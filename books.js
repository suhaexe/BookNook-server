import express from "express";
import { ObjectId } from "mongodb";
import { books } from "./db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const allBooks = await books.find().sort({ createdAt: -1 }).toArray();
    res.json(allBooks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch books" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const book = await books.findOne({ _id: new ObjectId(req.params.id) });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Invalid book ID" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, author, category, image, description, totalCopies } = req.body;

    const newBook = {
      title,
      author,
      category,
      image,
      description,
      totalCopies: Number(totalCopies),
      addedBy: {
        name: req.user.name,
        email: req.user.email,
      },
      createdAt: new Date(),
    };

    const result = await books.insertOne(newBook);
    res.status(201).json({ _id: result.insertedId, ...newBook });
  } catch (err) {
    res.status(500).json({ message: "Failed to add book" });
  }
});

export default router;