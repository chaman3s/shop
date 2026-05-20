type OtpPurpose = "login" | "signup";

interface SendOtpEmailInput {
  to: string;
  otp: string;
  purpose: OtpPurpose;
}

interface SendOtpEmailResult {
  sent: boolean;
  reason?: string;
}

function getSubject(purpose: OtpPurpose) {
  return purpose === "login"
    ? "Your Munch login OTP"
    : "Your Munch signup OTP";
}

function getHtml(otp: string, purpose: OtpPurpose) {
  const action = purpose === "login" ? "login" : "signup";
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Munch ${action} verification</h2>
      <p>Your OTP is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
      <p>This OTP will expire in 5 minutes.</p>
    </div>
  `;
}

export async function sendOtpEmail(
  input: SendOtpEmailInput,
): Promise<SendOtpEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.OTP_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return {
      sent: false,
      reason: "Missing RESEND_API_KEY or OTP_FROM_EMAIL env vars.",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: input.to,
        subject: getSubject(input.purpose),
        html: getHtml(input.otp, input.purpose),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      // Try to parse JSON error from Resend
      try {
        const json = JSON.parse(text);
        if (json?.name === "validation_error" && json?.message?.includes("domain is not verified")) {
          return {
            sent: false,
            reason: "Resend domain not verified. Verify sender domain on https://resend.com/domains",
          };
        }
        return {
          sent: false,
          reason: `Resend API error (${response.status}): ${json?.message ?? text}`,
        };
      } catch (e) {
        return {
          sent: false,
          reason: `Resend API error (${response.status}): ${text}`,
        };
      }
    }

    return { sent: true };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unknown email error.";
    return { sent: false, reason };
  }
}

