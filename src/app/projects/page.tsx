import { HomeClient } from '@/components/portfolio/HomeClient';

export const revalidate = 300;

export default function ProjectsPage() {
  return <HomeClient defaultSection="projects" />;
}
