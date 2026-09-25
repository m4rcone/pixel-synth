"use client";

import { RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useCanvasContext } from "@/contexts/canvas-context";
import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { Button } from "@/components/ui/button";
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
  const { resetView, setShowProcessed } = useCanvasContext();

  if (status !== "dithered") {
    return (
      <Button
        onClick={applyDither}
        disabled={status === "empty"}
        className="w-full"
      >
        <Sparkles aria-hidden="true" />
        Apply dither
      </Button>
    );
  }

  return (
    <div className="flex w-full gap-2">
      <ConfirmButton
        label="Discard"
        icon={<Trash2 aria-hidden="true" />}
        variant="destructive"
        title="Discard image?"
        description="The image, all adjustments and the processed result will be removed. This action cannot be undone."
        onConfirm={() => {
          discard();
          resetView();
          setShowProcessed(true);
        }}
      />
      <ConfirmButton
        label="Reset"
        icon={<RotateCcw aria-hidden="true" />}
        variant="outline"
        title="Reset adjustments?"
        description="Dither, filter and tone settings return to their defaults. The image stays loaded."
        onConfirm={() => {
          reset();
          resetView();
          setShowProcessed(true);
        }}
      />
    </div>
  );
}

function ConfirmButton({
  label,
  icon,
  variant,
  title,
  description,
  onConfirm,
}: {
  label: string;
  icon: React.ReactNode;
  variant: "destructive" | "outline";
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} className="flex-1">
          {icon}
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
            className={
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : undefined
            }
          >
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
