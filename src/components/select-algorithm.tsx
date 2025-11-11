"use client";

import { useEffect } from "react";
import { EditorState } from "@/lib/enum/editor-state";
import { useImageContext } from "@/contexts/image-context";
import { useEditorContext } from "@/contexts/editor-context";
import { DitherAlgorithm } from "@/lib/enum/dither-algorithm";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelectAlgorithm() {
  const { editorState } = useImageContext();
  const { ditherAlgorithm, setDitherAlgorithm, isRendering, handleRender } =
    useEditorContext();

  useEffect(() => {
    if (editorState === EditorState.Rendered) {
      handleRender(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ditherAlgorithm]);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="algorithm" className="text-muted-foreground">
        Algorithm
      </Label>
      <Select
        value={ditherAlgorithm}
        onValueChange={(value: DitherAlgorithm) => setDitherAlgorithm(value)}
        disabled={editorState === EditorState.Initial || isRendering}
      >
        <SelectTrigger id="algorithm" className="w-full">
          <SelectValue placeholder="Select an algorithm" />
        </SelectTrigger>
        <SelectContent>
          {/* 🔹 Error Diffusion Dithering */}
          <SelectGroup>
            <SelectLabel>Error Diffusion Dithering</SelectLabel>
            <SelectItem value={DitherAlgorithm.FloydSteinberg}>
              {DitherAlgorithm.FloydSteinberg}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.JarvisJudiceNinke}>
              {DitherAlgorithm.JarvisJudiceNinke}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.Stucki}>
              {DitherAlgorithm.Stucki}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.Burkes}>
              {DitherAlgorithm.Burkes}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.Sierra}>
              {DitherAlgorithm.Sierra}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.TwoRowSierra}>
              {DitherAlgorithm.TwoRowSierra}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.SierraLite}>
              {DitherAlgorithm.SierraLite}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.Atkinson}>
              {DitherAlgorithm.Atkinson}
            </SelectItem>
          </SelectGroup>
          {/* 🔹 Ordered Dithering */}
          <SelectGroup>
            <SelectLabel>Ordered Dithering</SelectLabel>
            <SelectItem value={DitherAlgorithm.Bayer2x2}>
              {DitherAlgorithm.Bayer2x2}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.Bayer4x4}>
              {DitherAlgorithm.Bayer4x4}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.Bayer8x8}>
              {DitherAlgorithm.Bayer8x8}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.ClusteredDot}>
              {DitherAlgorithm.ClusteredDot}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.BlueNoise}>
              {DitherAlgorithm.BlueNoise}
            </SelectItem>
          </SelectGroup>
          {/* 🔹 Random / Noise-Based Dithering  */}
          <SelectGroup>
            <SelectLabel>Random / Noise-Based Dithering</SelectLabel>
            <SelectItem value={DitherAlgorithm.Random}>
              {DitherAlgorithm.Random}
            </SelectItem>
            <SelectItem value={DitherAlgorithm.VoidandCluster}>
              {DitherAlgorithm.VoidandCluster}
            </SelectItem>
          </SelectGroup>
          {/* 🔹 Random */}
          {/* <SelectGroup>
            <SelectLabel>Halftone Dithering</SelectLabel>
            <SelectItem value={DitherAlgorithm.HalftoneCircular}>
              {DitherAlgorithm.HalftoneCircular}
            </SelectItem>
          </SelectGroup> */}
        </SelectContent>
      </Select>
    </div>
  );
}
