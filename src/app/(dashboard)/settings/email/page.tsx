import { Header } from "@/components/header";
import { EmailSettingsClient } from "./email-settings-client";

export default function EmailSettingsPage() {
  return (
    <>
      <Header title="E-posta Entegrasyonu" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl">
          <EmailSettingsClient />
        </div>
      </div>
    </>
  );
}
