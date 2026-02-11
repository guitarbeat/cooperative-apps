import React, { Suspense, useEffect } from "react";
import { Download, FileText, Upload, Loader2, RefreshCcw, ArrowLeftRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import FormField from "./FormField";
import EnhancedFormField from "./EnhancedFormField";
import DatePickerField from "./DatePickerField";
import SectionSeparator from "./SectionSeparator";
import { MultiSelectInput, RatingInput, StructuredListInput, PriorityInput } from "./AdvancedInputs";
import { cn } from "../lib/utils";
// Lazy-load heavy component
const EmojiGridMapper = React.lazy(() => import("./EmojiGridMapper"));
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getCategoryByStep } from "../config/surveyCategories";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { PDFLoadingState, FileLoadingState } from "./LoadingState";

const DEFAULT_PARTY_COLORS = {
  A: "#6B8E47",
  B: "#0D9488",
};

const RECOMMENDED_PARTY_COLORS = [
  "#6B8E47",
  "#0D9488",
  "#2563EB",
  "#9333EA",
  "#EA580C",
  "#DB2777",
  "#0EA5E9",
];

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}){1,2}$/i;

const expandHex = (value) => {
  const normalized = value.replace("#", "");
  if (normalized.length === 3) {
    return `#${normalized
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase()}`;
  }

  return `#${normalized.toUpperCase()}`;
};

const normalizePartyColor = (value, fallback) => {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (HEX_COLOR_PATTERN.test(candidate)) {
    return expandHex(candidate);
  }

  if (HEX_COLOR_PATTERN.test(fallback)) {
    return expandHex(fallback.trim());
  }

  return "#2563EB";
};

const FALLBACK_THEME_SURFACES = {
  light: "#F8FAFC",
  dark: "#0F172A",
};

const rgbComponentToHex = (value) => {
  const int = Math.max(0, Math.min(255, Number.parseInt(value, 10)));
  return int.toString(16).padStart(2, "0").toUpperCase();
};

const parseCssColorToHex = (value, fallback) => {
  if (!value) return fallback;
  const candidate = value.trim();
  if (HEX_COLOR_PATTERN.test(candidate)) {
    return expandHex(candidate);
  }

  const rgbMatch = candidate.match(/^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `#${rgbComponentToHex(r)}${rgbComponentToHex(g)}${rgbComponentToHex(b)}`;
  }

  if (typeof window === "undefined" || !document.body) {
    return fallback;
  }

  const probe = document.createElement("span");
  probe.style.color = candidate;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const computedColor = getComputedStyle(probe).color;
  document.body.removeChild(probe);

  if (computedColor && computedColor !== candidate) {
    return parseCssColorToHex(computedColor, fallback);
  }

  return fallback;
};

const getThemeSurfaceColors = () => {
  if (typeof window === "undefined" || !document.body) {
    return FALLBACK_THEME_SURFACES;
  }

  const fallbackLight = FALLBACK_THEME_SURFACES.light;
  const fallbackDark = FALLBACK_THEME_SURFACES.dark;

  const rootComputed = getComputedStyle(document.documentElement);
  const lightCandidate =
    rootComputed.getPropertyValue("--background").trim() ||
    rootComputed.getPropertyValue("--card").trim();
  const light = parseCssColorToHex(lightCandidate, fallbackLight);

  const probe = document.createElement("div");
  probe.className = "dark";
  probe.style.display = "none";
  document.body.appendChild(probe);
  const darkComputed = getComputedStyle(probe);
  const darkCandidate =
    darkComputed.getPropertyValue("--background").trim() ||
    darkComputed.getPropertyValue("--card").trim();
  const dark = parseCssColorToHex(darkCandidate, fallbackDark);
  document.body.removeChild(probe);

  return { light, dark };
};

const useThemeContrastSurfaces = () => {
  const [surfaces, setSurfaces] = React.useState(() => ({ ...FALLBACK_THEME_SURFACES }));

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateSurfaces = () => {
      setSurfaces(getThemeSurfaceColors());
    };

    updateSurfaces();

    const observer = typeof MutationObserver !== "undefined"
      ? new MutationObserver(updateSurfaces)
      : null;
    if (observer) {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    const mediaQuery = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    if (mediaQuery) {
      const handler = () => updateSurfaces();
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", handler);
      } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(handler);
      }
      return () => {
        observer?.disconnect();
        if (typeof mediaQuery.removeEventListener === "function") {
          mediaQuery.removeEventListener("change", handler);
        } else if (typeof mediaQuery.removeListener === "function") {
          mediaQuery.removeListener(handler);
        }
      };
    }

    return () => {
      observer?.disconnect();
    };
  }, []);

  return surfaces;
};

const hexToRgb = (hexColor) => {
  const expanded = expandHex(hexColor).replace("#", "");
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
};

