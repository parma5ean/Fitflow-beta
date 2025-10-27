import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function ScrollPicker({ open, onClose, onSubmit, title, currentValue, min, max, unit }) {
  const [selectedValue, setSelectedValue] = useState(currentValue || min);
  const scrollRef = useRef(null);

  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollToValue(selectedValue);
    }
  }, [open]);

  const scrollToValue = (value) => {
    if (scrollRef.current) {
      const index = values.indexOf(value);
      if (index !== -1) {
        const itemHeight = 60;
        scrollRef.current.scrollTop = index * itemHeight;
      }
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const itemHeight = 60;
      const scrollTop = scrollRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const newValue = values[index];
      if (newValue !== undefined) {
        setSelectedValue(newValue);
      }
    }
  };

  const handleValueClick = (value) => {
    setSelectedValue(value);
    scrollToValue(value);
  };

  const handleSubmit = () => {
    onSubmit(selectedValue);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-light flex items-center justify-between">
            {title}
            <button onClick={onClose} className="glass p-2 rounded-xl hover:glass-strong">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Picker */}
          <div className="relative h-[300px] overflow-hidden">
            {/* Selection indicator */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[60px] glass-strong rounded-2xl pointer-events-none z-10" />
            
            {/* Scrollable list */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar"
              style={{ 
                paddingTop: '120px', 
                paddingBottom: '120px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {values.map((value) => (
                <button
                  key={value}
                  onClick={() => handleValueClick(value)}
                  className="h-[60px] w-full flex items-center justify-center snap-center transition-all duration-200 hover:bg-white/10 rounded-xl"
                  style={{
                    opacity: value === selectedValue ? 1 : 0.3,
                    transform: value === selectedValue ? 'scale(1.2)' : 'scale(1)'
                  }}
                >
                  <span className="text-3xl font-light text-white">
                    {value}
                    {unit && <span className="text-xl text-white/70 ml-2">{unit}</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full glass px-6 py-4 rounded-2xl text-white font-light hover:glass-strong transition-all duration-300"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}