import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppError, ErrorCode } from "@/utils/errorHandling";
import { roomCodeSchema, validateMeetingCode } from "@/utils/schemas";
import { Users, Eye, Sparkles, Loader2 } from "lucide-react";

interface CodeInputFormProps {
  mode: "join" | "watch";
  onError: (error: AppError | string | null) => void;
}

/**
 * Component for entering meeting codes in join/watch modes
 * Uses shared UI components for consistency with HomePage
 */
export function CodeInputForm({ mode, onError }: CodeInputFormProps) {
  const [codeInput, setCodeInput] = useState<string>("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeComplete, setCodeComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCodeChange = (value: string) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCodeInput(normalized);
    
    if (normalized.length === 6) {
      const result = roomCodeSchema.safeParse(normalized);
      if (result.success) {
        setCodeError(null);
        setCodeComplete(true);
      } else {
        setCodeError(result.error.errors[0].message);
        setCodeComplete(false);
      }
    } else {
      setCodeError(null);
      setCodeComplete(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateMeetingCode(codeInput);
    if (!validation.isValid) {
      onError(new AppError(ErrorCode.INVALID_MEETING_CODE, undefined, validation.error ?? "Invalid meeting code"));
      return;
    }
    setIsSubmitting(true);
    navigate(`/meeting?mode=${mode}&code=${validation.normalizedCode}`);
  };

  const isJoinMode = mode === "join";
  const Icon = isJoinMode ? Users : Eye;
  const title = isJoinMode ? "Join a Meeting" : "Watch a Meeting";
  const description = isJoinMode 
    ? "Enter the 6-character meeting code shared by the host."
    : "Enter the 6-character meeting code to observe the discussion.";
  const buttonText = isJoinMode ? "Join & Speak" : "Watch Meeting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-card border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                value={codeInput}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="ABCD12"
                maxLength={6}
                className={`font-mono text-center text-xl sm:text-2xl uppercase tracking-[0.3em] h-14 ${
                  codeComplete && !codeError
                    ? "border-success bg-success/5 focus-visible:ring-success"
                    : codeError
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }`}
                aria-label="Meeting code"
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
              {codeComplete && !codeError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
            </div>
            
            <p className={`text-sm text-center ${
              codeError ? "text-destructive" : 
              codeComplete ? "text-success font-medium" : 
              "text-muted-foreground"
            }`}>
              {codeError || (codeComplete ? "✓ Ready to go!" : "6-character room code")}
            </p>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold"
              disabled={!codeComplete || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Icon className="mr-2 h-5 w-5" />
              )}
              {isSubmitting ? "Loading..." : buttonText}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
