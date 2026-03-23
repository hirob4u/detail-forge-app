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

interface InviteEmailProps {
  signUpUrl: string;
  inviteCode: string;
}

export default function InviteEmail({
  signUpUrl,
  inviteCode,
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{"You're invited to DetailForge"}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={headerBadge}>EARLY ACCESS INVITE</Text>
          </Section>

          {/* Main content */}
          <Heading style={heading}>
            You&apos;re in.
          </Heading>

          <Text style={paragraph}>
            You requested access to DetailForge — the AI-powered estimate
            platform built for auto detailers. Your invite is ready.
          </Text>

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={signUpUrl} style={ctaButton}>
              Create Your Account
            </Link>
          </Section>

          <Text style={secondaryText}>
            Your invite code is pre-filled in the link above. If you need to
            enter it manually:
          </Text>

          {/* Code display */}
          <Section style={codeSection}>
            <Text style={codeDisplay}>{inviteCode}</Text>
          </Section>

          <Text style={secondaryText}>
            This code is single-use. Once you create your account, it
            can&apos;t be used again.
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

// --- Styles (matches existing email template system) ---

const body: React.CSSProperties = {
  backgroundColor: "#0A0A0F",
  fontFamily:
    "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
  backgroundColor: "rgba(124, 77, 255, 0.1)",
  color: "#9575FF",
  fontSize: "11px",
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  padding: "6px 16px",
  borderRadius: "6px",
  border: "1px solid rgba(124, 77, 255, 0.25)",
};

const heading: React.CSSProperties = {
  color: "#E8E8EF",
  fontSize: "22px",
  fontWeight: 700,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const paragraph: React.CSSProperties = {
  color: "#C0C0D0",
  fontSize: "15px",
  lineHeight: "1.6",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const secondaryText: React.CSSProperties = {
  color: "#8888A0",
  fontSize: "13px",
  lineHeight: "1.5",
  textAlign: "center" as const,
  margin: "0 0 16px",
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

const codeSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const codeDisplay: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#12121A",
  color: "#E8E8EF",
  fontSize: "20px",
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.15em",
  padding: "12px 24px",
  borderRadius: "8px",
  border: "1px solid #2A2A3A",
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
