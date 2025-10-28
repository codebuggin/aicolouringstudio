import { ColoringPageForm } from '@/components/coloring-page-form';
import { MotionDiv } from '@/components/motion-div';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center flex-grow">
      <MotionDiv 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="z-10 w-full max-w-4xl"
      >
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight gradient-text">
          Turn Any Idea into a Printable Coloring Page
        </h1>
        <p className="text-muted-foreground mt-6 text-lg sm:text-xl max-w-2xl mx-auto">
          Describe your idea. Get an AI-generated image in seconds. Welcome to the future of creativity.
        </p>
        <div className="mt-10">
          <ColoringPageForm />
        </div>
      </MotionDiv>
    </div>
  );
}
