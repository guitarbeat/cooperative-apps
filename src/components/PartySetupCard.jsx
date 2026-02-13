import React from "react";
import { motion } from "framer-motion";
import { Dices } from "lucide-react";
import { cn } from "../lib/utils";
import FormField from "./FormField";
import EnhancedFormField from "./EnhancedFormField";
import AvatarEmojiPicker from "./AvatarEmojiPicker";
import { Button } from "./ui/button";

const RECOMMENDED_PARTY_COLORS = [
  "#6B8E47", "#0D9488", "#2563EB", "#9333EA", "#EA580C", "#DB2777", "#0EA5E9",
];

const ALL_RANDOM_COLORS = [
  "#6B8E47", "#0D9488", "#2563EB", "#9333EA", "#EA580C", "#DB2777", "#0EA5E9",
  "#059669", "#D97706", "#7C3AED", "#E11D48", "#0284C7", "#4F46E5", "#16A34A",
];

const PartySetupCard = ({
  partyKey,
  displayName,
  fallbackName,
  color,
  normalizedColor,
  onColorChange,
  onNameChange,
  selectedEmoji,
  onEmojiChange,
  nameValue,
  error,
  colorFieldProps,
  nameFieldProps,
  toRgba,
  normalizePartyColor,
  accentColor,
  side = "left",
}) => {
  const handleRandomColor = () => {
    const others = ALL_RANDOM_COLORS.filter((c) => c !== normalizedColor);
    const random = others[Math.floor(Math.random() * others.length)];
    onColorChange(random);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: side === "left" ? 0 : 0.15 }}
      className={cn(
        "party-setup-card space-y-4 rounded-xl border bg-background/60 p-4 shadow-sm transition relative overflow-hidden",
        "hover:shadow-md focus-within:ring-2 focus-within:ring-primary/40"
      )}
      style={{
        "--party-setup-accent": normalizedColor,
        "--party-setup-surface": toRgba(normalizedColor, 0.08),
        "--party-setup-border": toRgba(normalizedColor, 0.35),
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none rounded-xl"
        style={{
          background: `radial-gradient(ellipse at ${side === "left" ? "30%" : "70%"} 20%, ${normalizedColor}, transparent 70%)`,
        }}
      />

      <header className="party-setup-card__header space-y-1 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <h3 className="party-setup-card__title text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {fallbackName}
          </h3>
          {/* Live identity badge */}
          <span
            className="party-setup-card__badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          >
            {selectedEmoji && <span className="text-sm">{selectedEmoji}</span>}
            <span
              className="party-setup-card__badge-dot inline-block h-2.5 w-2.5 rounded-full border"
              style={{ backgroundColor: normalizedColor }}
            />
            {displayName}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Pick a color & avatar that feels right for {displayName}.
        </p>
      </header>

      <div className="relative z-10 space-y-4">
        {/* Emoji picker */}
        <AvatarEmojiPicker
          selectedEmoji={selectedEmoji}
          onEmojiChange={onEmojiChange}
          accentColor={normalizedColor}
        />

        {/* Color selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FormField
              {...colorFieldProps}
              id={`party${partyKey}Color`}
              label={`${displayName} color`}
              type="color"
              value={color}
              onChange={(value) => onColorChange(value)}
              inputClassName="party-color-input"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRandomColor}
              className="h-9 w-9 shrink-0 mt-5"
              aria-label={`Randomize color for ${displayName}`}
            >
              <Dices className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RECOMMENDED_PARTY_COLORS.map((c) => {
              const normalized = normalizePartyColor(c, accentColor);
              const isActive = normalized === normalizedColor;
              return (
                <motion.button
                  key={`${partyKey}-${c}`}
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "h-8 w-8 rounded-full border border-border transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                    isActive
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary"
                      : ""
                  )}
                  style={{
                    backgroundColor: c,
                    boxShadow: isActive ? `0 0 12px ${c}50` : undefined,
                  }}
                  onClick={() => onColorChange(c)}
                  aria-label={`Use ${c} for ${displayName}`}
                >
                  <span className="sr-only">Use {c} for {displayName}</span>
                </motion.button>
              );
            })}
            <span className="text-[11px] text-muted-foreground font-mono ml-1">
              {normalizedColor}
            </span>
          </div>
        </div>

        {/* Name field */}
        <EnhancedFormField
          {...nameFieldProps}
          id={`party${partyKey}Name`}
          label={`${fallbackName} name`}
          placeholder={partyKey === "A" ? "Enter first person's name" : "Enter second person's name"}
          value={nameValue}
          onChange={(value) => onNameChange(value)}
          error={error}
          required={true}
          description={
            partyKey === "A"
              ? "This helps us personalize prompts for the first person"
              : "We'll tailor reflections for the second person automatically"
          }
          autoSave={true}
        />
      </div>
    </motion.section>
  );
};

export default PartySetupCard;
