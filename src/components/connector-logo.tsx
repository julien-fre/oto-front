import { cn } from "@/lib/cn";
import type { Connector } from "@/lib/mock-data";

const SIZE_CLASSES = { md: "size-8 text-body-medium", sm: "size-6 text-caption" } as const;

export function ConnectorLogo({
  connector,
  size = "md",
}: {
  connector: Connector;
  size?: keyof typeof SIZE_CLASSES;
}) {
  if (connector.logoUrl) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-3",
          SIZE_CLASSES[size],
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external per-connector logos, no fixed domain list to allowlist */}
        <img src={connector.logoUrl} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gray-4 text-gray-11",
        SIZE_CLASSES[size],
      )}
    >
      {connector.name.charAt(0).toUpperCase()}
    </span>
  );
}
