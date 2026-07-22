import type { Connector } from "@/lib/mock-data";

export function ConnectorLogo({ connector }: { connector: Connector }) {
  if (connector.logoUrl) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- external per-connector logos, no fixed domain list to allowlist */}
        <img src={connector.logoUrl} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-4 text-body-medium text-gray-11">
      {connector.name.charAt(0).toUpperCase()}
    </span>
  );
}
