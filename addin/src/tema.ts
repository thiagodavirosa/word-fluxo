import { createLightTheme, type BrandVariants, type Theme } from "@fluentui/react-components";

/** Tema inspirado em eis-ds: neutros frios, linhas de 1px, tinta quase preta e um único laranja de destaque. */
const marca: BrandVariants = {
  10: "#050505",
  20: "#111111",
  30: "#1c1c1c",
  40: "#262626",
  50: "#333333",
  60: "#404040",
  70: "#4d4d4d",
  80: "#666666",
  90: "#7a7a7a",
  100: "#8f8f8f",
  110: "#a3a3a3",
  120: "#b8b8b8",
  130: "#cfcfcf",
  140: "#dddddd",
  150: "#ececec",
  160: "#f7f7f7",
};

export const ACENTO = "#f35919";

export const temaEis: Theme = {
  ...createLightTheme(marca),
  colorNeutralBackground1: "#ffffff",
  colorNeutralBackground2: "#f7f7f7",
  colorNeutralBackground3: "#f7f7f7",
  colorNeutralForeground1: "#111111",
  colorNeutralForeground2: "#666666",
  colorNeutralForeground3: "#858585",
  colorNeutralStroke1: "#cfcfcf",
  colorNeutralStroke2: "#cfcfcf",
  colorBrandBackground: "#111111",
  colorBrandBackgroundHover: "#333333",
  colorBrandBackgroundPressed: "#000000",
  colorBrandBackground2: "#ececec",
  colorBrandForeground1: "#111111",
  colorBrandForegroundLink: "#111111",
  colorCompoundBrandStroke: ACENTO,
  colorBrandStroke1: ACENTO,
  colorNeutralForegroundOnBrand: "#f7f7f7",
  borderRadiusSmall: "4px",
  borderRadiusMedium: "7px",
  shadow2: "none",
  shadow4: "none",
  shadow8: "0 0 0 1px #cfcfcf",
  shadow16: "0 0 0 1px #cfcfcf",
  fontFamilyBase: 'Geist, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMonospace: '"Geist Mono", "SF Mono", Menlo, Consolas, monospace',
};
