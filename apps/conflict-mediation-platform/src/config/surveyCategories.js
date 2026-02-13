/**
 * Survey Categories Configuration
 * Organizes the conflict mediation survey into logical categories
 */

export const SURVEY_CATEGORIES = {
  SETUP: {
    id: 'setup',
    name: 'Setup & Information',
    description: 'Gather basic information about the conflict and parties',
    color: 'blue',
    icon: '📋',
    steps: [1]
  },
  INDIVIDUAL_REFLECTION: {
    id: 'individual_reflection',
    name: 'Individual Reflection',
    description: 'Each party reflects on their thoughts, emotions, and communication approaches',
    color: 'purple',
    icon: '🤔',
    steps: [2, 3]
  },
  ANALYSIS: {
    id: 'analysis',
    name: 'Analysis & Understanding',
    description: 'Use the ABCDE model to analyze the conflict together',
    color: 'green',
    icon: '🔍',
    steps: [4]
  },
  SOLUTION_DEVELOPMENT: {
    id: 'solution_development',
    name: 'Solution Development',
    description: 'Explore solutions and develop compromise approaches',
    color: 'orange',
    icon: '💡',
    steps: [5]
  },
  AGREEMENT: {
    id: 'agreement',
    name: 'Agreement & Planning',
    description: 'Finalize agreements and create actionable next steps',
    color: 'red',
    icon: '🤝',
    steps: [6]
  },
  EXPORT: {
    id: 'export',
    name: 'Export & Summary',
    description: 'Save and share your mediation session results',
    color: 'gray',
    icon: '📤',
    steps: [7]
  }
};

export const getCategoryByStep = (step) => {
  return Object.values(SURVEY_CATEGORIES).find(category => 
    category.steps.includes(step)
  );
};

export const getCategoryProgress = (formData, category) => {
  const requiredSteps = category.steps.filter(
    (step) => getRequiredFieldsForStep(step).length > 0
  );

  const totalSteps = requiredSteps.length;
  let completedSteps = 0;

  requiredSteps.forEach((step) => {
    if (isStepComplete(formData, step)) {
      completedSteps++;
    }
  });

  const optionalSteps = category.steps.length - requiredSteps.length;

  return {
    completed: completedSteps,
    total: totalSteps,
    optional: optionalSteps,
    percentage:
      totalSteps > 0
        ? Math.round((completedSteps / totalSteps) * 100)
        : 0,
  };
};

// Helper function to check if a step is complete
const isStepComplete = (formData, step) => {
  const requiredFields = getRequiredFieldsForStep(step);
  
  return requiredFields.every(field => {
    const value = formData[field];
    if (Array.isArray(value)) {
      return value.length > 0 && value.every(item => 
        typeof item === 'string' ? item.trim() !== '' : 
        typeof item === 'object' ? item.text && item.text.trim() !== '' : false
      );
    }
    return value && value.toString().trim() !== "";
  });
};

// Required fields for each step (moved from useFormData for reuse)
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

export const getOverallProgress = (formData) => {
  const categories = Object.values(SURVEY_CATEGORIES);
  let totalSteps = 0;
  let completedSteps = 0;

  categories.forEach((category) => {
    const progress = getCategoryProgress(formData, category);
    totalSteps += progress.total;
    completedSteps += progress.completed;
  });

  return {
    completed: completedSteps,
    total: totalSteps,
    percentage:
      totalSteps > 0
        ? Math.round((completedSteps / totalSteps) * 100)
        : 0,
  };
};

