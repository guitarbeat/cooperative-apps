import React, { useState, useMemo } from "react";
import { Lightbulb, RefreshCw, ChevronDown } from "lucide-react";
import React, { useState, useEffect, useId } from "react";
import { Lightbulb, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { SUGGESTION_TEMPLATES, HELP_TEXTS } from "../config/smartSuggestionsData";

// Static data moved outside to prevent recreation on every render
const SUGGESTION_TEMPLATES = {
  conflictDescription: [
    "Communication breakdown between team members",
    "Disagreement over project priorities and deadlines",
    "Personality clash affecting work collaboration",
    "Misunderstanding about roles and responsibilities",
    "Conflict over resource allocation and budget",
    "Different working styles causing friction",
    "Disagreement about decision-making process",
    "Conflict arising from unclear expectations",
  ],
  thoughts: [
    "I feel like my concerns aren't being heard",
    "I believe we have different priorities and goals",
    "I think there's a misunderstanding about expectations",
    "I feel frustrated because I'm not getting the support I need",
    "I believe we need better communication protocols",
    "I think we should focus on finding common ground",
    "I feel like we're not working as a team",
    "I believe we need to clarify our roles and responsibilities",
  ],
  assertiveApproach: [
    "I would like to discuss this issue openly and find a solution together",
    "I understand your perspective, and I'd like to share mine as well",
    "I believe we can work through this by focusing on our common goals",
    "I'd appreciate it if we could find a compromise that works for both of us",
    "I think we should take some time to understand each other's needs better",
    "I would like to establish clear communication guidelines going forward",
    "I believe we can resolve this by being honest about our concerns",
    "I'd like to work together to prevent this issue from happening again",
  ],
  activatingEvent: [
    "During the team meeting on [date], there was a disagreement about...",
    "The incident occurred when [person] said/did [specific action]",
    "The conflict started when we received conflicting instructions about...",
    "The issue arose during a project review when [specific event] happened",
    "The disagreement began when [person] made a decision without consulting...",
    "The conflict started during a discussion about [topic] when [specific action]",
    "The incident occurred in [location] when [specific event] took place",
    "The disagreement began when we had different interpretations of...",
  ],
  miracleQuestion: [
    "We would be communicating openly and honestly with each other",
    "We would have clear expectations and roles defined",
    "We would be working together as a cohesive team",
    "We would have regular check-ins to prevent future conflicts",
    "We would respect each other's perspectives and working styles",
    "We would have established protocols for handling disagreements",
    "We would be focused on our shared goals and objectives",
    "We would have a positive and collaborative working relationship",
  ],
  solutions: [
    "Establish weekly check-in meetings to discuss progress and concerns",
    "Create a shared document outlining roles and responsibilities",
    "Implement a conflict resolution protocol for future disagreements",
    "Schedule regular team-building activities to improve relationships",
    "Set up a communication channel for immediate issue resolution",
    "Create a feedback system for ongoing improvement",
    "Establish clear decision-making processes and criteria",
    "Develop a shared understanding of project goals and priorities",
  ],
  actionSteps: [
    "Schedule a follow-up meeting in 2 weeks to review progress",
    "Create a shared action plan document with specific deadlines",
    "Assign specific responsibilities to each party with clear timelines",
    "Establish a communication protocol for ongoing updates",
    "Set up regular check-ins to monitor progress and address issues",
    "Create a feedback mechanism for continuous improvement",
    "Document lessons learned to prevent future conflicts",
    "Establish accountability measures and success metrics",
  ],
};

const HELP_TEXTS = {
  conflictDescription: {
    title: "Describing the Conflict",
    tips: [
      "Focus on observable facts, not interpretations",
      "Include when and where the conflict occurred",
      "Describe specific actions or events that happened",
      "Avoid blame or judgmental language",
      "Ensure both parties agree on this description"
    ]
  },
  thoughts: {
    title: "Expressing Your Thoughts",
    tips: [
      "Be honest about your beliefs and assumptions",
      "Use 'I think' or 'I believe' statements",
      "Avoid making assumptions about the other person's intentions",
      "Focus on your own perspective and feelings",
      "Be specific about what you think happened"
    ]
  },
  assertiveApproach: {
    title: "Assertive Communication",
    tips: [
      "Use 'I' statements to express your needs",
      "Be respectful and considerate of the other person",
      "Focus on finding solutions, not assigning blame",
      "Be clear about what you want to achieve",
      "Listen actively to the other person's response"
    ]
  },
  miracleQuestion: {
    title: "The Miracle Question",
    tips: [
      "Imagine waking up tomorrow with the conflict completely resolved",
      "Describe what would be different in your relationship",
      "Focus on positive changes and improvements",
      "Be specific about what you would see, hear, or experience",
      "Think about how both parties would feel and behave"
    ]
  },
  solutions: {
    title: "Finding Solutions",
    tips: [
      "Focus on solutions that work for both parties",
      "Be creative and open to new ideas",
      "Consider both short-term and long-term solutions",
      "Think about what each person can do differently",
      "Aim for win-win outcomes whenever possible"
    ]
  }
};

// Pure helper function to generate suggestions
const getSuggestions = (type, value, ctx) => {
  if (!type || !value || value.length <= 2) {
    return [];
  }

  let generatedSuggestions = SUGGESTION_TEMPLATES[type] || [];

  // Filter suggestions based on current value
  if (value && value.trim()) {
    const normalizedValue = value.toLowerCase();
    generatedSuggestions = generatedSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(normalizedValue) ||
      normalizedValue.includes(suggestion.toLowerCase())
    );
  }

  // Add context-specific suggestions
  if (ctx.partyAName && ctx.partyBName && generatedSuggestions.length > 0) {
    generatedSuggestions = generatedSuggestions.map(suggestion =>
      suggestion.replace("[person]", ctx.partyAName || "the other person")
    );
  }

  return generatedSuggestions.slice(0, 5); // Limit to 5 suggestions
};

