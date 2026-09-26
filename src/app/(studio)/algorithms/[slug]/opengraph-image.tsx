import { ALGORITHMS, getAlgorithm, getCategoryName } from "@/lib/algorithms";
import { OG_SIZE, renderOgImage } from "@/lib/og-image";

export const alt = "A CRT terminal rendered with this dithering algorithm";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return ALGORITHMS.map(({ slug }) => ({ slug }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const algorithm = getAlgorithm((await params).slug)!;
  return renderOgImage({
    eyebrow: `${getCategoryName(algorithm.category)} dithering`,
    title: algorithm.shortName,
    subtitle: algorithm.description,
    image: algorithm.preview,
  });
}
