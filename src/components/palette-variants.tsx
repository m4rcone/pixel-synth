"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, use, useState, type ComponentProps } from "react";
import { CompareSlider } from "@/components/compare-slider";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";

type Variant = { id: string; name: string };
type PerVariant<T> = Record<string, T>;

const VariantContext = createContext<{
  active: Variant;
  variants: Variant[];
  select: (id: string) => void;
} | null>(null);

function useVariants() {
  const value = use(VariantContext);
  if (!value) throw new Error("Palette variant used outside its provider");
  return value;
}

const useVariant = () => useVariants().active;

/**
 * The palette a guide page is showing, for pages that cover more than one
 * preset (Game Boy and Pocket, the two CGA palettes). The picker switches
 * every preview, caption and editor link inside the provider at once.
 */
export function PaletteVariants({
  variants,
  children,
}: {
  variants: Variant[];
  children: React.ReactNode;
}) {
  const [id, setId] = useState(variants[0].id);
  const active = variants.find((variant) => variant.id === id)!;
  return (
    <VariantContext value={{ active, variants, select: setId }}>
      {children}
    </VariantContext>
  );
}

/** Picks the palette shown; renders nothing for single-palette pages. */
export function VariantPicker({
  label,
  className,
}: {
  /** Accessible name of the group. */
  label: string;
  className?: string;
}) {
  const { active, variants, select } = useVariants();
  if (variants.length < 2) return null;
  return (
    <Segmented
      label={label}
      options={variants.map(({ id, name }) => ({ value: id, label: name }))}
      value={active.id}
      onChange={select}
      className={className}
    />
  );
}

/** The active palette's name. */
export function VariantName() {
  return useVariant().name;
}

/** Text that depends on the active palette. */
export function VariantText({ text }: { text: PerVariant<string> }) {
  return text[useVariant().id];
}

export function VariantCompare({
  after,
  ...props
}: Omit<ComponentProps<typeof CompareSlider>, "after"> & {
  after: PerVariant<{ src: string; alt: string }>;
}) {
  return <CompareSlider {...props} after={after[useVariant().id]} />;
}

export function VariantImage({
  image,
  ...props
}: Omit<ComponentProps<typeof Image>, "src" | "alt"> & {
  image: PerVariant<{ src: string; alt: string }>;
}) {
  const { src, alt } = image[useVariant().id];
  return <Image {...props} src={src} alt={alt} />;
}

/** "Use Game Boy Pocket in the editor", with that palette preselected. */
export function VariantEditorButton({
  verb,
  className,
}: {
  verb: string;
  className?: string;
}) {
  const { id, name } = useVariant();
  return (
    <Button asChild size="lg" className={className}>
      <Link href={`/editor?palette=${id}`}>
        {verb} {name} in the editor
      </Link>
    </Button>
  );
}
