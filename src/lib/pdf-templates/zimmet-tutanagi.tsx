import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const CATEGORY_LABELS: Record<string, string> = {
  COMPUTER: "Masaüstü Bilgisayar",
  LAPTOP: "Dizüstü Bilgisayar",
  MONITOR: "Monitör",
  KEYBOARD: "Klavye",
  MOUSE: "Fare",
  PRINTER: "Yazıcı",
  PHONE: "Telefon",
  TABLET: "Tablet",
  NETWORK: "Ağ Cihazı",
  SERVER: "Sunucu",
  UPS: "UPS",
  OTHER: "Diğer",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface ZimmetPdfData {
  company: {
    name: string;
    address: string | null;
    phone: string | null;
  };
  employee: {
    firstName: string;
    lastName: string;
    title: string | null;
    department: string | null;
  };
  assignments: Array<{
    assetCode: string;
    name: string;
    category: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    assignedAt: string;
    notes: string | null;
  }>;
  generatedAt: string;
}

const s = StyleSheet.create({
  page: { padding: 50, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginBottom: 12,
  },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  companyMeta: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  titleBlock: { alignItems: "flex-end" },
  docTitle: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  docDate: { fontSize: 8, color: "#6b7280", marginTop: 3 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", marginVertical: 10 },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  infoRow: { flexDirection: "row", marginBottom: 3 },
  infoLabel: { fontSize: 8, color: "#6b7280", width: 70 },
  infoValue: { fontSize: 8, fontFamily: "Helvetica-Bold", flex: 1 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#e5e7eb",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  thCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  tdCell: { fontSize: 8, color: "#374151" },
  colNo: { width: 18 },
  colCode: { width: 58 },
  colName: { flex: 1 },
  colCat: { width: 78 },
  colBrand: { width: 78 },
  colSerial: { width: 68 },
  notesBox: {
    backgroundColor: "#f9fafb",
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderRadius: 3,
    padding: 8,
    marginTop: 10,
  },
  notesLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280", marginBottom: 3 },
  notesText: { fontSize: 8, color: "#374151" },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 48,
  },
  signatureBox: { width: "44%" },
  signatureTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#374151", marginBottom: 24 },
  signatureLine: { borderTopWidth: 0.5, borderTopColor: "#9ca3af", marginBottom: 4 },
  signatureSub: { fontSize: 7, color: "#9ca3af" },
});

export function ZimmetTutanagi({ data }: { data: ZimmetPdfData }) {
  const { company, employee, assignments, generatedAt } = data;

  const notes = assignments
    .map((a) => a.notes)
    .filter((n): n is string => Boolean(n?.trim()));

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.companyName}>{company.name}</Text>
            {company.address ? <Text style={s.companyMeta}>{company.address}</Text> : null}
            {company.phone ? <Text style={s.companyMeta}>{company.phone}</Text> : null}
          </View>
          <View style={s.titleBlock}>
            <Text style={s.docTitle}>ZİMMET TUTANAĞI</Text>
            <Text style={s.docDate}>Tarih: {formatDate(generatedAt)}</Text>
          </View>
        </View>

        {/* Employee info */}
        <Text style={s.sectionLabel}>Zimmet Alan</Text>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Ad Soyad</Text>
          <Text style={s.infoValue}>{employee.lastName}, {employee.firstName}</Text>
        </View>
        {employee.title ? (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Unvan</Text>
            <Text style={s.infoValue}>{employee.title}</Text>
          </View>
        ) : null}
        {employee.department ? (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Departman</Text>
            <Text style={s.infoValue}>{employee.department}</Text>
          </View>
        ) : null}
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Firma</Text>
          <Text style={s.infoValue}>{company.name}</Text>
        </View>

        <View style={s.divider} />

        {/* Table */}
        <Text style={s.sectionLabel}>Zimmetli Demirbaşlar</Text>
        <View style={s.tableHeader}>
          <Text style={[s.thCell, s.colNo]}>#</Text>
          <Text style={[s.thCell, s.colCode]}>Kod</Text>
          <Text style={[s.thCell, s.colName]}>Demirbaş</Text>
          <Text style={[s.thCell, s.colCat]}>Kategori</Text>
          <Text style={[s.thCell, s.colBrand]}>Marka / Model</Text>
          <Text style={[s.thCell, s.colSerial]}>Seri No</Text>
        </View>
        {assignments.map((a, i) => (
          <View key={a.assetCode} style={s.tableRow}>
            <Text style={[s.tdCell, s.colNo]}>{i + 1}</Text>
            <Text style={[s.tdCell, s.colCode]}>{a.assetCode}</Text>
            <Text style={[s.tdCell, s.colName]}>{a.name}</Text>
            <Text style={[s.tdCell, s.colCat]}>{CATEGORY_LABELS[a.category] ?? a.category}</Text>
            <Text style={[s.tdCell, s.colBrand]}>
              {[a.brand, a.model].filter(Boolean).join(" ") || "—"}
            </Text>
            <Text style={[s.tdCell, s.colSerial]}>{a.serialNumber ?? "—"}</Text>
          </View>
        ))}

        {/* Notes */}
        {notes.length > 0 ? (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>NOT</Text>
            {notes.map((n, i) => (
              <Text key={i} style={s.notesText}>{n}</Text>
            ))}
          </View>
        ) : null}

        {/* Signatures */}
        <View style={s.signatureRow}>
          <View style={s.signatureBox}>
            <Text style={s.signatureTitle}>Zimmet Eden</Text>
            <View style={s.signatureLine} />
            <Text style={s.signatureSub}>Ad Soyad / İmza / Tarih</Text>
          </View>
          <View style={s.signatureBox}>
            <Text style={s.signatureTitle}>Zimmet Alan</Text>
            <View style={s.signatureLine} />
            <Text style={s.signatureSub}>{employee.lastName}, {employee.firstName} / İmza / Tarih</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
