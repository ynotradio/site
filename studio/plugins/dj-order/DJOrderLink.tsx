// /plugins/dj-order/DJOrderLink.tsx
import { useEffect } from 'react';
import { useRouter } from 'sanity/router';

// This component will redirect to the DJ order tool
export function DJOrderLink() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to the tool using the router
    router.navigateUrl({ path: '/dj-order-tool' });
  }, [router]);

  return (
    <div style={{ padding: '2em', textAlign: 'center' }}>
            Redirecting to DJ Order Tool...
    </div>
  );
}

export default DJOrderLink;