const SUGGESTION_TEMPLATES = {
  conflictDescription: [
    "Communication breakdown between team members",
    "Disagreement over project priorities and deadlines",
    "Personality clash affecting work collaboration",
    "Misunderstanding about roles and responsibilities",
    "Conflict over resource allocation and budget",
    "Different working styles causing friction",
    "Disagreement about decision-making process",
    "Conflict arising from unclear expectations",
  ],
  thoughts: [
    "I feel like my concerns aren't being heard",
    "I believe we have different priorities and goals",
    "I think there's a misunderstanding about expectations",
    "I feel frustrated because I'm not getting the support I need",
    "I believe we need better communication protocols",
    "I think we should focus on finding common ground",
    "I feel like we're not working as a team",
    "I believe we need to clarify our roles and responsibilities",
  ],
  assertiveApproach: [
    "I would like to discuss this issue openly and find a solution together",
    "I understand your perspective, and I'd like to share mine as well",
    "I believe we can work through this by focusing on our common goals",
    "I'd appreciate it if we could find a compromise that works for both of us",
    "I think we should take some time to understand each other's needs better",
    "I would like to establish clear communication guidelines going forward",
    "I believe we can resolve this by being honest about our concerns",
    "I'd like to work together to prevent this issue from happening again",
  ],
  activatingEvent: [
    "During the team meeting on [date], there was a disagreement about...",
    "The incident occurred when [person] said/did [specific action]",
    "The conflict started when we received conflicting instructions about...",
    "The issue arose during a project review when [specific event] happened",
    "The disagreement began when [person] made a decision without consulting...",
    "The conflict started during a discussion about [topic] when [specific action]",
    "The incident occurred in [location] when [specific event] took place",
    "The disagreement began when we had different interpretations of...",
  ],
  miracleQuestion: [
    "We would be communicating openly and honestly with each other",
    "We would have clear expectations and roles defined",
    "We would be working together as a cohesive team",
    "We would have regular check-ins to prevent future conflicts",
    "We would respect each other's perspectives and working styles",
    "We would have established protocols for handling disagreements",
    "We would be focused on our shared goals and objectives",
    "We would have a positive and collaborative working relationship",
  ],
  solutions: [
    "Establish weekly check-in meetings to discuss progress and concerns",
    "Create a shared document outlining roles and responsibilities",
    "Implement a conflict resolution protocol for future disagreements",
    "Schedule regular team-building activities to improve relationships",
    "Set up a communication channel for immediate issue resolution",
    "Create a feedback system for ongoing improvement",
    "Establish clear decision-making processes and criteria",
    "Develop a shared understanding of project goals and priorities",
  ],
  actionSteps: [
    "Schedule a follow-up meeting in 2 weeks to review progress",
    "Create a shared action plan document with specific deadlines",
    "Assign specific responsibilities to each party with clear timelines",
    "Establish a communication protocol for ongoing updates",
    "Set up regular check-ins to monitor progress and address issues",
    "Create a feedback mechanism for continuous improvement",
    "Document lessons learned to prevent future conflicts",
    "Establish accountability measures and success metrics",
  ],
};

