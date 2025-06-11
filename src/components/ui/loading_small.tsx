export function LoadingSmall() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-10">
        <div className="relative h-16 w-16">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.2s]" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.4s]" />
        </div>
        <p className="text-black text-lg text-center">Loading</p>
      </div>
    )
}