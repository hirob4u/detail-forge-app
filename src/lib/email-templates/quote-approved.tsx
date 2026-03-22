import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface QuoteApprovedEmailProps {
  shopName: string;
  customerName: string;
  vehicleDescription: string;
  totalPrice: number;
  jobUrl: string;
}

export default function QuoteApprovedEmail({
  shopName,
  customerName,
  vehicleDescription,
  totalPrice,
  jobUrl,
}: QuoteApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {customerName} approved the ${totalPrice.toFixed(2)} quote for{" "}
        {vehicleDescription}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={headerBadge}>QUOTE APPROVED</Text>
          </Section>

          {/* Main content */}
          <Heading style={heading}>
            {customerName} approved your quote
          </Heading>

          <Section style={detailsCard}>
            <Text style={detailLabel}>Customer</Text>
            <Text style={detailValue}>{customerName}</Text>

            <Text style={detailLabel}>Vehicle</Text>
            <Text style={detailValue}>{vehicleDescription}</Text>

            <Text style={detailLabel}>Amount</Text>
            <Text style={amountValue}>${totalPrice.toFixed(2)}</Text>
          </Section>

          <Text style={paragraph}>
            The customer is ready to schedule. Follow up to confirm their
            appointment.
          </Text>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={jobUrl} style={ctaButton}>
              View Job
            </Link>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Text style={footer}>
            {shopName} &middot; Powered by{" "}
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

const headerBadge: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "rgba(57, 255, 20, 0.1)",
  color: "#39FF14",
  fontSize: "11px",
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  padding: "6px 16px",
  borderRadius: "6px",
  border: "1px solid rgba(57, 255, 20, 0.25)",
};

const heading: React.CSSProperties = {
  color: "#E8E8EF",
  fontSize: "22px",
  fontWeight: 700,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const detailsCard: React.CSSProperties = {
  backgroundColor: "#12121A",
  borderRadius: "12px",
  border: "1px solid #2A2A3A",
  padding: "20px",
  marginBottom: "24px",
};

const detailLabel: React.CSSProperties = {
  color: "#8888A0",
  fontSize: "11px",
  fontWeight: 600,
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 2px",
};

const detailValue: React.CSSProperties = {
  color: "#E8E8EF",
  fontSize: "15px",
  fontWeight: 500,
  margin: "0 0 16px",
};

const amountValue: React.CSSProperties = {
  color: "#39FF14",
  fontSize: "24px",
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
  margin: "0",
};

const paragraph: React.CSSProperties = {
  color: "#8888A0",
  fontSize: "15px",
  lineHeight: "1.6",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 32px",
  borderRadius: "8px",
  backgroundColor: "#7C4DFF",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
};

const divider: React.CSSProperties = {
  borderColor: "#2A2A3A",
  margin: "24px 0",
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
