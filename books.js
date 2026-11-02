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
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Book not found" });
    }
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
        name: req.user.name || "Unknown",
        email: req.user.email,
      },
      createdAt: new Date(),
    };

    const result = await books.insertOne(newBook);
    res.status(201).json({ _id: result.insertedId, ...newBook });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add book" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const bookId = req.params.id;
    if (!ObjectId.isValid(bookId)) return res.status(400).json({ message: "Invalid ID" });

    const book = await books.findOne({ _id: new ObjectId(bookId) });
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.addedBy.email !== req.user.email) {
      return res.status(403).json({ message: "You can only edit your own books" });
    }

    const { title, author, category, description, totalCopies, image } = req.body;

    const updatedBook = await books.findOneAndUpdate(
      { _id: new ObjectId(bookId) },
      { 
        $set: { 
          title, 
          author, 
          category, 
          description, 
          totalCopies: Number(totalCopies),
          image: image || book.image
        } 
      },
      { returnDocument: "after" }
    );

    res.json(updatedBook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update book" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const bookId = req.params.id;
    if (!ObjectId.isValid(bookId)) return res.status(400).json({ message: "Invalid ID" });

    const book = await books.findOne({ _id: new ObjectId(bookId) });
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.addedBy.email !== req.user.email) {
      return res.status(403).json({ message: "You can only delete your own books" });
    }

    await books.deleteOne({ _id: new ObjectId(bookId) });

    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete book" });
  }
});

export default router;