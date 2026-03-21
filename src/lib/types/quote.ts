export interface QuoteLineItem {
  name: string;
  description?: string;
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
