import { HomeClient } from '@/components/portfolio/HomeClient';

export const revalidate = 300;

export default function ContactPage() {
  return <HomeClient defaultSection="contact" />;
}
