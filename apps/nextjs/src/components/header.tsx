interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2 pb-6 border-b mb-6">
      <div className="grid gap-1.5">
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">{heading}</h1>
        {text && <p className="text-base text-muted-foreground">{text}</p>}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {children}
      </div>
    </div>
  );
}
