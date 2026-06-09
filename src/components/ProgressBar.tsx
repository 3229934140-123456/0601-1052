interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  warningColor?: string;
  dangerColor?: string;
  showPercentage?: boolean;
  height?: string;
  warningThreshold?: number;
  dangerThreshold?: number;
}

export const ProgressBar = ({
  value,
  max,
  color = 'bg-teal-500',
  warningColor = 'bg-amber-500',
  dangerColor = 'bg-red-500',
  showPercentage = false,
  height = 'h-2',
  warningThreshold = 0.8,
  dangerThreshold = 1,
}: ProgressBarProps) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const ratio = max > 0 ? value / max : 0;

  let barColor = color;
  if (ratio >= dangerThreshold) {
    barColor = dangerColor;
  } else if (ratio >= warningThreshold) {
    barColor = warningColor;
  }

  const isOver = ratio > 1;

  return (
    <div className="w-full">
      <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${barColor} rounded-full transition-all duration-500 ${
            isOver ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showPercentage && (
        <div className="mt-1 text-xs text-slate-500">
          {percentage.toFixed(0)}%
          {isOver && <span className="ml-1 text-red-500 font-medium">已超支</span>}
        </div>
      )}
    </div>
  );
};
