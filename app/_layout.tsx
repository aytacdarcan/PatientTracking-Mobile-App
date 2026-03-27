import { Stack } from "expo-router";
import { useEffect } from "react";
import { initDb } from "../db/schema";

export default function RootLayout() {
    useEffect(() => {
        initDb();
    }, []);

    return (
        <Stack screenOptions={{ headerTitleAlign: "center" }}>
            <Stack.Screen name="index" options={{ title: "Hastalar" }} />
            <Stack.Screen name="patient-form" options={{ title: "Hasta" }} />
            <Stack.Screen name="patient-detail" options={{ title: "Hasta Detay" }} />
            <Stack.Screen name="visit-form" options={{ title: "Ziyaret" }} />
            <Stack.Screen name="graph" options={{ title: "Grafik" }} />
        </Stack>
    );
}
