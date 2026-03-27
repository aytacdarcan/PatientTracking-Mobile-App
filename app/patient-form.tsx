import { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    Alert,
    Platform,
    Modal,
    KeyboardAvoidingView,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createPatient, Sex, getPatient, updatePatient } from "../db/repos/patientRepo";

function isoFromDate(d: Date) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
}

function dateFromIso(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

export default function PatientForm() {
    const router = useRouter();
    const { patientId } = useLocalSearchParams<{ patientId?: string }>();
    const editId = patientId ? Number(patientId) : null;
    const isEdit = !!editId;

    const [tc, setTc] = useState("");
    const [first, setFirst] = useState("");
    const [last, setLast] = useState("");
    const [birth, setBirth] = useState("2020-01-01");
    const [sex, setSex] = useState<Sex>("k");
    const [phone, setPhone] = useState("");
    const [showDate, setShowDate] = useState(false);

    const birthDateObj = useMemo(() => dateFromIso(birth), [birth]);

    useEffect(() => {
        (async () => {
            if (!editId) return;
            const p = await getPatient(editId);
            if (!p) return;

            setTc(p.tc ?? "");
            setFirst(p.first_name ?? "");
            setLast(p.last_name ?? "");
            setBirth(p.birth_date ?? "2020-01-01");
            setSex((p.sex as Sex) ?? "k");
            setPhone(p.phone ?? "");
        })();
    }, [editId]);

    async function save() {
        if (!tc || !first || !last || !birth) {
            Alert.alert("Uyarı", "TC, Ad, Soyad ve Doğum Tarihi zorunludur.");
            return;
        }
        if (tc.length !== 11) {
            Alert.alert("Uyarı", "TC Kimlik No 11 haneli olmalıdır.");
            return;
        }


        if (editId) {
            await updatePatient({
                id: editId,
                tc,
                first_name: first,
                last_name: last,
                birth_date: birth,
                sex,
                phone: phone || null,
            });

            Alert.alert("Başarılı", "Hasta güncellendi.", [
                {
                    text: "Tamam",
                    onPress: () =>
                        router.replace({
                            pathname: "/patient-detail",
                            params: { patientId: String(editId) },
                        }),
                },
            ]);
            return;
        }

        await createPatient({
            tc,
            first_name: first,
            last_name: last,
            birth_date: birth,
            sex,
            phone: phone || null,
        });

        Alert.alert("Başarılı", "Hasta eklendi.", [
            { text: "Tamam", onPress: () => router.replace("/") },
        ]);
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: "#F3F4F6" }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={110}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>{isEdit ? "Hasta Düzenle" : "Hasta Ekle"}</Text>

                        <Text style={styles.label}>TC Kimlik No</Text>
                        <TextInput
                            placeholder="11 haneli TC"
                            value={tc}
                            onChangeText={setTc}
                            keyboardType="number-pad"
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                            style={styles.input}
                        />

                        <Text style={styles.label}>Ad</Text>
                        <TextInput
                            placeholder="Örn: Ahmet"
                            value={first}
                            onChangeText={setFirst}
                            style={styles.input}
                        />

                        <Text style={styles.label}>Soyad</Text>
                        <TextInput
                            placeholder="Örn: Yılmaz"
                            value={last}
                            onChangeText={setLast}
                            style={styles.input}
                        />

                        <Text style={styles.label}>Doğum Tarihi</Text>
                        <Pressable style={styles.dateBox} onPress={() => setShowDate(true)}>
                            <Text style={styles.dateText}>{birth}</Text>
                            <Text style={styles.dateIcon}>📅</Text>
                        </Pressable>

                        {/* ✅ Doğum tarihi modal */}
                        <Modal visible={showDate} transparent animationType="slide">
                            <Pressable style={styles.modalOverlay} onPress={() => setShowDate(false)} />

                            <View style={styles.modalCard}>
                                <Text style={styles.modalTitle}>Doğum Tarihi Seç</Text>

                                <View style={styles.pickerWrap}>
                                    <DateTimePicker
                                        value={birthDateObj}
                                        mode="date"
                                        display="spinner"
                                        locale="tr-TR"
                                        themeVariant="light"
                                        textColor="#111827"
                                        onChange={(_, selected) => {
                                            if (selected) setBirth(isoFromDate(selected));
                                        }}
                                        style={{ alignSelf: "center", backgroundColor: "transparent" }}
                                    />
                                </View>

                                <Pressable style={styles.primaryButton} onPress={() => setShowDate(false)}>
                                    <Text style={styles.primaryButtonText}>Tamam</Text>
                                </Pressable>
                            </View>
                        </Modal>

                        <Text style={styles.label}>Cinsiyet</Text>
                        <View style={styles.row}>
                            {[
                                { key: "k", label: "Kadın" },
                                { key: "e", label: "Erkek" },
                            ].map((i) => (
                                <Pressable
                                    key={i.key}
                                    onPress={() => setSex(i.key as Sex)}
                                    style={[styles.genderButton, sex === i.key && styles.genderButtonActive]}
                                >
                                    <Text style={[styles.genderText, sex === i.key && styles.genderTextActive]}>
                                        {i.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={styles.label}>Telefon</Text>
                        <TextInput
                            placeholder="05xx xxx xx xx"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                            style={styles.input}
                        />

                        <Pressable style={styles.primaryButton} onPress={save}>
                            <Text style={styles.primaryButtonText}>Kaydet</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "white",
        borderRadius: 18,
        padding: 16,
        gap: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    input: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        backgroundColor: "white",
    },
    dateBox: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dateText: {
        fontWeight: "600",
    },
    dateIcon: {
        opacity: 0.6,
    },
    row: {
        flexDirection: "row",
        gap: 10,
    },
    genderButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
    },
    genderButtonActive: {
        backgroundColor: "#2563EB",
        borderColor: "#2563EB",
    },
    genderText: {
        fontWeight: "700",
        color: "#374151",
    },
    genderTextActive: {
        color: "white",
    },
    primaryButton: {
        backgroundColor: "#2563EB",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        marginTop: 8,
    },
    primaryButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "800",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    modalCard: {
        backgroundColor: "white",
        padding: 16,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 10,
    },
    pickerWrap: {
        marginTop: 8,
        marginBottom: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
});
