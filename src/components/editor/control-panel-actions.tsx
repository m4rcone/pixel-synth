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

/** Discard and Reset, once there is an image to act on. */
export function ControlPanelActions() {
  const { status } = useEditorState();
  const { discard, reset } = useEditorActions();
  const { resetView, setShowProcessed, setSplit } = useCanvasContext();

  const resetCanvas = () => {
    resetView();
    setShowProcessed(true);
    setSplit(null);
  };

  if (status === "empty") return null;

  return (
    <footer className="border-line bg-ink-raised sticky bottom-0 flex gap-2 border-t p-3 lg:static">
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
    </footer>
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
