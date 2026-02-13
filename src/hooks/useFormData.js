import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const initialState = {
    partyAName: "",
    partyBName: "",
    partyAColor: "#6B8E47",
    partyBColor: "#0D9488",
    partyAEmoji: "",
    partyBEmoji: "",
    dateOfIncident: "",
    dateOfMediation: "",
    locationOfConflict: "",
    conflictDescription: "",
    // Individual Reflection A
    partyAThoughts: "",
    partyASelectedEmotionWords: [],
    partyAEmotionChartPosition: null,
    partyAAggressiveApproach: "",
    partyAPassiveApproach: "",
    partyAAssertiveApproach: "",
    partyAWhyBecause: "",
    // Individual Reflection B
    partyBThoughts: "",
    partyBSelectedEmotionWords: [],
    partyBEmotionChartPosition: null,
    partyBAggressiveApproach: "",
    partyBPassiveApproach: "",
    partyBAssertiveApproach: "",
    partyBWhyBecause: "",
    // ABCDE Model
    activatingEvent: "",
    partyABeliefs: "",
    partyBBeliefs: "",
    partyAConsequences: "",
    partyBConsequences: "",
    partyADisputations: "",
    partyBDisputations: "",
    effectsReflections: "",
    // Solution Development
    partyAMiracle: "",
    partyBMiracle: "",
    partyATop3Solutions: [],
    partyBTop3Solutions: [],
    partyAPerspective: "",
    partyBPerspective: "",
    compromiseSolutions: "",
    // Agreement & Action Steps
    partyAUnmetNeeds: "",
    partyBUnmetNeeds: "",
    partyANeedsInPractice: "",
    partyBNeedsInPractice: "",
    actionSteps: [],
    followUpDate: "",
    additionalSupport: "",
};

// Static helper functions moved outside the hook
const getRequiredFieldsForStep = (step) => {
    switch (step) {
        case 1:
            return ["partyAName", "partyBName", "conflictDescription"];
        case 2:
            return ["partyAThoughts", "partyAAssertiveApproach"];
        case 3:
            return ["partyBThoughts", "partyBAssertiveApproach"];
        case 4:
            return ["activatingEvent", "partyABeliefs", "partyBBeliefs"];
        case 5:
            return ["partyAMiracle", "partyBMiracle", "compromiseSolutions", "partyATop3Solutions", "partyBTop3Solutions"];
        case 6:
            return ["actionSteps", "followUpDate"];
        case 7:
            return [];
        default:
            return [];
    }
};

const getRequiredFieldsForSubStep = (step, subStep) => {
    if (step === 2) { // Party A Individual Reflection
        if (subStep === 0) return ["partyAThoughts"];
        if (subStep === 1) return [];
        if (subStep === 2) return ["partyAAssertiveApproach"];
    }
    if (step === 3) { // Party B Individual Reflection
        if (subStep === 0) return ["partyBThoughts"];
        if (subStep === 1) return [];
        if (subStep === 2) return ["partyBAssertiveApproach"];
    }
    return getRequiredFieldsForStep(step);
};

/**
 * Custom hook for managing conflict mediation form data
 * @returns {Object} Form data state and operations
 */
