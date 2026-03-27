import { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { listPatients, Patient } from "../db/repos/patientRepo";
import { trDate } from "../src/utils/date";


export default function Index() {
    const router = useRouter();
    const [q, setQ] = useState("");
    const [items, setItems] = useState<Patient[]>([]);

    async function refresh() {
        const data = await listPatients(q);
        setItems(data);
    }

    useEffect(() => {
        refresh();
    }, [q]);

    useEffect(() => {
        const t = setInterval(() => refresh(), 1500);
        return () => clearInterval(t);
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hastalar</Text>

            <TextInput
                placeholder="Ara (TC / Ad / Soyad)"
                value={q}
                onChangeText={setQ}
                style={styles.search}
            />

            <Pressable
                onPress={() => router.push("/patient-form")}
                style={styles.addButton}
            >
                <Text style={styles.addButtonText}>+ Yeni Hasta</Text>
            </Pressable>

            <FlatList
                data={items}
                keyExtractor={(x) => String(x.id)}
                ListEmptyComponent={
                    <Text style={styles.empty}>Kayıt bulunamadı</Text>
                }
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() =>
                            router.push({
                                pathname: "/patient-detail",
                                params: { patientId: String(item.id) },
                            })
                        }
                        style={styles.card}
                    >
                        <Text style={styles.name}>
                            {item.first_name} {item.last_name}
                        </Text>

                        <Text style={styles.meta}>TC: {item.tc}</Text>
                        <Text style={styles.meta}>
                            Doğum: {trDate(item.birth_date)} •{" "}
                            {item.sex === "e" ? "Erkek" : "Kadın"}
                        </Text>
                    </Pressable>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#F3F4F6",
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 10,
    },
    search: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        backgroundColor: "white",
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: "#2563EB",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        marginBottom: 12,
    },
    addButtonText: {
        color: "white",
        fontWeight: "800",
        fontSize: 15,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB"
    },
    name: {
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 6,
    },
    meta: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 21,
        fontWeight: "500",
    },
    empty: {
        marginTop: 20,
        textAlign: "center",
        color: "#6B7280",
    },
});
