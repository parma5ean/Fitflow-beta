import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Delete } from "lucide-react";

export default function NumericKeypad({ open, onClose, onSubmit, title, currentValue, unit }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) {
      // Reset value when modal opens
      setValue(currentValue && parseFloat(currentValue) > 0 ? currentValue : "");
    }
  }, [open, currentValue]);

  const handleNumberClick = (num) => {
    setValue(prev => {
      // If current value is empty or "0", replace it
      if (!prev || prev === "0" || prev === "0.0") {
        return num;
      }
      return prev + num;
    });
  };

  const handleDecimal = () => {
    setValue(prev => {
      if (!prev) return "0.";
      if (!prev.includes('.')) {
        return prev + '.';
      }
      return prev;
    });
  };

  const handleDelete = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setValue("");
  };

  const handleSubmit = () => {
    if (value) {
      onSubmit(value);
      setValue("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-light flex items-center justify-between">
            {title}
            <button onClick={onClose} className="glass p-2 rounded-xl hover:glass-strong">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Display */}
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-3xl font-light text-white min-h-[50px] flex items-center justify-center">
              {value || "0"}
              {unit && <span className="text-xl text-white/70 ml-2">{unit}</span>}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="glass p-4 rounded-xl text-white text-xl font-light hover:glass-strong transition-all duration-300"
              >
                {num}
              </button>
            ))}
            
            <button
              onClick={handleDecimal}
              className="glass p-4 rounded-xl text-white text-xl font-light hover:glass-strong transition-all duration-300"
            >
              .
            </button>
            
            <button
              onClick={() => handleNumberClick("0")}
              className="glass p-4 rounded-xl text-white text-xl font-light hover:glass-strong transition-all duration-300"
            >
              0
            </button>
            
            <button
              onClick={handleDelete}
              className="glass p-4 rounded-xl text-white hover:glass-strong transition-all duration-300 flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleClear}
              className="glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={!value}
              className="glass px-4 py-3 rounded-xl text-white font-light hover:glass-strong transition-all duration-300 disabled:opacity-50"
            >
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}