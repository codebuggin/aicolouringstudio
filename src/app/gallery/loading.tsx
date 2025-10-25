import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-12 w-1/2 mx-auto mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="glass-card overflow-hidden flex flex-col">
            <CardContent className="p-0 aspect-square w-full">
              <Skeleton className="w-full h-full" />
            </CardContent>
            <div className="p-4 flex flex-col flex-grow">
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-9 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