const HELP_TEXTS = {
  conflictDescription: {
    title: "Describing the Conflict",
    tips: [
      "Focus on observable facts, not interpretations",
      "Include when and where the conflict occurred",
      "Describe specific actions or events that happened",
      "Avoid blame or judgmental language",
      "Ensure both parties agree on this description"
    ]
  },
  thoughts: {
    title: "Expressing Your Thoughts",
    tips: [
      "Be honest about your beliefs and assumptions",
      "Use 'I think' or 'I believe' statements",
      "Avoid making assumptions about the other person's intentions",
      "Focus on your own perspective and feelings",
      "Be specific about what you think happened"
    ]
  },
  assertiveApproach: {
    title: "Assertive Communication",
    tips: [
      "Use 'I' statements to express your needs",
      "Be respectful and considerate of the other person",
      "Focus on finding solutions, not assigning blame",
      "Be clear about what you want to achieve",
      "Listen actively to the other person's response"
    ]
  },
  miracleQuestion: {
    title: "The Miracle Question",
    tips: [
      "Imagine waking up tomorrow with the conflict completely resolved",
      "Describe what would be different in your relationship",
      "Focus on positive changes and improvements",
      "Be specific about what you would see, hear, or experience",
      "Think about how both parties would feel and behave"
    ]
  },
  solutions: {
    title: "Finding Solutions",
    tips: [
      "Focus on solutions that work for both parties",
      "Be creative and open to new ideas",
      "Consider both short-term and long-term solutions",
      "Think about what each person can do differently",
      "Aim for win-win outcomes whenever possible"
    ]
  }
};

