type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
    </div>
  );
}
