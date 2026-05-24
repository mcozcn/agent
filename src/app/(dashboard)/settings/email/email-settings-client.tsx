"use client";

import { useState, useEffect } from "react";
import { Mail, CheckCircle, Loader2, RefreshCw } from "lucide-react";

interface EmailConfig {
  isActive: boolean;
  provider: "IMAP" | "MICROSOFT_GRAPH";
  tenantId: string;
  clientId: string;
  clientSecret: string;
  mailbox: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPassword: string;
  lastSyncAt: string | null;
}

const defaultConfig: EmailConfig = {
  isActive: false,
  provider: "IMAP",
  tenantId: "",
  clientId: "",
  clientSecret: "",
  mailbox: "",
  imapHost: "imap.gmail.com",
  imapPort: 993,
  imapUser: "",
  imapPassword: "",
  lastSyncAt: null,
};

export function EmailSettingsClient() {
  const [config, setConfig] = useState<EmailConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/email/config")
      .then((r) => r.json() as Promise<EmailConfig>)
      .then((data) => setConfig({ ...defaultConfig, ...data }))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof EmailConfig>(key: K, value: EmailConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/email/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Ayarlar kaydedildi.");
    } else {
      const err = await res.json() as { error: unknown };
      setMessage("Kaydetme hatası: " + JSON.stringify(err.error));
    }
    setTimeout(() => setMessage(""), 4000);
  }

  async function handleSync() {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/email/sync", { method: "POST" });
      const data = await res.json() as { message: string; count?: number };
      setMessage(data.message || "Senkronizasyon tamamlandı.");
    } catch {
      setMessage("Senkronizasyon hatası.");
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(""), 4000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={24} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Bağlantı Ayarları</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-600">Aktif</span>
          <input
            type="checkbox"
            checked={config.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="w-4 h-4 rounded"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
        <select
          value={config.provider}
          onChange={(e) => set("provider", e.target.value as EmailConfig["provider"])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="IMAP">IMAP (Gmail / Exchange)</option>
          <option value="MICROSOFT_GRAPH">Microsoft 365 (Graph API)</option>
        </select>
      </div>

      {config.provider === "IMAP" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Mail className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Gmail için App Password gerekli</p>
                <p className="text-blue-700">
                  Google Hesap → Güvenlik → 2 Adımlı Doğrulama (açık olmalı) →{" "}
                  <strong>Uygulama Şifreleri</strong> → "Mail" seçip oluştur. 16 haneli şifreyi şifre alanına gir.
                </p>
              </div>
            </div>
          </div>

          {(["imapHost", "imapUser", "imapPassword"] as const).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key === "imapHost" ? "IMAP Sunucu" : key === "imapUser" ? "E-posta Adresi" : "App Password"}
              </label>
              <input
                type={key === "imapPassword" ? "password" : "text"}
                value={config[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={
                  key === "imapHost" ? "imap.gmail.com" :
                  key === "imapUser" ? "it-destek@firma.com" :
                  "xxxx xxxx xxxx xxxx"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input
              type="number"
              value={config.imapPort}
              onChange={(e) => set("imapPort", parseInt(e.target.value, 10))}
              placeholder="993"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </>
      )}

      {config.provider === "MICROSOFT_GRAPH" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Mail className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Microsoft 365 Outlook Entegrasyonu</p>
                <p className="text-blue-700">
                  Azure AD üzerinde uygulama kaydı oluşturun ve Mail.Read + Mail.ReadWrite izinleri verin.
                </p>
              </div>
            </div>
          </div>

          {(["tenantId", "clientId", "clientSecret", "mailbox"] as const).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key === "tenantId" ? "Tenant ID" :
                 key === "clientId" ? "Client ID (Application ID)" :
                 key === "clientSecret" ? "Client Secret" :
                 "Posta Kutusu (UPN)"}
              </label>
              <input
                type={key === "clientSecret" ? "password" : "text"}
                value={config[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={
                  key === "mailbox" ? "it-support@firma.com" : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          ))}
        </>
      )}

      {config.lastSyncAt && (
        <p className="text-xs text-gray-500">
          Son senkronizasyon: {new Date(config.lastSyncAt).toLocaleString("tr-TR")}
        </p>
      )}

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          message.toLowerCase().includes("hata") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
        }`}>
          {!message.toLowerCase().includes("hata") && <CheckCircle size={14} />}
          {message}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || !config.isActive}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Senkronize ediliyor..." : "Mailleri Senkronize Et"}
        </button>
      </div>
    </form>
  );
}
