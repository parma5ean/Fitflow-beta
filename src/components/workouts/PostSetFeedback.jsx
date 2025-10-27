import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function PostSetFeedback({ open, onClose, onFeedback }) {
  const feedbackOptions = [
    { emoji: "😄", label: "Easy", value: "easy" },
    { emoji: "🙂", label: "Okay", value: "okay" },
    { emoji: "😬", label: "Hard", value: "hard" },
    { emoji: "🥵", label: "Max Effort", value: "max" }
  ];

  const handleFeedback = (value) => {
    onFeedback(value);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-sm p-6">
        <h3 className="text-xl font-light text-center mb-4">How did that feel?</h3>
        <div className="grid grid-cols-2 gap-3">
          {feedbackOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFeedback(option.value)}
              className="glass p-6 rounded-2xl hover:glass-strong transition-all duration-300 flex flex-col items-center gap-2"
            >
              <span className="text-4xl">{option.emoji}</span>
              <span className="text-sm font-light">{option.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}