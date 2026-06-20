import { PageTransition } from '@/components/common/PageTransition';
import { PrimaryButton } from '@/components/common/PrimaryButton';

export default function NotFoundPage() {
  return (
    <PageTransition className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <p className="bg-accent-gradient bg-clip-text text-7xl font-black text-transparent drop-shadow-[0_2px_24px_rgba(59,130,246,0.45)]">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-content">Lost in the Animus</h1>
        <p className="mt-2 text-sm text-muted">
          The page you’re looking for has drifted off-grid.
        </p>
        <PrimaryButton to="/" className="mt-6 inline-block">
          Back to browse
        </PrimaryButton>
      </div>
    </PageTransition>
  );
}
