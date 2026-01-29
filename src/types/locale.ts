export type Locale = "zh-CN" | "en-US" | "es-ES" | "fr-FR" | "de-DE";

export type SupportedLocale = {
  code: Locale;
  name: string;
  flag: string;
}[];