const toRgba = (hexColor, alpha) => {
  const { r, g, b } = hexToRgb(hexColor);
  const safeAlpha = Math.min(Math.max(Number.isFinite(alpha) ? alpha : 1, 0), 1);
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

const getRelativeLuminance = (hexColor) => {
  const { r, g, b } = hexToRgb(hexColor);
  const srgb = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const getReadableTextColor = (hexColor) => {
  const luminance = getRelativeLuminance(hexColor);
  return luminance > 0.5 ? "#1E293B" : "#F8FAFC";
};

const getContrastRatio = (hexColorA, hexColorB) => {
  const luminanceA = getRelativeLuminance(hexColorA);
  const luminanceB = getRelativeLuminance(hexColorB);
  const [lighter, darker] = luminanceA > luminanceB ? [luminanceA, luminanceB] : [luminanceB, luminanceA];
  return (lighter + 0.05) / (darker + 0.05);
};

const formatContrastRatio = (ratio) => {
  if (!Number.isFinite(ratio)) return "–";
  const precision = ratio >= 10 ? 1 : 2;
  const rounded = Number(ratio.toFixed(precision));
  return `${rounded}:1`;
};

const getContrastLabel = (ratio) => {
  if (!Number.isFinite(ratio)) return "Unknown contrast";
  if (ratio >= 7) return "Excellent (AAA)";
  if (ratio >= 4.5) return "Great (AA)";
  if (ratio >= 3) return "Readable (AA Large)";
  return "Low contrast";
};

const createAccentConfig = (color, fallback) => {
  const normalized = normalizePartyColor(color, fallback);
  return {
    color: normalized,
    styles: {
      "--party-accent": normalized,
      "--party-accent-surface": toRgba(normalized, 0.08),
      "--party-accent-surface-strong": toRgba(normalized, 0.18),
      "--party-accent-border": toRgba(normalized, 0.32),
      "--party-accent-border-strong": toRgba(normalized, 0.46),
      "--party-accent-border-dark": toRgba(normalized, 0.55),
      "--party-accent-focus": toRgba(normalized, 0.3),
      "--party-accent-input": toRgba(normalized, 0.07),
      "--party-accent-input-dark": toRgba(normalized, 0.22),
      "--party-accent-text": toRgba(normalized, 0.85),
      "--party-accent-text-muted": toRgba(normalized, 0.65),
      "--party-accent-shadow": toRgba(normalized, 0.3),
      "--party-accent-badge-text": getReadableTextColor(normalized),
    },
  };
};

const PartyAccentPreviewCard = ({ partyKey, details, surfaces }) => {
  if (!details?.accent) return null;

  const themeSurfaces = surfaces || FALLBACK_THEME_SURFACES;
  const contrastOnLight = getContrastRatio(details.accent.color, themeSurfaces.light);
  const contrastOnDark = getContrastRatio(details.accent.color, themeSurfaces.dark);
  const lightBorderColor = toRgba(getReadableTextColor(themeSurfaces.light), 0.2);
  const darkBorderColor = toRgba(getReadableTextColor(themeSurfaces.dark), 0.3);

  return (
    <div
      className="party-accent-preview-card"
      style={{
        ...details.accent.styles,
        "--party-preview-light-color": themeSurfaces.light,
        "--party-preview-dark-color": themeSurfaces.dark,
        "--party-preview-light-border": lightBorderColor,
        "--party-preview-dark-border": darkBorderColor,
      }}
      data-party-key={partyKey}
    >
      <div className="party-accent-preview-chip">
        <span className="party-accent-preview-name">{details.name}</span>
        <span className="party-accent-preview-hex">{details.accent.color}</span>
      </div>
      <p className="party-accent-preview-label">{getContrastLabel(contrastOnLight)} on light backgrounds</p>
      <div className="party-accent-preview-contrast">
        <span>
          <span className="party-accent-preview-dot" aria-hidden="true" />
          Light: {formatContrastRatio(contrastOnLight)}
        </span>
        <span>
          <span className="party-accent-preview-dot party-accent-preview-dot--dark" aria-hidden="true" />
          Dark: {formatContrastRatio(contrastOnDark)}
        </span>
      </div>
    </div>
  );
};

// * Category Header component
const CategoryHeader = ({ step }) => {
  const category = getCategoryByStep(step);
  
  if (!category) return null;
  
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{category.icon}</span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{category.name}</h2>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
      </div>
    </div>
  );
};

// * Communication Approaches component - moved outside to prevent recreation
const CommunicationApproaches = ({
  party,
  prefix,
  formData,
  updateFormData,
  isFieldMissing,
  context,
  getPartyFieldProps,
}) => {
  const fieldProps = getPartyFieldProps ? getPartyFieldProps(party) : {};

  return (
    <div className="space-y-4 sm:space-y-6">
      <label className="form-label">I want... (Communication Approaches)</label>
      <EnhancedFormField
        {...fieldProps}
        id={`${prefix}AggressiveApproach`}
        label="Aggressive Approach (Not Recommended)"
        placeholder="What would you want to say if you were being aggressive?"
        value={formData[`${prefix}AggressiveApproach`]}
        onChange={(value) => updateFormData(`${prefix}AggressiveApproach`, value)}
        type="textarea"
        className="text-red-600"
        description="This approach is not recommended as it can escalate conflict"
        showCharacterCount={true}
        maxLength={500}
      />
      <EnhancedFormField
        {...fieldProps}
        id={`${prefix}PassiveApproach`}
        label="Passive Approach"
        placeholder="What would you want if you were being passive?"
        value={formData[`${prefix}PassiveApproach`]}
        onChange={(value) => updateFormData(`${prefix}PassiveApproach`, value)}
        type="textarea"
        className="text-blue-600"
        description="This approach avoids conflict but may not address underlying issues"
        showCharacterCount={true}
        maxLength={500}
      />
      <EnhancedFormField
        {...fieldProps}
        id={`${prefix}AssertiveApproach`}
        label="Assertive Approach (Recommended)"
        placeholder="What would you want to say if you were being assertive and respectful?"
        value={formData[`${prefix}AssertiveApproach`]}
        onChange={(value) => updateFormData(`${prefix}AssertiveApproach`, value)}
        type="textarea"
        className="text-green-600"
        error={isFieldMissing(`${prefix}AssertiveApproach`) ? "Required" : ""}
        description="This approach is recommended for healthy conflict resolution"
        showCharacterCount={true}
        maxLength={500}
        smartSuggestions={true}
        fieldType="assertiveApproach"
        context={context}
        showContextualHelp={true}
      />
      <EnhancedFormField
        {...fieldProps}
        id={`${prefix}WhyBecause`}
        label="Why/Because..."
        placeholder="Explain your reasoning..."
        value={formData[`${prefix}WhyBecause`]}
        onChange={(value) => updateFormData(`${prefix}WhyBecause`, value)}
        type="textarea"
        description="Explain the reasoning behind your assertive approach"
        showCharacterCount={true}
        maxLength={300}
      />
    </div>
  );
};

// * Individual Reflection component - moved outside to prevent recreation
const IndividualReflection = ({
  party,
  prefix,
  formData,
  updateFormData,
  isFieldMissing,
  context,
  getPartyFieldProps,
  currentSubStep,
}) => {
  const fieldProps = getPartyFieldProps ? getPartyFieldProps(party) : {};

  return (
    <div className="space-y-4 sm:space-y-6">
      {currentSubStep === 0 && (
        <>
          <SectionSeparator title="Thoughts & Beliefs" />
          <EnhancedFormField
            {...fieldProps}
            id={`${prefix}Thoughts`}
            label="I think..."
            placeholder="Explain what you think or believe to be true about the conflict..."
            value={formData[`${prefix}Thoughts`]}
            onChange={(value) => updateFormData(`${prefix}Thoughts`, value)}
            type="textarea"
            rows={4}
            error={isFieldMissing(`${prefix}Thoughts`) ? "Required" : ""}
            description="Be honest about your beliefs and assumptions about the situation"
            showCharacterCount={true}
            maxLength={1000}
            smartSuggestions={true}
            fieldType="thoughts"
            context={context}
            showContextualHelp={true}
          />
        </>
      )}

      {currentSubStep === 1 && (
        <>
          <SectionSeparator title="Emotions & Feelings" />
          <div className="space-y-3 sm:space-y-4">
            <label className="form-label">
              I feel... (Use both methods to express your emotions)
            </label>
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading emotion mapper…</div>}>
              <EmojiGridMapper
                onEmotionWordsChange={(words) =>
                  updateFormData(`${prefix}SelectedEmotionWords`, words)
                }
                onChartPositionChange={(position) =>
                  updateFormData(`${prefix}EmotionChartPosition`, position)
                }
                selectedEmotionWords={formData[`${prefix}SelectedEmotionWords`]}
                chartPosition={formData[`${prefix}EmotionChartPosition`]}
              />
            </Suspense>
          </div>
        </>
      )}

      {currentSubStep === 2 && (
        <>
          <SectionSeparator title="Communication Approaches" />
          <CommunicationApproaches
            party={party}
            prefix={prefix}
            formData={formData}
            updateFormData={updateFormData}
            isFieldMissing={isFieldMissing}
            context={context}
            getPartyFieldProps={getPartyFieldProps}
          />
        </>
      )}
    </div>
  );
};

