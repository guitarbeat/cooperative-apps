import React from "react";
import { motion } from "framer-motion";
import { Dices } from "lucide-react";
import { cn } from "../lib/utils";

const CURATED_EMOJIS = [
  "🦁", "🐻", "🦊", "🐺", "🦅",
  "🐬", "🦋", "🌟", "🔥", "🌊",
  "🌿", "💎", "🎯", "🛡️", "⚡",
  "🌈", "🎭", "🧭", "🕊️", "🌻",
];

const AvatarEmojiPicker = ({ selectedEmoji, onEmojiChange, accentColor }) => {
  const handleRandomEmoji = () => {
    const others = CURATED_EMOJIS.filter((e) => e !== selectedEmoji);
    const random = others[Math.floor(Math.random() * others.length)];
    onEmojiChange(random);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="form-label text-xs uppercase tracking-wider text-muted-foreground">
          Choose an avatar
        </label>
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRandomEmoji}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
            aria-label="Pick a random avatar"
          >
            <Dices className="h-3.5 w-3.5" />
            <span>Random</span>
          </motion.button>
          {selectedEmoji && (
            <button
              type="button"
              onClick={() => onEmojiChange("")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {CURATED_EMOJIS.map((emoji) => {
          const isSelected = selectedEmoji === emoji;
          return (
            <motion.button
              key={emoji}
              type="button"
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.92, y: 1 }}
              onClick={() => onEmojiChange(isSelected ? "" : emoji)}
              className={cn(
                "emoji-btn-3d h-10 w-10 rounded-xl text-xl flex items-center justify-center transition-all border-2",
                isSelected
                  ? "emoji-btn-3d--active ring-2 ring-offset-1 ring-offset-background"
                  : "emoji-btn-3d--inactive border-border/50 hover:border-border bg-muted/30 hover:bg-muted/60"
              )}
              style={
                isSelected
                  ? {
                      borderColor: accentColor,
                      ringColor: accentColor,
                      backgroundColor: `${accentColor}18`,
                      boxShadow: `0 0 14px ${accentColor}35, 0 4px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)`,
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
    </div>
  );
};

export default AvatarEmojiPicker;
