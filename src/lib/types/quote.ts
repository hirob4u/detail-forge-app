export interface QuoteLineItem {
  name: string;
  note: string;
  basePrice: number;
  adjustedPrice: number;
  finalPrice: number;
  included: boolean;
}

export interface FinalQuote {
  lineItems: QuoteLineItem[];
  totalPrice: number;
  detailerNotes: string;
}
