import express from "express";
import { ObjectId } from "mongodb";
import { books, borrows } from "./db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userEmail = req.user.email;

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const existingBorrow = await borrows.findOne({
      bookId: new ObjectId(bookId),
      userEmail,
      status: "borrowed",
    });

    if (existingBorrow) {
      return res.status(400).json({ message: "You already have this book borrowed" });
    }

    const updatedBook = await books.findOneAndUpdate(
      { _id: new ObjectId(bookId), totalCopies: { $gt: 0 } },
      { $inc: { totalCopies: -1 } },
      { returnDocument: "after" }
    );

    if (!updatedBook) {
      return res.status(400).json({ message: "Not available" });
    }

    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

    const newBorrow = {
      bookId: new ObjectId(bookId),
      bookTitle: updatedBook.title,
      bookImage: updatedBook.image,
      userEmail,
      borrowDate,
      dueDate,
      status: "borrowed",
    };

    const result = await borrows.insertOne(newBorrow);
    res.status(201).json({ _id: result.insertedId, ...newBorrow });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to borrow book" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const myBorrows = await borrows
      .find({ userEmail: req.user.email, status: "borrowed" })
      .sort({ borrowDate: -1 })
      .toArray();
    res.json(myBorrows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch borrows" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const borrowId = req.params.id;

    if (!ObjectId.isValid(borrowId)) {
      return res.status(400).json({ message: "Invalid borrow ID" });
    }

    const borrowRecord = await borrows.findOne({
      _id: new ObjectId(borrowId),
      userEmail: req.user.email,
      status: "borrowed",
    });

    if (!borrowRecord) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    await borrows.updateOne(
      { _id: new ObjectId(borrowId) },
      { $set: { status: "returned", returnedAt: new Date() } }
    );

    await books.updateOne(
      { _id: borrowRecord.bookId },
      { $inc: { totalCopies: 1 } }
    );

    res.json({ message: "Book returned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to return book" });
  }
});

export default router;