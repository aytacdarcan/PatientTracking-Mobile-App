import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Line, Circle, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { useLocalSearchParams } from "expo-router";

import { getPatient } from "../db/repos/patientRepo";
import { listVisits } from "../db/repos/visitRepo";
import { monthsBetween } from "../services/age";
import { loadLmsOnce, getLmsInterp } from "../services/lmsService";
import { xFromLms, calcSds } from "../services/sdsService";
import { ymdTrTextFromMonths, trDate } from "../src/utils/date";

type Measure = "BoyCm" | "KiloKg" | "BasCevresiCm";
type XY = { x: number; y: number; visitDate?: string };

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function measureLabel(m: Measure) {
    return m === "BoyCm" ? "Boy (cm)" : m === "KiloKg" ? "Kilo (kg)" : "Baş çevresi (cm)";
}

export default function Graph() {
    const { patientId } = useLocalSearchParams<{ patientId: string }>();
    const id = Number(patientId);

    const [measure, setMeasure] = useState<Measure>("BoyCm");
    const [points, setPoints] = useState<XY[]>([]);
    const [ref, setRef] = useState<{ x: number; y: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [selected, setSelected] = useState<{
        ageAy: number;
        value: number;
        visitDate?: string;
        p50?: number;
        sds?: number;
    } | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setErr(null);
                setSelected(null);

                await loadLmsOnce();

                const p = await getPatient(id);
                if (!p) throw new Error("Hasta bulunamadı.");

                const visits = await listVisits(id);

                const pts: XY[] = [];
                for (const v of visits) {
                    const age = monthsBetween(p.birth_date, v.visit_date);
                    const y =
                        measure === "BoyCm"
                            ? v.height
                            : measure === "KiloKg"
                                ? v.weight
                                : v.head_circ;

                    if (y != null && Number.isFinite(age)) {
                        pts.push({ x: age, y: Number(y), visitDate: v.visit_date });
                    }
                }

                const maxX = Math.max(60, ...pts.map((p) => p.x));
                const line: { x: number; y: number }[] = [];
                for (let x = 0; x <= Math.ceil(maxX); x++) {
                    const lms = getLmsInterp(measure, p.sex, x);
                    if (!lms) continue;
                    line.push({ x, y: xFromLms(0, lms.L, lms.M, lms.S) });
                }

                if (!alive) return;
                setPoints(pts.sort((a, b) => a.x - b.x));
                setRef(line);
            } catch (e: any) {
                if (!alive) return;
                setErr(e?.message ?? "Grafik açılamadı.");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [id, measure]);

    const Btn = ({ label, val }: { label: string; val: Measure }) => (
        <Pressable
            onPress={() => setMeasure(val)}
            style={{
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 14,
                backgroundColor: measure === val ? "#eee" : "transparent",
            }}
        >
            <Text style={{ fontWeight: measure === val ? "900" : "700" }}>{label}</Text>
        </Pressable>
    );

    const W = 360;
    const H = 260;
    const padL = 42;
    const padR = 12;
    const padT = 14;
    const padB = 28;

    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const domain = useMemo(() => {
        const xs = [...points.map((p) => p.x), ...ref.map((p) => p.x)];
        const ys = [...points.map((p) => p.y), ...ref.map((p) => p.y)];
        const xmin = xs.length ? Math.min(...xs) : 0;
        const xmax = xs.length ? Math.max(...xs) : 60;

        let ymin = ys.length ? Math.min(...ys) : 0;
        let ymax = ys.length ? Math.max(...ys) : 1;

        const yPad = (ymax - ymin) * 0.15 || 1;
        ymin -= yPad;
        ymax += yPad;

        const xPad = (xmax - xmin) * 0.05 || 1;
        return {
            xmin: Math.max(0, xmin - xPad),
            xmax: xmax + xPad,
            ymin,
            ymax,
        };
    }, [points, ref]);

    function xToSvg(x: number) {
        const t = (x - domain.xmin) / (domain.xmax - domain.xmin || 1);
        return padL + clamp(t, 0, 1) * chartW;
    }

    function yToSvg(y: number) {
        const t = (y - domain.ymin) / (domain.ymax - domain.ymin || 1);
        return padT + (1 - clamp(t, 0, 1)) * chartH;
    }

    const refPolyline = useMemo(() => {
        if (!ref.length) return "";
        return ref.map((p) => `${xToSvg(p.x)},${yToSvg(p.y)}`).join(" ");
    }, [ref, domain]);

    async function onPickPoint(pt: XY) {
        const p = await getPatient(id);
        if (!p) return;

        const lms = getLmsInterp(measure, p.sex, Math.round(pt.x));
        if (!lms) {
            setSelected({
                ageAy: pt.x,
                value: pt.y,
                visitDate: pt.visitDate,
            });
            return;
        }

        const p50 = xFromLms(0, lms.L, lms.M, lms.S);
        const sds = calcSds(pt.y, lms.L, lms.M, lms.S);

        setSelected({
            ageAy: pt.x,
            value: pt.y,
            visitDate: pt.visitDate,
            p50,
            sds,
        });
    }

    if (loading) {
        return (
            <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
                <Text>Yükleniyor...</Text>
            </View>
        );
    }

    if (err) {
        return (
            <View style={{ flex: 1, padding: 16, gap: 10 }}>
                <Text style={{ fontSize: 20, fontWeight: "900" }}>Grafik</Text>
                <Text>{err}</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "900" }}>Grafik</Text>

            <View style={{ flexDirection: "row", gap: 8 }}>
                <Btn label="Boy" val="BoyCm" />
                <Btn label="Kilo" val="KiloKg" />
                <Btn label="Baş" val="BasCevresiCm" />
            </View>

            {points.length === 0 ? (
                <View style={{ gap: 6, marginTop: 10 }}>
                    <Text>Bu ölçüm için henüz ziyaret verisi yok.</Text>
                    <Text>Önce ziyaret ekleyip tekrar deneyin.</Text>
                </View>
            ) : (
                <>
                    <View style={{ borderWidth: 1, borderRadius: 14, padding: 10 }}>
                        <Svg width={W} height={H}>
                            <Rect x={0} y={0} width={W} height={H} fill="white" />

                            {[0.25, 0.5, 0.75].map((t, i) => {
                                const y = padT + t * chartH;
                                return (
                                    <Line
                                        key={`gy-${i}`}
                                        x1={padL}
                                        y1={y}
                                        x2={padL + chartW}
                                        y2={y}
                                        stroke="#e5e7eb"
                                        strokeWidth={1}
                                    />
                                );
                            })}
                            {[0.25, 0.5, 0.75].map((t, i) => {
                                const x = padL + t * chartW;
                                return (
                                    <Line
                                        key={`gx-${i}`}
                                        x1={x}
                                        y1={padT}
                                        x2={x}
                                        y2={padT + chartH}
                                        stroke="#e5e7eb"
                                        strokeWidth={1}
                                    />
                                );
                            })}

                            <Line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#111827" strokeWidth={1.5} />
                            <Line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#111827" strokeWidth={1.5} />

                            <SvgText x={padL} y={H - 6} fontSize={12} fill="#111827">
                                Yaş (ay)
                            </SvgText>

                            {refPolyline ? <Polyline points={refPolyline} fill="none" stroke="#2563EB" strokeWidth={2} /> : null}

                            {points.map((p, idx) => {
                                const isSel =
                                    selected &&
                                    Math.abs(selected.ageAy - p.x) < 1e-9 &&
                                    Math.abs(selected.value - p.y) < 1e-9;

                                return (
                                    <Circle
                                        key={idx}
                                        cx={xToSvg(p.x)}
                                        cy={yToSvg(p.y)}
                                        r={isSel ? 7 : 5}
                                        fill="#ef4444"
                                        onPress={() => onPickPoint(p)}
                                    />
                                );
                            })}
                        </Svg>

                        <Text style={{ opacity: 0.7, marginTop: 6 }}>
                            Mavi: Referans (P50) • Kırmızı: Hasta ölçümleri (noktaya dokun)
                        </Text>
                    </View>

                    <View
                        style={{
                            borderWidth: 1,
                            borderRadius: 14,
                            padding: 12,
                            backgroundColor: "#f3f3f3",
                            gap: 6,
                        }}
                    >
                        {!selected ? (
                            <Text style={{ fontWeight: "700" }}>
                                Bir noktaya dokun → yaş/ölçüm/SDS bilgisi burada görünsün.
                            </Text>
                        ) : (
                            <>
                                <Text style={{ fontSize: 16, fontWeight: "900" }}>Seçili Nokta</Text>

                                <Text>
                                    <Text style={{ fontWeight: "800" }}>Ölçüm:</Text> {measureLabel(measure)}
                                </Text>

                                {/* ✅ Ay + (yaş/ay) */}
                                <Text>
                                    <Text style={{ fontWeight: "800" }}>Yaş:</Text>{" "}
                                    {Math.round(selected.ageAy)} ay ({ymdTrTextFromMonths(Math.round(selected.ageAy))})
                                </Text>

                                {/* ✅ Ziyaret tarihi TR */}
                                {selected.visitDate ? (
                                    <Text>
                                        <Text style={{ fontWeight: "800" }}>Ziyaret:</Text> {trDate(selected.visitDate)}
                                    </Text>
                                ) : null}

                                <Text>
                                    <Text style={{ fontWeight: "800" }}>Değer:</Text> {selected.value}
                                </Text>

                                {selected.p50 != null ? (
                                    <Text>
                                        <Text style={{ fontWeight: "800" }}>P50 (referans):</Text> {selected.p50.toFixed(2)}
                                    </Text>
                                ) : null}

                                {selected.sds != null ? (
                                    <Text>
                                        <Text style={{ fontWeight: "800" }}>SDS:</Text> {selected.sds.toFixed(2)}
                                    </Text>
                                ) : null}

                                <Pressable
                                    onPress={() => setSelected(null)}
                                    style={{
                                        marginTop: 6,
                                        borderWidth: 1,
                                        borderRadius: 12,
                                        paddingVertical: 10,
                                        alignItems: "center",
                                        backgroundColor: "white",
                                    }}
                                >
                                    <Text style={{ fontWeight: "800" }}>Seçimi Temizle</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}
