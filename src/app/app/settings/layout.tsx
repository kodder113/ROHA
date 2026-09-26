import { PageHeader } from "@/components/ui/misc";
import { SettingsTabs } from "@/components/app/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Organization settings" />
      <SettingsTabs />
      <div className="pt-2">{children}</div>
    </div>
  );
}
