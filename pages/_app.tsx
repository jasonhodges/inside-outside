"use client"
import 'tailwindcss/tailwind.css';
import Layout from "../components/layout";
import {AppProps} from "next/app";

export default function Home({Component, pageProps}: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )

}