// Smart suggestions based on field type and content
export const SmartSuggestions = ({
  fieldType,
  currentValue = "",
  context = {},
  onSuggestionSelect,
  className = "",
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const listId = useId();

  // Memoize suggestions to update instantly when input changes, without debounce latency
  const suggestions = useMemo(
    () => getSuggestions(fieldType, currentValue, context),
    [fieldType, currentValue, context]
  );
  // Debounce the value to prevent excessive "API calls"
  const debouncedValue = useDebounce(currentValue, 500);

  // Generate suggestions based on field type and context
  const generateSuggestions = async (type, value, ctx) => {
    setIsLoading(true);
    
    let generatedSuggestions = SUGGESTION_TEMPLATES[type] || [];
    

    let generatedSuggestions = SUGGESTION_TEMPLATES[type] || [];
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let generatedSuggestions = [];

    switch (type) {
      case "conflictDescription":
        generatedSuggestions = [
          "Communication breakdown between team members",
          "Disagreement over project priorities and deadlines",
          "Personality clash affecting work collaboration",
          "Misunderstanding about roles and responsibilities",
          "Conflict over resource allocation and budget",
          "Different working styles causing friction",
          "Disagreement about decision-making process",
          "Conflict arising from unclear expectations",
        ];
        break;

      case "thoughts":
        generatedSuggestions = [
          "I feel like my concerns aren't being heard",
          "I believe we have different priorities and goals",
          "I think there's a misunderstanding about expectations",
          "I feel frustrated because I'm not getting the support I need",
          "I believe we need better communication protocols",
          "I think we should focus on finding common ground",
          "I feel like we're not working as a team",
          "I believe we need to clarify our roles and responsibilities",
        ];
        break;

      case "assertiveApproach":
        generatedSuggestions = [
          "I would like to discuss this issue openly and find a solution together",
          "I understand your perspective, and I'd like to share mine as well",
          "I believe we can work through this by focusing on our common goals",
          "I'd appreciate it if we could find a compromise that works for both of us",
          "I think we should take some time to understand each other's needs better",
          "I would like to establish clear communication guidelines going forward",
          "I believe we can resolve this by being honest about our concerns",
          "I'd like to work together to prevent this issue from happening again",
        ];
        break;

      case "activatingEvent":
        generatedSuggestions = [
          "During the team meeting on [date], there was a disagreement about...",
          "The incident occurred when [person] said/did [specific action]",
          "The conflict started when we received conflicting instructions about...",
          "The issue arose during a project review when [specific event] happened",
          "The disagreement began when [person] made a decision without consulting...",
          "The conflict started during a discussion about [topic] when [specific action]",
          "The incident occurred in [location] when [specific event] took place",
          "The disagreement began when we had different interpretations of...",
        ];
        break;

      case "miracleQuestion":
        generatedSuggestions = [
          "We would be communicating openly and honestly with each other",
          "We would have clear expectations and roles defined",
          "We would be working together as a cohesive team",
          "We would have regular check-ins to prevent future conflicts",
          "We would respect each other's perspectives and working styles",
          "We would have established protocols for handling disagreements",
          "We would be focused on our shared goals and objectives",
          "We would have a positive and collaborative working relationship",
        ];
        break;

      case "solutions":
        generatedSuggestions = [
          "Establish weekly check-in meetings to discuss progress and concerns",
          "Create a shared document outlining roles and responsibilities",
          "Implement a conflict resolution protocol for future disagreements",
          "Schedule regular team-building activities to improve relationships",
          "Set up a communication channel for immediate issue resolution",
          "Create a feedback system for ongoing improvement",
          "Establish clear decision-making processes and criteria",
          "Develop a shared understanding of project goals and priorities",
        ];
        break;

      case "actionSteps":
        generatedSuggestions = [
          "Schedule a follow-up meeting in 2 weeks to review progress",
          "Create a shared action plan document with specific deadlines",
          "Assign specific responsibilities to each party with clear timelines",
          "Establish a communication protocol for ongoing updates",
          "Set up regular check-ins to monitor progress and address issues",
          "Create a feedback mechanism for continuous improvement",
          "Document lessons learned to prevent future conflicts",
          "Establish accountability measures and success metrics",
        ];
        break;

      default:
        generatedSuggestions = [];
    }

    // Filter suggestions based on current value
    if (value && value.trim()) {
      generatedSuggestions = generatedSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(suggestion.toLowerCase())
      );
    }

    // Add context-specific suggestions
    if (ctx.partyAName && ctx.partyBName) {
      generatedSuggestions = generatedSuggestions.map(suggestion =>
        suggestion.replace("[person]", ctx.partyAName || "the other person")
      );
    }

    setSuggestions(generatedSuggestions.slice(0, 5)); // Limit to 5 suggestions
    setIsLoading(false);
  };

  useEffect(() => {
    // Use debouncedValue instead of currentValue
    if (fieldType && debouncedValue.length > 2) {
      generateSuggestions(fieldType, debouncedValue, context);
    } else {
      setSuggestions([]);
    }
  }, [fieldType, debouncedValue, context]);

  const handleSuggestionClick = (suggestion) => {
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
  };

  // No-op function to maintain API compatibility
  const handleRefresh = () => {
    // Logic is now reactive, but we can ensure suggestions are shown
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span>Smart Suggestions</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleRefresh}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh suggestions"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh suggestions</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showSuggestions ? "Hide suggestions" : "Show suggestions"}
                aria-expanded={showSuggestions}
                aria-controls={listId}
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showSuggestions && "rotate-180")} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showSuggestions ? "Hide suggestions" : "Show suggestions"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {showSuggestions && (
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left p-2 text-sm bg-muted/50 hover:bg-muted rounded-md transition-colors"
            >
              {suggestion}
            </button>
          ))}
        <div className="space-y-1" id={listId}>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
              <span>Generating suggestions...</span>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-2 text-sm bg-muted/50 hover:bg-muted rounded-md transition-colors"
              >
                {suggestion}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Context-aware help text
export const ContextualHelp = ({
  fieldType,
  className = "",
}) => {
  const helpInfo = HELP_TEXTS[fieldType];
  const helpInfo = HELP_TEXTS[fieldType] || null;

  if (!helpInfo) return null;

  return (
    <div className={cn("p-4 bg-muted/30 rounded-lg space-y-3", className)}>
      <h4 className="font-medium text-sm">{helpInfo.title}</h4>
      <ul className="space-y-1">
        {helpInfo.tips.map((tip, index) => (
          <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Progress indicator for form completion
export const FormProgressIndicator = ({
  currentStep,
  totalSteps,
  completedFields = 0,
  totalFields = 0,
  className = "",
}) => {
  const stepProgress = (currentStep / totalSteps) * 100;
  const fieldProgress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Step Progress</span>
        <span>{currentStep}/{totalSteps}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${stepProgress}%` }}
        />
      </div>
      
      {totalFields > 0 && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Field Progress</span>
            <span>{completedFields}/{totalFields}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <div
              className="bg-green-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${fieldProgress}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};
