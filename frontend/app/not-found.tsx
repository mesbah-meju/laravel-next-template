import { ErrorState } from '@/components/ui/ErrorState';

export default function NotFound() {
  return (
    <ErrorState
      code={404}
      title="404 - Page Not Found"
      description="The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
      showHome
      showDashboard
      showBack
    />
  );
}
