import { HomeClient } from '@/components/portfolio/HomeClient';

export const revalidate = 300;

export default function Home() {
  return <HomeClient defaultSection="profile" />;
}