export const useFormData = () => {
    const STORAGE_KEY = "mediation_form_v1";

    const [formData, setFormData] = useState(initialState);
    const [loadedFromStorage, setLoadedFromStorage] = useState(false);

    const loadFromStorage = useCallback(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                setFormData({ ...initialState, ...data });
                setLoadedFromStorage(true);
            }
        } catch (e) {
            console.error("Failed to load form data from storage:", e);
        }
    }, []);

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    const saveToStorage = useCallback((data) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save form data to storage:", e);
        }
    }, []);

    useEffect(() => {
        if (loadedFromStorage) {
            saveToStorage(formData);
        }
    }, [formData, loadedFromStorage, saveToStorage]);

    /**
     * Update a single form field
     */
    const updateFormData = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    /**
     * Update multiple form fields at once
     */
    const updateMultipleFields = useCallback((updates) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    }, []);

    /**
     * Load form data from a plain object (e.g., imported JSON)
     */
    const loadFromJSON = useCallback((dataObject) => {
        if (!dataObject || typeof dataObject !== "object") return;
        const allowedKeys = Object.keys(initialState);
        const sanitized = Object.fromEntries(
            Object.entries(dataObject).filter(([key]) => allowedKeys.includes(key))
        );
        setFormData((prev) => ({ ...prev, ...sanitized }));
    }, []);

    /**
     * Reset form data to initial state and clear saved storage
     */
    const resetFormData = useCallback(() => {
        setFormData(initialState);
        setLoadedFromStorage(false);
        try {
            localStorage.removeItem(STORAGE_KEY);
            toast.success("Form data reset successfully");
        } catch (e) {
            console.error("Failed to clear storage:", e);
        }
    }, []);

    /**
     * Get form data for a specific step
     */
    const getStepData = useCallback((step) => {
        switch (step) {
            case 1:
                return {
                    partyAName: formData.partyAName,
                    partyBName: formData.partyBName,
                    partyAColor: formData.partyAColor,
                    partyBColor: formData.partyBColor,
                    partyAEmoji: formData.partyAEmoji,
                    partyBEmoji: formData.partyBEmoji,
                    dateOfIncident: formData.dateOfIncident,
                    dateOfMediation: formData.dateOfMediation,
                    locationOfConflict: formData.locationOfConflict,
                    conflictDescription: formData.conflictDescription,
                };
            case 2:
                return {
                    partyAThoughts: formData.partyAThoughts,
                    partyASelectedEmotionWords: formData.partyASelectedEmotionWords,
                    partyAEmotionChartPosition: formData.partyAEmotionChartPosition,
                    partyAAggressiveApproach: formData.partyAAggressiveApproach,
                    partyAPassiveApproach: formData.partyAPassiveApproach,
                    partyAAssertiveApproach: formData.partyAAssertiveApproach,
                    partyAWhyBecause: formData.partyAWhyBecause,
                };
            case 3:
                return {
                    partyBThoughts: formData.partyBThoughts,
                    partyBSelectedEmotionWords: formData.partyBSelectedEmotionWords,
                    partyBEmotionChartPosition: formData.partyBEmotionChartPosition,
                    partyBAggressiveApproach: formData.partyBAggressiveApproach,
                    partyBPassiveApproach: formData.partyBPassiveApproach,
                    partyBAssertiveApproach: formData.partyBAssertiveApproach,
                    partyBWhyBecause: formData.partyBWhyBecause,
                };
            case 4:
                return {
                    activatingEvent: formData.activatingEvent,
                    partyABeliefs: formData.partyABeliefs,
                    partyBBeliefs: formData.partyBBeliefs,
                    partyAConsequences: formData.partyAConsequences,
                    partyBConsequences: formData.partyBConsequences,
                    partyADisputations: formData.partyADisputations,
                    partyBDisputations: formData.partyBDisputations,
                    effectsReflections: formData.effectsReflections,
                };
            case 5:
                return {
                    partyAMiracle: formData.partyAMiracle,
                    partyBMiracle: formData.partyBMiracle,
                    partyATop3Solutions: formData.partyATop3Solutions,
                    partyBTop3Solutions: formData.partyBTop3Solutions,
                    partyAPerspective: formData.partyAPerspective,
                    partyBPerspective: formData.partyBPerspective,
                    compromiseSolutions: formData.compromiseSolutions,
                };
            case 6:
                return {
                    partyAUnmetNeeds: formData.partyAUnmetNeeds,
                    partyBUnmetNeeds: formData.partyBUnmetNeeds,
                    partyANeedsInPractice: formData.partyANeedsInPractice,
                    partyBNeedsInPractice: formData.partyBNeedsInPractice,
                    actionSteps: formData.actionSteps,
                    followUpDate: formData.followUpDate,
                    additionalSupport: formData.additionalSupport,
                };
            case 7:
                return {};
            default:
                return {};
        }
    }, [formData]);

    /**
     * Check if a step has required data filled
     */
    const isStepComplete = useCallback((step, subStep = 0) => {
        const fields = getRequiredFieldsForSubStep(step, subStep);
        if (fields.length === 0) return true;

        return fields.every(field => {
            const value = formData[field];
            if (Array.isArray(value)) {
                return value.length > 0 && value.every(item => 
                    typeof item === 'string' ? item.trim() !== '' : 
                    typeof item === 'object' ? item.text && item.text.trim() !== '' : false
                );
            }
            return value && value.toString().trim() !== "";
        });
    }, [formData]);

    /**
     * Get list of missing required fields for a step
     */
    const getMissingFieldsForStep = useCallback((step, subStep = 0) => {
        const requiredFields = getRequiredFieldsForSubStep(step, subStep);
        return requiredFields.filter(field => {
            const value = formData[field];
            if (Array.isArray(value)) {
                return value.length === 0;
            }
            return !value || value.toString().trim() === "";
        });
    }, [formData]);

    return {
        formData,
        updateFormData,
        updateMultipleFields,
        loadFromJSON,
        resetFormData,
        getStepData,
        isStepComplete,
        getMissingFieldsForStep,
        getRequiredFieldsForStep,
        getRequiredFieldsForSubStep,
        loadedFromStorage,
    };
};
