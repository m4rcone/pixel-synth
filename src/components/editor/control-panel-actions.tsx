"use client";

import { useCanvasContext } from "@/contexts/canvas-context";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ControlPanelActions() {
  const { status } = useEditorState();
  const { applyDither, discard, reset } = useEditorActions();
  const { resetView, setShowProcessed, setSplit } = useCanvasContext();

  const resetCanvas = () => {
    resetView();
    setShowProcessed(true);
    setSplit(null);
  };
  // Also offered before the first dither, so a wrong image can go right away.
  const discardButton = (
    <ConfirmButton
      label="Discard"
      variant="destructive"
      title="Discard image?"
      description="The image, all adjustments and the processed result will be removed. This action cannot be undone."
      onConfirm={() => {
        discard();
        resetCanvas();
      }}
    />
  );

  if (status !== "dithered") {
    return (
      <div className="flex w-full gap-2">
        <Button
          onClick={applyDither}
          disabled={status === "empty"}
          className="flex-2"
        >
          Dither image
        </Button>
        {status === "loaded" && discardButton}
      </div>
    );
  }

  return (
    <div className="flex w-full gap-2">
      {discardButton}
      <ConfirmButton
        label="Reset"
        variant="outline"
        title="Reset adjustments?"
        description="Dither, filter and tone settings return to their defaults. The image stays loaded."
        onConfirm={() => {
          reset();
          resetCanvas();
        }}
      />
    </div>
  );
}

function ConfirmButton({
  label,
  variant,
  title,
  description,
  onConfirm,
}: {
  label: string;
  variant: "destructive" | "outline";
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex-1",
            variant === "destructive" && "text-danger hover:text-danger",
          )}
        >
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            variant={variant === "destructive" ? "destructive" : undefined}
          >
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
