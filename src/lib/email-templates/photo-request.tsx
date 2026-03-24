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
  Section,
  Text,
} from "@react-email/components";

interface PhotoRequestEmailProps {
  shopName: string;
  shopLogo?: string | null;
  brandColor: string;
  customerFirstName: string;
  vehicleDescription: string;
  uploadUrl: string;
}

export default function PhotoRequestEmail({
  shopName,
  shopLogo,
  brandColor,
  customerFirstName,
  vehicleDescription,
  uploadUrl,
}: PhotoRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {shopName} would like a few photos of your vehicle
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
            We&apos;re working on your estimate for your{" "}
            <strong>{vehicleDescription}</strong>. A few photos of your vehicle
            would help us give you the most accurate quote possible.
          </Text>
          <Text style={paragraph}>
            It only takes a minute — snap a few shots and we&apos;ll take it
            from there.
          </Text>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={uploadUrl} style={{ ...ctaButton, backgroundColor: brandColor }}>
              Upload Photos
            </Link>
          </Section>

          <Text style={footerNote}>
            Photos help us see your vehicle&apos;s current condition so we can
            recommend the right services and give you an accurate price.
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

// --- Styles (match existing email design system) ---

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
  margin: "0 0 16px",
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
