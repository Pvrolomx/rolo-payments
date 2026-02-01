import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/pay/demo');
  }, [router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
