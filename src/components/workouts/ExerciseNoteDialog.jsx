import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function ExerciseNoteDialog({ open, onClose, onSave, currentNote, title }) {
  const [note, setNote] = useState(currentNote || "");

  const handleSave = () => {
    onSave(note);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-light flex items-center justify-between">
            {title}
            <button onClick={onClose} className="glass p-2 rounded-xl hover:glass-strong">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="glass border-white/20 text-white font-light min-h-[120px]"
            placeholder="Add your notes here..."
          />

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300"
            >
              Save Note
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}