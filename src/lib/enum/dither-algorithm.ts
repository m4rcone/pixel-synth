export enum DitherAlgorithm {
  // Error Diffusion Dithering
  FloydSteinberg = "Floyd–Steinberg",
  JarvisJudiceNinke = "Jarvis, Judice, and Ninke (JJN)",
  Stucki = "Stucki",
  Burkes = "Burkes",
  Sierra = "Sierra",
  TwoRowSierra = "Two-Row Sierra",
  SierraLite = "Sierra Lite",
  Atkinson = "Atkinson",
  BlueNoise = "Blue Noise",
  VoidandCluster = "Void-and-Cluster",

  // Ordered Dithering
  Bayer2x2 = "Bayer 2×2",
  Bayer4x4 = "Bayer 4×4",
  Bayer8x8 = "Bayer 8×8",
  ClusteredDot = "Clustered Dot (Halftone Ordered)",

  // Random / Noise-Based
  Random = "Random Dither",

  // Halftone Dithering
  HalftoneCircular = "Halftone Circular",
}
