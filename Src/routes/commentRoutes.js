// routes/commentRoutes.js
import express from "express";
import Comment from "../models/Comment.js";

const router = express.Router();

// الحصول على التعليقات الخاصة بسائق معين
router.get("/:driverId", async (req, res) => {
  try {
    const comments = await Comment.find({ driverId: req.params.driverId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// إضافة تعليق جديد
router.post("/", async (req, res) => {
  try {
    const { driverId, author, text } = req.body;
    const newComment = new Comment({
      driverId,
      author,
      text
    });
    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// حذف تعليق
router.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;