const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Choose a valid color");

const Step1Schema = z.object({
  partyAName: z.string().min(1, "Required"),
  partyBName: z.string().min(1, "Required"),
  conflictDescription: z.string().min(1, "Required"),
  dateOfIncident: z.string().optional(),
  dateOfMediation: z.string().optional(),
  locationOfConflict: z.string().optional(),
  partyAColor: hexColorSchema.optional(),
  partyBColor: hexColorSchema.optional(),
});

const StepContent = ({ step, formData, updateFormData, updateMultipleFields, onExportJSON, showErrors, getRequiredFieldsForStep, currentSubStep }) => {
  // Error handling
  const { executeFileOperation, executeAsync } = useErrorHandler({
    showToast: true,
    logErrors: true
  });

  // Loading states
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [isImportingFile, setIsImportingFile] = React.useState(false);
  const [pdfError, setPdfError] = React.useState(null);
  const [importError, setImportError] = React.useState(null);

  // Create context for smart suggestions
  const context = React.useMemo(() => ({
    partyAName: formData.partyAName,
    partyBName: formData.partyBName,
    currentStep: step,
  }), [formData.partyAName, formData.partyBName, step]);

  const partyAccents = React.useMemo(() => ({
    A: createAccentConfig(formData.partyAColor, DEFAULT_PARTY_COLORS.A),
    B: createAccentConfig(formData.partyBColor, DEFAULT_PARTY_COLORS.B),
  }), [formData.partyAColor, formData.partyBColor]);

  const partyDetails = React.useMemo(() => ({
    A: {
      name: formData.partyAName?.trim() || "Party A",
      accent: partyAccents.A,
    },
    B: {
      name: formData.partyBName?.trim() || "Party B",
      accent: partyAccents.B,
    },
  }), [formData.partyAName, formData.partyBName, partyAccents]);

  const themeSurfaces = useThemeContrastSurfaces();

  const getPartyFieldProps = (
    party,
    {
      variant = "enhanced",
      className = "",
      labelClassName = "",
      containerProps: extraContainerProps = {},
      showBadge,
      showStripe = true,
    } = {},
  ) => {
    const details = partyDetails[party];
    if (!details) return {};

    const shouldShowBadge =
      typeof showBadge === "boolean" ? showBadge : variant !== "simple";

    const baseClasses = ["party-field"];
    if (variant === "simple") {
      baseClasses.push("party-field--compact");
    }
    if (shouldShowBadge) {
      baseClasses.push("party-field--with-badge");
    }
    if (!showStripe) {
      baseClasses.push("party-field--no-stripe");
    }

    const combinedClassName = [
      ...baseClasses,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const combinedLabelClass = labelClassName || undefined;

    return {
      containerClassName: combinedClassName,
      containerStyle: details.accent?.styles ? { ...details.accent.styles } : {},
      containerProps: {
        ...(shouldShowBadge ? { "data-party-label": details.name } : {}),
        "data-party-key": party,
        ...extraContainerProps,
      },
      labelClassName: combinedLabelClass,
    };
  };

  // react-hook-form for Step 1
  const step1Form = useForm({
    mode: "onChange",
    resolver: zodResolver(Step1Schema),
    defaultValues: {
      partyAName: formData.partyAName,
      partyBName: formData.partyBName,
      partyAColor: partyAccents.A.color,
      partyBColor: partyAccents.B.color,
      conflictDescription: formData.conflictDescription,
      dateOfIncident: formData.dateOfIncident,
      dateOfMediation: formData.dateOfMediation,
      locationOfConflict: formData.locationOfConflict,
    },
  });

  const step1Errors = step1Form.formState.errors;

  const handleResetPartyColors = () => {
    const defaultA = normalizePartyColor(DEFAULT_PARTY_COLORS.A, DEFAULT_PARTY_COLORS.A);
    const defaultB = normalizePartyColor(DEFAULT_PARTY_COLORS.B, DEFAULT_PARTY_COLORS.B);

    step1Form.setValue("partyAColor", defaultA, { shouldDirty: true, shouldValidate: true });
    updateFormData("partyAColor", defaultA);
    step1Form.setValue("partyBColor", defaultB, { shouldDirty: true, shouldValidate: true });
    updateFormData("partyBColor", defaultB);
  };

  const handleSwapPartyColors = () => {
    const colorA = normalizePartyColor(step1Form.getValues("partyAColor") || partyAccents.A.color, partyAccents.A.color);
    const colorB = normalizePartyColor(step1Form.getValues("partyBColor") || partyAccents.B.color, partyAccents.B.color);

    step1Form.setValue("partyAColor", colorB, { shouldDirty: true, shouldValidate: true });
    updateFormData("partyAColor", colorB);
    step1Form.setValue("partyBColor", colorA, { shouldDirty: true, shouldValidate: true });
    updateFormData("partyBColor", colorA);
  };

  useEffect(() => {
    if (showErrors && step === 1) {
      step1Form.trigger();
    }
  }, [showErrors, step, step1Form]);

  const requiredFields = getRequiredFieldsForStep(step);
  const isFieldMissing = (field) => {
    if (!showErrors || !requiredFields.includes(field)) return false;
    const value = formData[field];
    if (Array.isArray(value)) return value.length === 0;
    return !value || value.toString().trim() === "";
  };

  const TwoColumnFields = ({ fields }) => (
    <div className="form-grid form-grid-2">
      {fields.map((field) => (
        <FormField key={field.id} {...field} />
      ))}
    </div>
  );

  const handleImportJSON = async (file) => {
    if (!file) return;
    
    setIsImportingFile(true);
    setImportError(null);
    
    const result = await executeFileOperation(async () => {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error("Please select a valid JSON file");
      }
      
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File is too large. Please select a file smaller than 10MB");
      }
      
      const text = await file.text();
      
      if (!text.trim()) {
        throw new Error("The selected file is empty");
      }
      
      const parsed = JSON.parse(text);
      
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error("Invalid JSON format. The file must contain a valid JSON object");
      }
      
      const allowedKeys = Object.keys(formData);
      const sanitized = Object.fromEntries(
        Object.entries(parsed).filter(([k]) => allowedKeys.includes(k))
      );
      
      if (Object.keys(sanitized).length === 0) {
        throw new Error("No valid mediation data found in the file");
      }
      
      updateMultipleFields(sanitized);
      return sanitized;
    }, { fileName: file.name, operation: 'import' });
    
    setIsImportingFile(false);
    
    if (result.success) {
      toast.success(`Session imported successfully! ${Object.keys(result.data).length} fields loaded.`);
    } else {
      setImportError(result.error);
    }
  };

  switch (step) {
    case 1: {
      const partyANameValue = step1Form.watch("partyAName");
      const partyBNameValue = step1Form.watch("partyBName");
      const partyAColorValue = step1Form.watch("partyAColor") || partyAccents.A.color;
      const partyBColorValue = step1Form.watch("partyBColor") || partyAccents.B.color;
      const normalizedPartyAColor = normalizePartyColor(partyAColorValue, partyAccents.A.color);
      const normalizedPartyBColor = normalizePartyColor(partyBColorValue, partyAccents.B.color);
      const defaultNormalizedA = normalizePartyColor(DEFAULT_PARTY_COLORS.A, DEFAULT_PARTY_COLORS.A);
      const defaultNormalizedB = normalizePartyColor(DEFAULT_PARTY_COLORS.B, DEFAULT_PARTY_COLORS.B);
      const isUsingDefaultPalette =
        normalizedPartyAColor === defaultNormalizedA && normalizedPartyBColor === defaultNormalizedB;
      const isSameAccent = normalizedPartyAColor === normalizedPartyBColor;

      const handlePartyColorChange = (partyKey, value) => {
        const fieldName = partyKey === "A" ? "partyAColor" : "partyBColor";
        const normalized = normalizePartyColor(value, partyAccents[partyKey].color);
        step1Form.setValue(fieldName, normalized, { shouldDirty: true, shouldValidate: true });
        updateFormData(fieldName, normalized);
      };

      const handlePartyNameChange = (partyKey, value) => {
        const fieldName = partyKey === "A" ? "partyAName" : "partyBName";
        step1Form.setValue(fieldName, value, { shouldValidate: true, shouldDirty: true });
        updateFormData(fieldName, value);
      };

      const partyCards = [
        {
          key: "A",
          colorValue: partyAColorValue,
          normalizedColor: normalizedPartyAColor,
          nameValue: partyANameValue,
          fallbackName: "Party A",
          colorFieldProps: getPartyFieldProps("A", { variant: "simple", showBadge: false, showStripe: false }),
          nameFieldProps: getPartyFieldProps("A", { showBadge: false, showStripe: false }),
          error: step1Errors.partyAName?.message,
        },
        {
          key: "B",
          colorValue: partyBColorValue,
          normalizedColor: normalizedPartyBColor,
          nameValue: partyBNameValue,
          fallbackName: "Party B",
          colorFieldProps: getPartyFieldProps("B", { variant: "simple", showBadge: false, showStripe: false }),
          nameFieldProps: getPartyFieldProps("B", { showBadge: false, showStripe: false }),
          error: step1Errors.partyBName?.message,
        },
      ];

      return (
        <div className="space-y-3 sm:space-y-4">
          <CategoryHeader step={step} />
          <SectionSeparator title="Personalize each party" />
          <div className="rounded-lg border bg-card/40 p-3 sm:p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-2">
              <p className="text-sm sm:text-base text-muted-foreground">
                Start with the accent colors so every insight in later steps is easy to scan at a glance.
                Then add each person's name to tailor the coaching language automatically.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                You can choose from the quick picks below or fine-tune the color picker for a custom shade.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {partyCards.map(({ key, colorValue, normalizedColor, nameValue, fallbackName, colorFieldProps, nameFieldProps, error }) => {
              const displayName = nameValue || fallbackName;
              return (
                <section
                  key={key}
                  className={cn(
                    "party-setup-card space-y-4 rounded-xl border bg-background/60 p-4 shadow-sm transition",
                    "hover:shadow-md focus-within:ring-2 focus-within:ring-primary/40"
                  )}
                  style={{
                    "--party-setup-accent": normalizedColor,
                    "--party-setup-surface": toRgba(normalizedColor, 0.08),
                    "--party-setup-border": toRgba(normalizedColor, 0.35),
                  }}
                >
                  <header className="party-setup-card__header space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="party-setup-card__title text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        {fallbackName}
                      </h3>
                      <span className="party-setup-card__badge inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                        <span className="party-setup-card__badge-dot inline-block h-2.5 w-2.5 rounded-full border" style={{ backgroundColor: normalizedColor }} />
                        {displayName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pick a color that feels right for {displayName} and we'll use it throughout the toolkit.
                    </p>
                  </header>

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                    <div className="flex-1 space-y-2 md:max-w-[240px] md:flex-none">
                      <FormField
                        {...colorFieldProps}
                        id={`party${key}Color`}
                        label={`${displayName} color`}
                        type="color"
                        value={colorValue}
                        onChange={(value) => handlePartyColorChange(key, value)}
                        inputClassName="party-color-input"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        {RECOMMENDED_PARTY_COLORS.map((color) => {
                          const normalizedOption = normalizePartyColor(color, partyAccents[key].color);
                          const isActive = normalizedOption === normalizedColor;
                          return (
                            <button
                              key={`${key}-${color}`}
                              type="button"
                              className={cn(
                                "h-8 w-8 rounded-full border border-border transition-transform",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                                isActive ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : "hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => handlePartyColorChange(key, color)}
                              aria-label={`Use ${color} for ${displayName}`}
                            >
                              <span className="sr-only">Use {color} for {displayName}</span>
                            </button>
                          );
                        })}
                        <span className="text-[11px] text-muted-foreground font-mono ml-1">
                          {normalizedColor}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <EnhancedFormField
                        {...nameFieldProps}
                        id={`party${key}Name`}
                        label={`${fallbackName} name`}
                        placeholder={key === "A" ? "Enter first person's name" : "Enter second person's name"}
                        value={nameValue}
                        onChange={(value) => handlePartyNameChange(key, value)}
                        error={error}
                        required={true}
                        description={
                          key === "A"
                            ? "This helps us personalize prompts for the first person involved"
                            : "We'll tailor future reflections for the second person automatically"
                        }
                        autoSave={true}
                      />
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSwapPartyColors}
                className="party-accent-actions__button"
                disabled={isSameAccent}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" aria-hidden="true" /> Swap colors
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetPartyColors}
                className="party-accent-actions__button"
                disabled={isUsingDefaultPalette}
                aria-label="Restore default party colors"
              >
                <RefreshCcw className="h-4 w-4 mr-2" aria-hidden="true" /> Restore defaults
              </Button>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              You can always revisit this step to adjust names or colors if anything changes.
            </p>
          </div>

          <div className="party-accent-preview-grid">
            {Object.entries(partyDetails).map(([key, details]) => {
              const liveName = (key === "A" ? partyANameValue : partyBNameValue) || details.name;
              const liveAccent = createAccentConfig(
                key === "A" ? normalizedPartyAColor : normalizedPartyBColor,
                DEFAULT_PARTY_COLORS[key]
              );

              return (
                <PartyAccentPreviewCard
                  key={key}
                  partyKey={key}
                  details={{
                    ...details,
                    name: liveName,
                    accent: liveAccent,
                  }}
                  surfaces={themeSurfaces}
                />
              );
            })}
          </div>

          <SectionSeparator title="Conflict Overview" />
          <div className="form-grid form-grid-3">
            <DatePickerField
              id="dateOfIncident"
              label="Date of Incident"
              value={step1Form.watch("dateOfIncident")}
              onChange={(value) => {
                step1Form.setValue("dateOfIncident", value, { shouldDirty: true });
                updateFormData("dateOfIncident", value);
              }}
            />
            <DatePickerField
              id="dateOfMediation"
              label="Date of Mediation"
              value={step1Form.watch("dateOfMediation")}
              onChange={(value) => {
                step1Form.setValue("dateOfMediation", value, { shouldDirty: true });
                updateFormData("dateOfMediation", value);
              }}
            />
            <FormField
              id="locationOfConflict"
              label="Location of Conflict"
              placeholder="Where did this happen?"
              value={step1Form.watch("locationOfConflict")}
              onChange={(value) => {
                step1Form.setValue("locationOfConflict", value, { shouldDirty: true });
                updateFormData("locationOfConflict", value);
              }}
            />
          </div>

          <EnhancedFormField
            id="conflictDescription"
            label="Agreed Upon Description of Conflict"
            placeholder="Both parties should agree on this description of what happened..."
            value={step1Form.watch("conflictDescription")}
            onChange={(value) => {
              step1Form.setValue("conflictDescription", value, { shouldValidate: true, shouldDirty: true });
              updateFormData("conflictDescription", value);
            }}
            type="textarea"
            rows={4}
            error={step1Errors.conflictDescription?.message}
            required={true}
            description="Both parties should agree on this factual description of the conflict"
            showCharacterCount={true}
            maxLength={2000}
            smartSuggestions={true}
            fieldType="conflictDescription"
            context={context}
            showContextualHelp={true}
            autoSave={true}
          />
        </div>
      );
    }
    case 2:
      return (
        <div className="space-y-4 sm:space-y-6">
          <CategoryHeader step={step} />
          <IndividualReflection
            party="A"
            prefix="partyA"
            formData={formData}
            updateFormData={updateFormData}
            isFieldMissing={isFieldMissing}
            context={context}
            getPartyFieldProps={getPartyFieldProps}
            currentSubStep={currentSubStep}
          />
        </div>
      );

    case 3:
      return (
        <div className="space-y-4 sm:space-y-6">
          <CategoryHeader step={step} />
          <IndividualReflection
            party="B"
            prefix="partyB"
            formData={formData}
            updateFormData={updateFormData}
            isFieldMissing={isFieldMissing}
            context={context}
            getPartyFieldProps={getPartyFieldProps}
            currentSubStep={currentSubStep}
          />
        </div>
      );

    case 4:
      return (
        <div className="space-y-4 sm:space-y-6">
          <CategoryHeader step={step} />
          <SectionSeparator title="ABCDE Model Discussion" />
          <p className="text-center text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
            Work through this cognitive behavioral model together to understand
            the conflict better.
          </p>

          <div className="space-y-4 sm:space-y-6">
            <EnhancedFormField
              id="activatingEvent"
              label="A - Activating Event"
              description="What actually happened? Stick to observable facts."
              placeholder="Describe the factual events that triggered this conflict..."
              value={formData.activatingEvent}
              onChange={(value) => updateFormData("activatingEvent", value)}
              type="textarea"
              rows={3}
              required={true}
              showCharacterCount={true}
              maxLength={1000}
              smartSuggestions={true}
              fieldType="activatingEvent"
              context={context}
              showContextualHelp={true}
            />

            <div className="form-grid form-grid-2">
              <EnhancedFormField
                {...getPartyFieldProps("A")}
                id="partyABeliefs"
                label={`B - ${formData.partyAName || "Party A"} Beliefs`}
                description="What thoughts or beliefs do you have about this event?"
                placeholder="Your thoughts and beliefs about what happened..."
                value={formData.partyABeliefs}
                onChange={(value) => updateFormData("partyABeliefs", value)}
                type="textarea"
                rows={3}
                required={true}
                showCharacterCount={true}
                maxLength={800}
                smartSuggestions={true}
                fieldType="thoughts"
                context={context}
              />
              <EnhancedFormField
                {...getPartyFieldProps("B")}
                id="partyBBeliefs"
                label={`B - ${formData.partyBName || "Party B"} Beliefs`}
                description="What thoughts or beliefs do you have about this event?"
                placeholder="Your thoughts and beliefs about what happened..."
                value={formData.partyBBeliefs}
                onChange={(value) => updateFormData("partyBBeliefs", value)}
                type="textarea"
                rows={3}
                required={true}
                showCharacterCount={true}
                maxLength={800}
                smartSuggestions={true}
                fieldType="thoughts"
                context={context}
              />
            </div>

            <div className="form-grid form-grid-2">
              <EnhancedFormField
                {...getPartyFieldProps("A")}
                id="partyAConsequences"
                label={`C - ${formData.partyAName || "Party A"} Consequences`}
                description="How did your beliefs make you feel and behave?"
                placeholder="Your emotional and behavioral responses..."
                value={formData.partyAConsequences}
                onChange={(value) =>
                  updateFormData("partyAConsequences", value)
                }
                type="textarea"
                rows={3}
                showCharacterCount={true}
                maxLength={600}
              />
              <EnhancedFormField
                {...getPartyFieldProps("B")}
                id="partyBConsequences"
                label={`C - ${formData.partyBName || "Party B"} Consequences`}
                description="How did your beliefs make you feel and behave?"
                placeholder="Your emotional and behavioral responses..."
                value={formData.partyBConsequences}
                onChange={(value) =>
                  updateFormData("partyBConsequences", value)
                }
                type="textarea"
                rows={3}
                showCharacterCount={true}
                maxLength={600}
              />
            </div>

            <div className="form-grid form-grid-2">
              <EnhancedFormField
                {...getPartyFieldProps("A")}
                id="partyADisputations"
                label={`D - ${formData.partyAName || "Party A"} Disputations`}
                description="Challenge your beliefs. Are they helpful? Accurate? Realistic?"
                placeholder="Question and challenge your initial beliefs..."
                value={formData.partyADisputations}
                onChange={(value) =>
                  updateFormData("partyADisputations", value)
                }
                type="textarea"
                rows={3}
                showCharacterCount={true}
                maxLength={600}
              />
              <EnhancedFormField
                {...getPartyFieldProps("B")}
                id="partyBDisputations"
                label={`D - ${formData.partyBName || "Party B"} Disputations`}
                description="Challenge your beliefs. Are they helpful? Accurate? Realistic?"
                placeholder="Question and challenge your initial beliefs..."
                value={formData.partyBDisputations}
                onChange={(value) =>
                  updateFormData("partyBDisputations", value)
                }
                type="textarea"
                rows={3}
                showCharacterCount={true}
                maxLength={600}
              />
            </div>

            <EnhancedFormField
              id="effectsReflections"
              label="E - Effects & Reflections"
              description="What new insights have emerged? How do you both feel now?"
              placeholder="Reflect on new perspectives and feelings that have emerged..."
              value={formData.effectsReflections}
              onChange={(value) => updateFormData("effectsReflections", value)}
              type="textarea"
              rows={4}
              showCharacterCount={true}
              maxLength={1000}
            />
          </div>
        </div>
      );

    case 5:
      return (
        <div className="space-y-4 sm:space-y-6">
          <CategoryHeader step={step} />
          <SectionSeparator title="Solution Development" />
          <p className="text-center text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
            Now let's explore possibilities and develop solutions together.
          </p>

          <div className="space-y-4 sm:space-y-6">
            <div className="form-grid form-grid-2">
              <EnhancedFormField
                {...getPartyFieldProps("A")}
                id="partyAMiracle"
                label={`${formData.partyAName || "Party A"} - Miracle Question`}
                description="If you woke up tomorrow and this conflict was completely resolved, what would be different?"
                placeholder="Describe your ideal resolution..."
                value={formData.partyAMiracle}
                onChange={(value) => updateFormData("partyAMiracle", value)}
                type="textarea"
                rows={4}
                required={true}
                showCharacterCount={true}
                maxLength={1000}
                smartSuggestions={true}
                fieldType="miracleQuestion"
                context={context}
                showContextualHelp={true}
              />
              <EnhancedFormField
                {...getPartyFieldProps("B")}
                id="partyBMiracle"
                label={`${formData.partyBName || "Party B"} - Miracle Question`}
                description="If you woke up tomorrow and this conflict was completely resolved, what would be different?"
                placeholder="Describe your ideal resolution..."
                value={formData.partyBMiracle}
                onChange={(value) => updateFormData("partyBMiracle", value)}
                type="textarea"
                rows={4}
                required={true}
                showCharacterCount={true}
                maxLength={1000}
                smartSuggestions={true}
                fieldType="miracleQuestion"
                context={context}
                showContextualHelp={true}
              />
            </div>

            <div className="form-grid form-grid-2">
              <StructuredListInput
                {...getPartyFieldProps("A")}
                id="partyATop3Solutions"
                label={`${formData.partyAName || "Party A"} - Top 3 Solutions`}
                placeholder="Add solution..."
                itemPlaceholder="Enter a solution..."
                value={formData.partyATop3Solutions || []}
                onChange={(value) => updateFormData("partyATop3Solutions", value)}
                maxItems={3}
                itemType="text"
                description="List your top 3 preferred solutions for resolving this conflict"
              />
              <StructuredListInput
                {...getPartyFieldProps("B")}
                id="partyBTop3Solutions"
                label={`${formData.partyBName || "Party B"} - Top 3 Solutions`}
                placeholder="Add solution..."
                itemPlaceholder="Enter a solution..."
                value={formData.partyBTop3Solutions || []}
                onChange={(value) => updateFormData("partyBTop3Solutions", value)}
                maxItems={3}
                itemType="text"
                description="List your top 3 preferred solutions for resolving this conflict"
              />
            </div>

            <SectionSeparator title="Understanding Each Other" />

            <div className="form-grid form-grid-2">
              <EnhancedFormField
                {...getPartyFieldProps("A")}
                id="partyAPerspective"
                label={`${
                  formData.partyAName || "Party A"
                } - Other's Perspective`}
                description="Try to understand the other person's point of view."
                placeholder="What might the other person be thinking or feeling?"
                value={formData.partyAPerspective}
                onChange={(value) => updateFormData("partyAPerspective", value)}
                type="textarea"
                rows={3}
                showCharacterCount={true}
                maxLength={600}
              />
              <EnhancedFormField
                {...getPartyFieldProps("B")}
                id="partyBPerspective"
                label={`${
                  formData.partyBName || "Party B"
                } - Other's Perspective`}
                description="Try to understand the other person's point of view."
                placeholder="What might the other person be thinking or feeling?"
                value={formData.partyBPerspective}
                onChange={(value) => updateFormData("partyBPerspective", value)}
                type="textarea"
                rows={3}
                showCharacterCount={true}
                maxLength={600}
              />
            </div>

            <EnhancedFormField
              id="compromiseSolutions"
              label="Compromise Solutions"
              description="What solutions can you both agree on? What compromises are you willing to make?"
              placeholder="Describe the solutions you both can accept..."
              value={formData.compromiseSolutions}
              onChange={(value) => updateFormData("compromiseSolutions", value)}
              type="textarea"
              rows={4}
              required={true}
              showCharacterCount={true}
              maxLength={1000}
              smartSuggestions={true}
              fieldType="solutions"
              context={context}
              showContextualHelp={true}
            />
          </div>
        </div>
      );

    case 6:
      return (
        <div className="space-y-4 sm:space-y-6">
          <CategoryHeader step={step} />
          <SectionSeparator title="Agreement & Action Steps" />
          <p className="text-center text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
            Finalize your agreement and create actionable next steps.
          </p>

          <div className="space-y-4 sm:space-y-6">
            <div className="form-grid form-grid-2">
              <FormField
                {...getPartyFieldProps("A", { variant: "simple", showBadge: false })}
                id="partyAUnmetNeeds"
                label={`${formData.partyAName || "Party A"} - Unmet Needs`}
                description="What needs of yours weren't being met in this situation?"
                placeholder="Describe your unmet needs..."
                value={formData.partyAUnmetNeeds}
                onChange={(value) => updateFormData("partyAUnmetNeeds", value)}
                type="textarea"
                rows={3}
              />
              <FormField
                {...getPartyFieldProps("B", { variant: "simple", showBadge: false })}
                id="partyBUnmetNeeds"
                label={`${formData.partyBName || "Party B"} - Unmet Needs`}
                description="What needs of yours weren't being met in this situation?"
                placeholder="Describe your unmet needs..."
                value={formData.partyBUnmetNeeds}
                onChange={(value) => updateFormData("partyBUnmetNeeds", value)}
                type="textarea"
                rows={3}
              />
            </div>

            <div className="form-grid form-grid-2">
              <FormField
                {...getPartyFieldProps("A", { variant: "simple", showBadge: false })}
                id="partyANeedsInPractice"
                label={`${
                  formData.partyAName || "Party A"
                } - Needs in Practice`}
                description="How can these needs be met going forward?"
                placeholder="Practical ways to meet your needs..."
                value={formData.partyANeedsInPractice}
                onChange={(value) =>
                  updateFormData("partyANeedsInPractice", value)
                }
                type="textarea"
                rows={3}
              />
              <FormField
                {...getPartyFieldProps("B", { variant: "simple", showBadge: false })}
                id="partyBNeedsInPractice"
                label={`${
                  formData.partyBName || "Party B"
                } - Needs in Practice`}
                description="How can these needs be met going forward?"
                placeholder="Practical ways to meet your needs..."
                value={formData.partyBNeedsInPractice}
                onChange={(value) =>
                  updateFormData("partyBNeedsInPractice", value)
                }
                type="textarea"
                rows={3}
              />
            </div>

            <StructuredListInput
              id="actionSteps"
              label="Specific Action Steps"
              description="What specific actions will each person take? Include deadlines and accountability measures."
              placeholder="Add action step..."
              itemPlaceholder="Enter action step with deadline..."
              value={formData.actionSteps || []}
              onChange={(value) => updateFormData("actionSteps", value)}
              itemType="textarea"
              allowReorder={true}
            />

            <div className="form-grid form-grid-2">
              <EnhancedFormField
                id="followUpDate"
                label="Follow-up Date"
                description="When should you check in on progress?"
                type="date"
                value={formData.followUpDate}
                onChange={(value) => updateFormData("followUpDate", value)}
                required={true}
              />
              <EnhancedFormField
                id="additionalSupport"
                label="Additional Support Needed"
                description="What additional resources or support might be helpful?"
                placeholder="Describe any additional support needed..."
                value={formData.additionalSupport}
                onChange={(value) => updateFormData("additionalSupport", value)}
                type="textarea"
                rows={3}
                showCharacterCount={true}
                maxLength={500}
              />
            </div>
          </div>
        </div>
      );

    case 7:
      return (
        <div className="space-y-4 sm:space-y-6">
          <CategoryHeader step={step} />
          <SectionSeparator title="Export Your Session" />
          <p className="text-center text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
            Congratulations! You've completed the conflict mediation process.
            Export your session data to save your work and share with others.
          </p>

          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                Session Summary
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Your mediation session included{" "}
                {formData.partyAName || "Party A"} and{" "}
                {formData.partyBName || "Party B"}
              </p>
              {formData.dateOfMediation && (
                <p className="text-sm sm:text-base text-muted-foreground">
                  Mediation Date:{" "}
                  {new Date(formData.dateOfMediation).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <h4 className="text-base font-semibold">Export Options</h4>
                <div className="space-y-3">
                  <Button
                    onClick={onExportJSON}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 h-12"
                  >
                    <Download className="h-4 w-4" />
                    Export as JSON
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Download all session data in JSON format for backup or
                    import into other systems.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold">Generate Report</h4>
                <div className="space-y-3">
                  <Button
                    onClick={async () => {
                      setIsGeneratingPDF(true);
                      setPdfError(null);
                      
                      const result = await executeAsync(async () => {
                        const { generateEnhancedPDFWithRetry } = await import("../utils/pdfGenerator");
                        return await generateEnhancedPDFWithRetry(formData);
                      }, { operation: 'pdf_generation' });
                      
                      setIsGeneratingPDF(false);
                      
                      if (result.success) {
                        toast.success("PDF generated successfully!");
                      } else {
                        setPdfError(result.error);
                      }
                    }}
                    disabled={isGeneratingPDF}
                    className="w-full flex items-center justify-center gap-2 h-12"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Export as PDF
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Create a professional PDF report of your mediation session
                    for sharing or documentation.
                  </p>
                  
                  {/* PDF Loading/Error State */}
                  {isGeneratingPDF && (
                    <PDFLoadingState
                      isLoading={true}
                      message="Generating PDF report..."
                    />
                  )}
                  
                  {pdfError && (
                    <PDFLoadingState
                      isLoading={false}
                      error={pdfError}
                      onRetry={() => {
                        setPdfError(null);
                        // Retry logic would be handled by the button click
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-semibold">Import Session</h4>
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer">
                  <input
                    type="file"
                    accept="application/json"
                    className="sr-only"
                    onChange={(e) => handleImportJSON(e.target.files?.[0])}
                    disabled={isImportingFile}
                  />
                  <Button 
                    variant="outline" 
                    className={cn(
                      "flex items-center gap-2 pointer-events-none",
                      isImportingFile && "opacity-50"
                    )}
                    disabled={isImportingFile}
                    asChild
                  >
                    <span>
                      {isImportingFile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Import from JSON
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">
                  Load a previously saved JSON file to restore your session.
                </p>
              </div>
              
              {/* File Import Loading/Error State */}
              {isImportingFile && (
                <FileLoadingState
                  isLoading={true}
                  message="Processing file..."
                />
              )}
              
              {importError && (
                <FileLoadingState
                  isLoading={false}
                  error={importError}
                  onRetry={() => {
                    setImportError(null);
                    // Retry would be handled by selecting a new file
                  }}
                />
              )}
            </div>

            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
              <div className="text-center space-y-3">
                <h4 className="text-base font-semibold">What's Next?</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Review your action steps and follow-up date</p>
                  <p>• Schedule your follow-up meeting</p>
                  <p>• Continue open communication between parties</p>
                  <p>• Consider additional support if needed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return <div>Invalid step</div>;
  }
};

export default React.memo(StepContent);
