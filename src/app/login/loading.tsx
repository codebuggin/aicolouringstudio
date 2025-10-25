export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="mx-auto grid w-[350px] gap-6 glass-card p-6 rounded-lg animate-pulse">
          <div className="grid gap-2 text-center">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-2/3 mx-auto mt-2"></div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
            <div className="grid gap-2">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
            <div className="h-10 bg-primary/50 rounded w-full"></div>
          </div>
           <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-transparent">
                Or continue with
              </span>
            </div>
          </div>
          <div className="h-10 bg-muted rounded w-full"></div>
          <div className="mt-4 text-center text-sm">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
          </div>
      </div>
    </div>
  )
}
