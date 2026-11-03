import express from "express";
import { ObjectId } from "mongodb";
import { books } from "./db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();
const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;

    const filter = req.query.email ? { "addedBy.email": req.query.email } : {};
    
    let query = books.find(filter).sort({ createdAt: -1 });

    if (limit > 0) {
      query = query.limit(limit);
    }

    const allBooks = await query.toArray();
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
    res.status(500).json({ message: "Failed to fetch book" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, author, category, image, description, totalCopies } =
      req.body;
    const copies = Number(totalCopies);

    if (
      !title?.trim() ||
      !author?.trim() ||
      !image?.trim() ||
      !description?.trim()
    ) {
      return res.status(400).json({ message: "Please fill in all the fields" });
    }
    if (!CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json({ message: "Please choose a valid category" });
    }
    if (!Number.isInteger(copies) || copies < 1) {
      return res
        .status(400)
        .json({ message: "Total copies must be a whole number, at least 1" });
    }

    const newBook = {
      title: title.trim(),
      author: author.trim(),
      category,
      image: image.trim(),
      description: description.trim(),
      totalCopies: copies,
      availableCopies: copies,
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
    if (!ObjectId.isValid(bookId))
      return res.status(400).json({ message: "Invalid ID" });

    const book = await books.findOne({ _id: new ObjectId(bookId) });
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.addedBy.email !== req.user.email) {
      return res
        .status(403)
        .json({ message: "You can only edit your own books" });
    }

    const { title, author, category, description, totalCopies, image } =
      req.body;

    const updates = {};
    if (title?.trim()) updates.title = title.trim();
    if (author?.trim()) updates.author = author.trim();
    if (description?.trim()) updates.description = description.trim();
    if (image?.trim()) updates.image = image.trim();

    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) {
        return res
          .status(400)
          .json({ message: "Please choose a valid category" });
      }
      updates.category = category;
    }

    if (totalCopies !== undefined) {
      const copies = Number(totalCopies);
      if (!Number.isInteger(copies) || copies < 1) {
        return res
          .status(400)
          .json({ message: "Total copies must be a whole number, at least 1" });
      }

      const available = book.availableCopies ?? book.totalCopies;
      const borrowed = book.totalCopies - available;

      if (copies < borrowed) {
        return res.status(400).json({
          message: `${borrowed} copies are borrowed right now, so the total can't go below that`,
        });
      }

      updates.totalCopies = copies;
      updates.availableCopies = copies - borrowed;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    await books.updateOne({ _id: new ObjectId(bookId) }, { $set: updates });
    const updatedBook = await books.findOne({ _id: new ObjectId(bookId) });

    res.json(updatedBook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update book" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const bookId = req.params.id;
    if (!ObjectId.isValid(bookId))
      return res.status(400).json({ message: "Invalid ID" });

    const book = await books.findOne({ _id: new ObjectId(bookId) });
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.addedBy.email !== req.user.email) {
      return res
        .status(403)
        .json({ message: "You can only delete your own books" });
    }

    if ((book.availableCopies ?? book.totalCopies) < book.totalCopies) {
      return res
        .status(409)
        .json({ message: "This book is currently borrowed" });
    }

    await books.deleteOne({ _id: new ObjectId(bookId) });

    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete book" });
  }
});

export default router;
