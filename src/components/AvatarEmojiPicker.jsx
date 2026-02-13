import React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

const CURATED_EMOJIS = [
  "🦁", "🐻", "🦊", "🐺", "🦅",
  "🐬", "🦋", "🌟", "🔥", "🌊",
  "🌿", "💎", "🎯", "🛡️", "⚡",
  "🌈", "🎭", "🧭", "🕊️", "🌻",
];

const AvatarEmojiPicker = ({ selectedEmoji, onEmojiChange, accentColor }) => {
  return (
    <div className="space-y-2">
      <label className="form-label text-xs uppercase tracking-wider text-muted-foreground">
        Choose an avatar
      </label>
      <div className="flex flex-wrap gap-1.5">
        {CURATED_EMOJIS.map((emoji) => {
          const isSelected = selectedEmoji === emoji;
          return (
            <motion.button
              key={emoji}
              type="button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEmojiChange(isSelected ? "" : emoji)}
              className={cn(
                "h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-all border",
                isSelected
                  ? "ring-2 ring-offset-1 ring-offset-background shadow-md"
                  : "border-border/50 hover:border-border bg-muted/30 hover:bg-muted/60"
              )}
              style={
                isSelected
                  ? {
                      borderColor: accentColor,
                      ringColor: accentColor,
                      backgroundColor: `${accentColor}18`,
                      boxShadow: `0 0 12px ${accentColor}30`,
                    }
                  : undefined
              }
              aria-label={`Select ${emoji} avatar`}
              aria-pressed={isSelected}
            >
              {emoji}
            </motion.button>
          );
        })}
      </div>
      {selectedEmoji && (
        <button
          type="button"
          onClick={() => onEmojiChange("")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear avatar
        </button>
      )}
    </div>
  );
};

export default AvatarEmojiPicker;
