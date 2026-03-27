import { useEffect, useState } from "react";
import {
    View,
    Text,
    Pressable,
    ScrollView,
    Alert,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getPatient, Patient, deletePatient } from "../db/repos/patientRepo";
import { listVisits, Visit } from "../db/repos/visitRepo";
import { trDate, ageTrText } from "../src/utils/date";

export default function PatientDetail() {
    const router = useRouter();
    const { patientId } = useLocalSearchParams<{ patientId: string }>();
    const id = Number(patientId);

    const [patient, setPatient] = useState<Patient | null>(null);
    const [visits, setVisits] = useState<Visit[]>([]);

    async function load() {
        const p = await getPatient(id);
        setPatient(p);

        if (p) {
            const v = await listVisits(id);
            setVisits(v);
        } else {
            setVisits([]);
        }
    }

    useEffect(() => {
        load();
    }, [id]);

    useEffect(() => {
        const t = setInterval(() => load(), 1200);
        return () => clearInterval(t);
    }, [id]);

    if (!patient) {
        return (
            <View style={styles.loadingWrap}>
                <Text style={styles.loadingText}>Yükleniyor / Hasta yok</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Hasta kartı */}
            <View style={styles.card}>
                <Text style={styles.name}>
                    {patient.first_name} {patient.last_name}
                </Text>

                <Text style={styles.meta}>
                    <Text style={styles.metaLabel}>TC:</Text> {patient.tc}
                </Text>
                <Text style={styles.meta}>
                    <Text style={styles.metaLabel}>Doğum:</Text> {trDate(patient.birth_date)} ({ageTrText(patient.birth_date)})
                </Text>

                <Text style={styles.meta}>
                    <Text style={styles.metaLabel}>Cinsiyet:</Text>{" "}
                    {patient.sex === "e" ? "Erkek" : "Kadın"}
                </Text>

                <View style={styles.row}>
                    <Pressable
                        onPress={() =>
                            router.push({
                                pathname: "/patient-form",
                                params: { patientId: String(patient.id) },
                            })
                        }
                        style={styles.secondaryButton}
                    >
                        <Text style={styles.secondaryButtonText}>✏️ Düzenle</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            Alert.alert(
                                "Hasta Sil",
                                "Bu hastayı ve tüm ziyaretlerini silmek istiyor musun?",
                                [
                                    { text: "Vazgeç", style: "cancel" },
                                    {
                                        text: "Sil",
                                        style: "destructive",
                                        onPress: async () => {
                                            await deletePatient(patient.id);
                                            router.replace("/");
                                        },
                                    },
                                ]
                            );
                        }}
                        style={styles.dangerButton}
                    >
                        <Text style={styles.dangerButtonText}>🗑️ Sil</Text>
                    </Pressable>
                </View>
            </View>

            {/* Üst butonlar */}
            <View style={styles.row}>
                <Pressable
                    onPress={() =>
                        router.push({
                            pathname: "/visit-form",
                            params: { patientId: String(patient.id) },
                        })
                    }
                    style={styles.primaryButton}
                >
                    <Text style={styles.primaryButtonText}>+ Ziyaret</Text>
                </Pressable>

                <Pressable
                    onPress={() =>
                        router.push({
                            pathname: "/graph",
                            params: { patientId: String(patient.id) },
                        })
                    }
                    style={styles.primaryButton}
                >
                    <Text style={styles.primaryButtonText}>Grafik</Text>
                </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Ziyaretler</Text>

            {visits.length === 0 ? (
                <Text style={styles.empty}>Kayıt yok</Text>
            ) : (
                visits.map((v, i) => (
                    <Pressable
                        key={v.id}
                        onPress={() =>
                            router.push({
                                pathname: "/visit-form",
                                params: {
                                    patientId: String(patient.id),
                                    visitId: String(v.id),
                                },
                            })
                        }
                        style={styles.visitCard}
                    >
                        <Text style={styles.visitTitle}>
                            #{i + 1} • {trDate(v.visit_date)}
                        </Text>


                        <Text style={styles.meta}>
                            <Text style={styles.metaLabel}>Boy:</Text> {v.height ?? "-"} cm
                        </Text>
                        <Text style={styles.meta}>
                            <Text style={styles.metaLabel}>Kilo:</Text> {v.weight ?? "-"} kg
                        </Text>
                        <Text style={styles.meta}>
                            <Text style={styles.metaLabel}>Baş:</Text> {v.head_circ ?? "-"} cm
                        </Text>

                        {!!v.note && (
                            <Text style={[styles.meta, { marginTop: 4 }]}>
                                <Text style={styles.metaLabel}>Not:</Text> {v.note}
                            </Text>
                        )}

                        <Text style={styles.hint}>Düzenlemek için dokun</Text>
                    </Pressable>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingWrap: {
        flex: 1,
        padding: 16,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
    },
    loadingText: {
        color: "#6B7280",
        textAlign: "center",
        fontSize: 14,
        fontWeight: "600",
    },
    container: {
        padding: 16,
        paddingBottom: 40,
        gap: 12,
        backgroundColor: "#F3F4F6",
    },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        gap: 6,
    },
    name: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 4,
    },
    meta: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 21,
        fontWeight: "500",
    },
    metaLabel: {
        fontWeight: "700",
        color: "#111827",
    },
    row: {
        flexDirection: "row",
        gap: 10,
        marginTop: 8,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: "#2563EB",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "white",
        fontWeight: "800",
        fontSize: 15,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    secondaryButtonText: {
        fontWeight: "800",
        color: "#111827",
    },
    dangerButton: {
        flex: 1,
        backgroundColor: "#FEE2E2",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#FCA5A5",
    },
    dangerButtonText: {
        fontWeight: "900",
        color: "#B91C1C",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        marginTop: 4,
    },
    visitCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        gap: 4,
    },
    visitTitle: {
        fontWeight: "800",
        fontSize: 15,
        marginBottom: 4,
    },
    hint: {
        marginTop: 8,
        color: "#6B7280",
        fontSize: 12,
        fontWeight: "600",
    },
    empty: {
        color: "#6B7280",
        fontSize: 14,
        fontWeight: "600",
    },
});
