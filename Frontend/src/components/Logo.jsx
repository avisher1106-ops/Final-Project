import "./Logo.css";

const BAR_X_POSITIONS = [16.5, 23, 29.5, 36, 42.5];
const BAR_HEIGHTS = [16, 26, 38, 26, 16];

export default function Logo({ size = 40, animated = false, className = "" }) {
  return (
    <svg
      className={`echo-logo ${animated ? "echo-logo--animated" : ""} ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="echo-logo__disc" cx="32" cy="32" r="32" />
      {BAR_HEIGHTS.map((height, index) => (
        <rect
          key={`${height}-${index}`}
          className="echo-logo__bar"
          x={BAR_X_POSITIONS[index]}
          y={32 - height / 2}
          width="5"
          height={height}
          rx="2.5"
        />
      ))}
    </svg>
  );
}
