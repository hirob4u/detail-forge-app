import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface QuoteLineItemEmail {
  name: string;
  finalPrice: number;
}

interface QuoteReadyEmailProps {
  shopName: string;
  shopLogo?: string | null;
  brandColor: string;
  customerFirstName: string;
  vehicleDescription: string;
  lineItems: QuoteLineItemEmail[];
  totalPrice: number;
  quoteUrl: string;
}

export default function QuoteReadyEmail({
  shopName,
  shopLogo,
  brandColor,
  customerFirstName,
  vehicleDescription,
  lineItems,
  totalPrice,
  quoteUrl,
}: QuoteReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your detailing quote from {shopName} — ${totalPrice.toFixed(2)}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Shop identity */}
          <Section style={headerSection}>
            {shopLogo && (
              <Img
                src={shopLogo}
                alt={shopName}
                width={80}
                height={80}
                style={logoStyle}
              />
            )}
            <Heading style={{ ...shopNameStyle, color: brandColor }}>
              {shopName}
            </Heading>
          </Section>

          <Hr style={divider} />

          {/* Greeting */}
          <Text style={greeting}>
            Hi {customerFirstName},
          </Text>
          <Text style={paragraph}>
            Here&apos;s your detailing quote for your{" "}
            <strong>{vehicleDescription}</strong>.
          </Text>

          {/* Line items */}
          <Section style={quoteCard}>
            <Heading as="h3" style={quoteCardTitle}>
              Quote Details
            </Heading>
            {lineItems.map((item, i) => (
              <Row key={i} style={lineItemRow}>
                <td style={lineItemName}>{item.name}</td>
                <td style={lineItemPrice}>
                  ${item.finalPrice.toFixed(2)}
                </td>
              </Row>
            ))}
            <Hr style={totalDivider} />
            <Row style={totalRow}>
              <td style={totalLabel}>Total</td>
              <td style={totalValue}>
                ${totalPrice.toFixed(2)}
              </td>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={quoteUrl} style={{ ...ctaButton, backgroundColor: brandColor }}>
              View &amp; Approve Quote
            </Link>
          </Section>

          <Text style={footerNote}>
            Review your quote details and approve it with one tap.
          </Text>

          {/* Footer */}
          <Hr style={divider} />
          <Text style={footer}>
            Powered by{" "}
            <Link href="https://detailforge.io" style={footerLink}>
              DetailForge.io
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// --- Styles ---

const body: React.CSSProperties = {
  backgroundColor: "#0A0A0F",
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 24px",
};

const headerSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const logoStyle: React.CSSProperties = {
  margin: "0 auto 12px",
  borderRadius: "8px",
};

const shopNameStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#2A2A3A",
  margin: "24px 0",
};

const greeting: React.CSSProperties = {
  color: "#E8E8EF",
  fontSize: "18px",
  fontWeight: 600,
  margin: "0 0 8px",
};

const paragraph: React.CSSProperties = {
  color: "#8888A0",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const quoteCard: React.CSSProperties = {
  backgroundColor: "#12121A",
  borderRadius: "12px",
  border: "1px solid #2A2A3A",
  padding: "20px",
  marginBottom: "24px",
};

const quoteCardTitle: React.CSSProperties = {
  color: "#E8E8EF",
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 16px",
  fontFamily: "'JetBrains Mono', monospace",
};

const lineItemRow: React.CSSProperties = {
  width: "100%",
};

const lineItemName: React.CSSProperties = {
  color: "#E8E8EF",
  fontSize: "14px",
  padding: "6px 0",
};

const lineItemPrice: React.CSSProperties = {
  color: "#E8E8EF",
  fontSize: "14px",
  fontFamily: "'JetBrains Mono', monospace",
  textAlign: "right" as const,
  padding: "6px 0",
};

const totalDivider: React.CSSProperties = {
  borderColor: "#2A2A3A",
  margin: "12px 0",
};

const totalRow: React.CSSProperties = {
  width: "100%",
};

const totalLabel: React.CSSProperties = {
  color: "#E8E8EF",
  fontSize: "16px",
  fontWeight: 700,
  padding: "4px 0",
};

const totalValue: React.CSSProperties = {
  color: "#E8E8EF",
  fontSize: "20px",
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
  textAlign: "right" as const,
  padding: "4px 0",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "16px",
};

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 32px",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
};

const footerNote: React.CSSProperties = {
  color: "#8888A0",
  fontSize: "13px",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const footer: React.CSSProperties = {
  color: "#8888A0",
  fontSize: "12px",
  textAlign: "center" as const,
};

const footerLink: React.CSSProperties = {
  color: "#9575FF",
  textDecoration: "none",
};
