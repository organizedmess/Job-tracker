declare module "inspirational-quotes" {
  export interface InspirationalQuote {
    text: string;
    author: string;
  }

  export function getQuote(options?: { author?: boolean }): InspirationalQuote;
  export function getRandomQuote(): string;
}

declare module "inspirational-quotes/data/data.json" {
  interface InspirationalQuoteRecord {
    text: string;
    from: string;
  }

  const value: InspirationalQuoteRecord[];
  export default value;
}
