declare module "inspirational-quotes" {
  export interface InspirationalQuote {
    text: string;
    author: string;
  }

  export function getQuote(options?: { author?: boolean }): InspirationalQuote;
  export function getRandomQuote(): string;
}
