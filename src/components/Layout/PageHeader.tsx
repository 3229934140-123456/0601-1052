interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, right }: PageHeaderProps) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
};
