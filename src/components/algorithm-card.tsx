import { Gauge, Cpu } from "lucide-react";
import { AlgorithmCardPreview } from "@/components/algorithm-card-preview";
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

export function AlgorithmCard({
  data,
  preloadPreview = false,
}: {
  data: Algorithm;
  preloadPreview?: boolean;
}) {
  const complexityColor =
    data.complexity === "high"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : data.complexity === "medium"
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-muted-foreground/40 bg-muted text-muted-foreground";

  const complexityLabel = `${data.complexity} complexity`;

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
      <AlgorithmCardPreview
        algorithm={data.algorithm}
        preview={data.preview}
        preload={preloadPreview}
      />

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
              <Cpu className="h-3 w-3" aria-hidden="true" />
              <span
                aria-label={complexityLabel}
                className={`rounded-full border px-2 py-0.5 capitalize ${complexityColor}`}
              >
                {data.complexity}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">
                Performance: {data.performance} of 5
              </span>
              <div aria-hidden="true" className="flex gap-0.5">
                {performanceDots}
              </div>
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
