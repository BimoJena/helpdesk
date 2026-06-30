import AppLayout from "../components/AppLayout";

interface HomePageProps {
  userName: string;
}

export default function HomePage({ userName }: HomePageProps) {
  return (
    <AppLayout>
      <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
      <p className="mt-2 text-sm text-gray-500">Welcome back, {userName}!</p>
    </AppLayout>
  );
}
