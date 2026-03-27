import { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    Alert,
    Modal,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createVisit, deleteVisit, getVisit, updateVisit } from "../db/repos/visitRepo";



function isoFromDate(d: Date) {
    return d.toISOString().slice(0, 10);
}
function dateFromIso(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

export default function VisitForm() {
    const router = useRouter();
    const { patientId, visitId } = useLocalSearchParams<{ patientId: string; visitId?: string }>();

    const editId = visitId ? Number(visitId) : null;

    const today = new Date();
    const [dateObj, setDateObj] = useState<Date>(today);
    const [date, setDate] = useState<string>(isoFromDate(today));
    const [tmpDateObj, setTmpDateObj] = useState<Date>(today);
    const [showDate, setShowDate] = useState(false);

    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [head, setHead] = useState("");
    const [note, setNote] = useState("");

    const weightRef = useRef<TextInput>(null);
    const headRef = useRef<TextInput>(null);
    const noteRef = useRef<TextInput>(null);

    useEffect(() => {
        (async () => {
            if (!editId) return;

            const v = await getVisit(editId);
            if (!v) return;

            setDate(v.visit_date);
            const d = dateFromIso(v.visit_date);
            setDateObj(d);
            setTmpDateObj(d);

            setHeight(v.height != null ? String(v.height) : "");
            setWeight(v.weight != null ? String(v.weight) : "");
            setHead(v.head_circ != null ? String(v.head_circ) : "");
            setNote(v.note ?? "");
        })();
    }, [editId]);

    const toNum = (s: string) => (s ? Number(s.replace(",", ".")) : null);

    async function save() {
        if (!patientId) {
            Alert.alert("Hata", "patientId yok");
            return;
        }
        if (!height && !weight && !head) {
            Alert.alert("Uyarı", "En az bir ölçüm gir (boy/kilo/baş)");
            return;
        }

        const payload = {
            visit_date: date,
            height: toNum(height),
            weight: toNum(weight),
            head_circ: toNum(head),
            note: note || null,
        };

        if (editId) {
            await updateVisit({ id: editId, ...payload });
        } else {
            await createVisit({ patient_id: Number(patientId), ...payload });
        }

        router.back();
    }

    function remove() {
        if (!editId) return;

        Alert.alert("Ziyaret Sil", "Bu ziyareti silmek istiyor musun?", [
            { text: "Vazgeç", style: "cancel" },
            {
                text: "Sil",
                style: "destructive",
                onPress: async () => {
                    await deleteVisit(editId);
                    router.back();
                },
            },
        ]);
    }

    const Label = ({ children }: { children: string }) => (
        <Text style={{ fontSize: 14, fontWeight: "700", marginBottom: 6 }}>
            {children}
        </Text>
    );

    const Input = (props: any) => (
        <TextInput
            {...props}
            style={[
                {
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    fontSize: 16,
                    backgroundColor: "white",
                },
                props.style,
            ]}
        />
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 160 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={{ fontSize: 24, fontWeight: "900" }}>
                            {editId ? "Ziyaret Düzenle" : "Ziyaret Ekle"}
                        </Text>

                        {/* Tarih */}
                        <View style={{ borderWidth: 1, borderRadius: 14, padding: 12, gap: 8, backgroundColor: "#f3f3f3" }}>
                            <Label>Ziyaret Tarihi</Label>

                            <Pressable
                                onPress={() => {
                                    setTmpDateObj(dateObj);
                                    setShowDate(true);
                                }}
                                style={{
                                    borderWidth: 1,
                                    borderRadius: 12,
                                    padding: 12,
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    backgroundColor: "white",
                                }}
                            >
                                <Text style={{ fontWeight: "900" }}>{date}</Text>
                                <Text style={{ opacity: 0.6 }}>📅 Seç</Text>
                            </Pressable>

                            <Modal visible={showDate} transparent animationType="slide" onRequestClose={() => setShowDate(false)}>
                                <Pressable onPress={() => setShowDate(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} />

                                <View style={{ backgroundColor: "white", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 14 }}>
                                    <Text style={{ fontWeight: "900", fontSize: 16, marginBottom: 10 }}>
                                        Ziyaret Tarihi Seç
                                    </Text>

                                    <View style={{ height: 260, justifyContent: "center" }}>
                                        <DateTimePicker
                                            value={tmpDateObj}
                                            mode="date"
                                            locale="tr-TR"
                                            display={Platform.OS === "ios" ? "spinner" : "default"}
                                            themeVariant="light"
                                            onChange={(_, selected) => {
                                                if (selected) setTmpDateObj(selected);
                                            }}
                                            style={{ alignSelf: "center" }}
                                        />
                                    </View>

                                    <Pressable
                                        onPress={() => {
                                            setDateObj(tmpDateObj);
                                            setDate(isoFromDate(tmpDateObj));
                                            setShowDate(false);
                                        }}
                                        style={{ backgroundColor: "#2563EB", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 10 }}
                                    >
                                        <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                                            Tamam
                                        </Text>
                                    </Pressable>
                                </View>
                            </Modal>
                        </View>

                        {/* Ölçümler */}
                        <View style={{ borderWidth: 1, borderRadius: 14, padding: 12, gap: 12, backgroundColor: "#f3f3f3" }}>
                            <Text style={{ fontSize: 16, fontWeight: "900" }}>Ölçümler</Text>

                            <View style={{ gap: 8 }}>
                                <Label>Boy (cm)</Label>
                                <Input
                                    value={height}
                                    onChangeText={setHeight}
                                    placeholder="Örn: 92.5"
                                    keyboardType="decimal-pad"
                                    returnKeyType="next"
                                    onSubmitEditing={() => weightRef.current?.focus()}
                                />
                            </View>

                            <View style={{ gap: 8 }}>
                                <Label>Kilo (kg)</Label>
                                <Input
                                    ref={weightRef}
                                    value={weight}
                                    onChangeText={setWeight}
                                    placeholder="Örn: 13.2"
                                    keyboardType="decimal-pad"
                                    returnKeyType="next"
                                    onSubmitEditing={() => headRef.current?.focus()}
                                />
                            </View>

                            <View style={{ gap: 8 }}>
                                <Label>Baş Çevresi (cm)</Label>
                                <Input
                                    ref={headRef}
                                    value={head}
                                    onChangeText={setHead}
                                    placeholder="Örn: 48.0"
                                    keyboardType="decimal-pad"
                                    returnKeyType="next"
                                    onSubmitEditing={() => noteRef.current?.focus()}
                                />
                            </View>
                        </View>

                        {/* Not */}
                        <View style={{ borderWidth: 1, borderRadius: 14, padding: 12, gap: 8, backgroundColor: "#f3f3f3" }}>
                            <Label>Not</Label>
                            <Input
                                ref={noteRef}
                                value={note}
                                onChangeText={setNote}
                                placeholder="Kısa not..."
                                multiline
                                style={{ height: 110, textAlignVertical: "top" }}
                                returnKeyType="done"
                                onSubmitEditing={Keyboard.dismiss}
                            />
                        </View>

                        {/* Kaydet */}
                        <Pressable
                            onPress={save}
                            style={{ backgroundColor: "#2563EB", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 }}
                        >
                            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
                                Kaydet
                            </Text>
                        </Pressable>

                        {/* Sil (sadece edit mod) */}
                        {editId ? (
                            <Pressable
                                onPress={remove}
                                style={{ borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 6 }}
                            >
                                <Text style={{ fontWeight: "900", color: "red" }}>🗑️ Ziyareti Sil</Text>
                            </Pressable>
                        ) : null}
                    </ScrollView>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
