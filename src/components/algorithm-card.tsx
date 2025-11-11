"use client";

import Image from "next/image";
import { useState } from "react";
import { Gauge, Cpu, Eye, EyeClosed } from "lucide-react";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

type Algorithm = {
  category: string;
  type: string;
  algorithm: string;
  description: string;
  complexity: string;
  year: number | string;
  author: string;
  performance: number;
  preview: string;
};

export function AlgorithmCard({ data }: { data: Algorithm }) {
  const [showOriginal, setShowOriginal] = useState(false);

  const complexityColor =
    data.complexity === "high"
      ? "text-red-500"
      : data.complexity === "medium"
        ? "text-yellow-500"
        : "text-green-500";

  const performanceDots = Array.from({ length: 5 }).map((_, i) => (
    <span
      key={i}
      className={`inline-block h-2 w-2 rounded-full ${
        i < data.performance ? "bg-primary" : "bg-muted"
      }`}
    />
  ));

  return (
    <Card className="border-border bg-background relative flex h-full flex-col overflow-hidden border pt-0 transition-all hover:shadow-md">
      {/* Imagem fixa 250x250 */}
      <div className="bg-muted/30 relative aspect-square w-full">
        <Image
          src={!showOriginal ? data.preview : "/250/sphere-250.png"}
          alt={data.algorithm}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 250px"
          priority
        />
        <button
          onClick={() => setShowOriginal((prev) => !prev)}
          className="bg-background/80 hover:bg-background absolute right-2 bottom-2 rounded-full p-1 shadow-sm transition"
          aria-label="Toggle preview"
        >
          {showOriginal ? (
            <EyeClosed width={16} height={16} />
          ) : (
            <Eye width={16} height={16} />
          )}
        </button>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg leading-tight font-semibold">
          {data.algorithm}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          {data.category} · <span className="capitalize">{data.type}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="text-muted-foreground flex flex-1 flex-col justify-between text-sm">
        <div className="flex h-full flex-col space-y-3">
          <p className="text-foreground/90 flex-1">{data.description}</p>

          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span className={complexityColor}>{data.complexity}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              <div className="flex gap-0.5">{performanceDots}</div>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground mt-4 flex items-center justify-between border-t pt-2 text-xs">
          <span>{data.author}</span>
          {data.year && <span>{data.year}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
