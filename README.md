This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## OTP Email Setup

OTP is sent through Resend if configured. Without config, app falls back to showing `Dev OTP` on screen.

1. Create `.env.local` from `.env.example`
2. Set `RESEND_API_KEY`
3. Set `OTP_FROM_EMAIL` (sender email verified in Resend)
4. Restart dev server

## Cashfree Payment Setup

The checkout page now supports Cashfree payment links for `cashfree` checkout.

1. Set `CASHFREE_APP_ID`
2. Set `CASHFREE_SECRET_KEY`
3. Set `CASHFREE_ENV` to `sandbox` or `production`
4. Optionally set `NEXT_PUBLIC_APP_URL` to your app URL (used for return URL generation)
5. Restart dev server
The app now uses `/payment/status` for Cashfree return handling. If the transaction succeeds, the page shows success; if it fails, it shows failure.
You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
