"use client";

import { useState, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MultiStepFormStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  /**
   * Called before advancing past this step. Return (or resolve) false to
   * block navigation — e.g. wrapping React Hook Form's
   * `trigger(["fieldA", "fieldB"])` for this step's fields. Omit for a step
   * with nothing to validate.
   */
  validate?: () => boolean | Promise<boolean>;
  /** Visual-only marker in the step indicator; doesn't change navigation logic. */
  optional?: boolean;
}

export interface MultiStepFormProps {
  steps: MultiStepFormStep[];
  /** Controlled current step index — omit to let MultiStepForm manage it. */
  currentStep?: number;
  onStepChange?: (index: number) => void;
  /** Called once the final step's validation passes. May return a Promise. */
  onComplete: () => void | Promise<void>;
  /** External loading control for the final submit — pass a mutation's
   * `isPending` here. If omitted, MultiStepForm manages its own loading
   * state around `onComplete` instead (same dual-mode pattern as ConfirmDialog). */
  isSubmitting?: boolean;
  /**
   * Lightweight refresh-recovery nicety: persists only the current step
   * *index* to sessionStorage under this key, restored on mount. This does
   * NOT persist field values — that's inherent to the caller keeping one
   * form instance (e.g. a single RHF `useForm()`) alive across all steps,
   * which is what actually satisfies "don't lose data on step-back."
   * Omit for pure in-memory behavior (the default).
   */
  persistKey?: string;
  /** Allow clicking an earlier, already-visited step in the indicator to
   * jump back to it. Never allows jumping ahead past unvalidated steps. */
  allowStepClick?: boolean;
  nextLabel?: string;
  backLabel?: string;
  completeLabel?: string;
  className?: string;
}

function readPersistedStep(persistKey: string | undefined, stepCount: number): number {
  if (!persistKey || typeof window === "undefined") return 0;
  const stored = window.sessionStorage.getItem(persistKey);
  const parsed = stored ? Number(stored) : NaN;
  return !Number.isNaN(parsed) && parsed >= 0 && parsed < stepCount ? parsed : 0;
}

export function MultiStepForm({
  steps,
  currentStep: controlledStep,
  onStepChange,
  onComplete,
  isSubmitting,
  persistKey,
  allowStepClick = true,
  nextLabel = "Next",
  backLabel = "Back",
  completeLabel = "Complete",
  className,
}: MultiStepFormProps) {
  const [internalStep, setInternalStep] = useState(() =>
    readPersistedStep(persistKey, steps.length)
  );
  const step = controlledStep ?? internalStep;

  const [furthestStep, setFurthestStep] = useState(step);
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const submitting = isSubmitting ?? internalSubmitting;

  const goToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    setInternalStep(index);
    setFurthestStep((prev) => Math.max(prev, index));
    onStepChange?.(index);
    if (persistKey && typeof window !== "undefined") {
      window.sessionStorage.setItem(persistKey, String(index));
    }
  };

  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;
  const current = steps[step];

  const handleNext = async () => {
    if (validating || submitting) return;

    setValidating(true);
    let valid = true;
    try {
      valid = current.validate ? await current.validate() : true;
    } finally {
      setValidating(false);
    }
    if (!valid) return;

    if (!isLastStep) {
      goToStep(step + 1);
      return;
    }

    // Final step — hand off to onComplete.
    if (isSubmitting !== undefined) {
      // Controlled: caller owns loading state and closes/advances from their
      // own mutation's onSuccess/onSettled.
      onComplete();
      return;
    }
    try {
      setInternalSubmitting(true);
      await onComplete();
    } finally {
      setInternalSubmitting(false);
    }
  };

  const handleBack = () => {
    if (validating || submitting || isFirstStep) return;
    goToStep(step - 1);
  };

  const handleStepClick = (index: number) => {
    if (!allowStepClick || validating || submitting || index === step) return;
    if (index <= furthestStep) goToStep(index);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Compact indicator on narrow screens */}
      <p className="text-sm font-medium text-foreground sm:hidden">
        Step {step + 1} of {steps.length}: {current.title}
      </p>

      {/* Full stepper on sm and up */}
      <ol className="hidden sm:flex sm:items-start">
        {steps.map((s, index) => {
          const isCompleted = index < step;
          const isCurrent = index === step;
          const isClickable = allowStepClick && index !== step && index <= furthestStep;

          return (
            <li key={s.id} className="flex flex-1 flex-col items-center gap-2 last:flex-none">
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "h-px flex-1",
                    index === 0 ? "invisible" : index <= step ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary",
                    !isCompleted && !isCurrent && "border-border text-muted-foreground",
                    isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </button>
                <div
                  className={cn(
                    "h-px flex-1",
                    index === steps.length - 1
                      ? "invisible"
                      : index < step
                        ? "bg-primary"
                        : "bg-border"
                  )}
                  aria-hidden="true"
                />
              </div>
              <p
                className={cn(
                  "max-w-[8rem] text-center text-xs font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.title}
                {s.optional && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    (optional)
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ol>

      <div>
        {current.description && (
          <p className="mb-4 text-sm text-muted-foreground">{current.description}</p>
        )}
        {current.content}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep || validating || submitting}
        >
          {backLabel}
        </Button>
        <Button type="button" onClick={handleNext} disabled={validating || submitting}>
          {(validating || (isLastStep && submitting)) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLastStep ? completeLabel : nextLabel}
        </Button>
      </div>
    </div>
  );
}
