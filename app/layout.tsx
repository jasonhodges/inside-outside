import {Metadata} from "next";
import 'global.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to Next.js',
}
export default function RootLayout({children}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    <SpeedInsights />
    </html>
  )
}