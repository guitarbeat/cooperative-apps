import React from "react";
import { motion } from "framer-motion";
import { Dices, Palette } from "lucide-react";
import { cn } from "../lib/utils";
import FormField from "./FormField";
import EnhancedFormField from "./EnhancedFormField";
import AvatarEmojiPicker from "./AvatarEmojiPicker";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const RECOMMENDED_PARTY_COLORS = [
  "#6B8E47", "#0D9488", "#2563EB", "#9333EA", "#EA580C", "#DB2777", "#0EA5E9",
];

const ALL_RANDOM_COLORS = [
  "#6B8E47", "#0D9488", "#2563EB", "#9333EA", "#EA580C", "#DB2777", "#0EA5E9",
  "#059669", "#D97706", "#7C3AED", "#E11D48", "#0284C7", "#4F46E5", "#16A34A",
];

const COLOR_LABELS = {
  "#6B8E47": "Olive Green",
  "#0D9488": "Teal",
  "#2563EB": "Blue",
  "#9333EA": "Purple",
  "#EA580C": "Orange",
  "#DB2777": "Pink",
  "#0EA5E9": "Sky Blue",
  "#059669": "Emerald",
  "#D97706": "Amber",
  "#7C3AED": "Violet",
  "#E11D48": "Rose",
  "#0284C7": "Light Blue",
  "#4F46E5": "Indigo",
  "#16A34A": "Green",
};

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
      whileHover={{
        rotateY: side === "left" ? -2 : 2,
        scale: 1.01,
        transition: { duration: 0.25 },
      }}
      className={cn(
        "party-setup-card party-setup-card--3d group space-y-5 rounded-xl border bg-background/60 p-5 transition-all duration-300 relative overflow-hidden",
        "hover:border-opacity-80 focus-within:ring-2 focus-within:ring-primary/40"
      )}
      style={{
        "--party-setup-accent": normalizedColor,
        "--party-setup-surface": toRgba(normalizedColor, 0.08),
        "--party-setup-border": toRgba(normalizedColor, 0.35),
      }}
    >
      {/* Glow effect - stronger on hover */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none rounded-xl transition-opacity duration-300 group-hover:opacity-[0.12]"
        style={{
          background: `radial-gradient(ellipse at ${side === "left" ? "30%" : "70%"} 20%, ${normalizedColor}, transparent 70%)`,
        }}
      />

      <header className="party-setup-card__header space-y-2 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <h3 className="party-setup-card__title text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {fallbackName}
          </h3>
          {/* Live identity badge - more prominent, 3D pill */}
          <span
            className="party-setup-card__badge party-setup-card__badge--3d inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
          >
            {selectedEmoji ? (
              <span className="text-base" aria-hidden="true">{selectedEmoji}</span>
            ) : (
              <span className="text-muted-foreground/60 text-[10px]">Pick avatar</span>
            )}
            <span
              className="party-setup-card__badge-dot inline-block h-2.5 w-2.5 rounded-full border-2 shrink-0"
              style={{ backgroundColor: normalizedColor }}
            />
            <span className="font-medium truncate max-w-[80px]">{displayName}</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Personalize with an avatar, color, and name for {displayName}.
        </p>
      </header>

      <div className="relative z-10 space-y-5">
        {/* Name field first - primary identity */}
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

        {/* Avatar section - grouped */}
        <div className="space-y-3 party-setup-section">
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="form-label text-xs uppercase tracking-wider text-muted-foreground">
              Avatar & color
            </span>
          </div>
          <AvatarEmojiPicker
            selectedEmoji={selectedEmoji}
            onEmojiChange={onEmojiChange}
            accentColor={normalizedColor}
          />

          {/* Color selection - compact row */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <FormField
                  {...colorFieldProps}
                  id={`party${partyKey}Color`}
                  label="Custom color"
                  type="color"
                  value={color}
                  onChange={(value) => onColorChange(value)}
                  inputClassName="party-color-input h-10"
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRandomColor}
                    className="h-10 shrink-0 gap-1.5"
                    aria-label={`Randomize color for ${displayName}`}
                  >
                    <Dices className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">Random</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Randomize color</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {RECOMMENDED_PARTY_COLORS.map((c) => {
                const normalized = normalizePartyColor(c, accentColor);
                const isActive = normalized === normalizedColor;
                return (
                  <motion.button
                    key={`${partyKey}-${c}`}
                    type="button"
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.9, y: 1 }}
                    className={cn(
                      "party-color-swatch h-7 w-7 rounded-full border-2 transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                      isActive
                        ? "party-color-swatch--active ring-2 ring-offset-2 ring-offset-background"
                        : "party-color-swatch--inactive border-border/60 hover:border-border"
                    )}
                    style={{
                      backgroundColor: c,
                      borderColor: isActive ? c : undefined,
                      boxShadow: isActive ? `0 0 12px ${c}50, 0 4px 8px rgba(0,0,0,0.15)` : undefined,
                    }}
                    onClick={() => onColorChange(c)}
                    aria-label={`Use ${COLOR_LABELS[c] || c} for ${displayName}`}
                    title={COLOR_LABELS[c] || c}
                  >
                    <span className="sr-only">Use {COLOR_LABELS[c] || c} for {displayName}</span>
                  </motion.button>
                );
              })}
              <span className="text-[10px] text-muted-foreground/80 font-mono ml-0.5 tabular-nums">
                {normalizedColor}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default PartySetupCard;
