import Papa from "papaparse";
import { BUYUME_VERI_CSV } from "./buyumeveriText";

type Row = {
    Olcum: string;
    Cinsiyet: string;
    YasAy: string;
    L: string;
    M: string;
    S: string;
};

type Lms = { yasAy: number; L: number; M: number; S: number };
let cache: Map<string, Lms[]> | null = null;

export async function loadLmsOnce() {
    if (cache) return;

    const parsed = Papa.parse<Row>(BUYUME_VERI_CSV, {
        header: true,
        skipEmptyLines: true,
    });

    const map = new Map<string, Lms[]>();

    for (const r of parsed.data) {
        if (!r?.Olcum) continue;

        const key = `${r.Olcum}|${r.Cinsiyet}`;
        const arr = map.get(key) ?? [];

        arr.push({
            yasAy: Number(r.YasAy),
            L: Number(r.L),
            M: Number(r.M),
            S: Number(r.S),
        });

        map.set(key, arr);
    }

    for (const arr of map.values()) arr.sort((a, b) => a.yasAy - b.yasAy);
    cache = map;
}

export function getLmsInterp(olcum: string, sex: "k" | "e", yasAy: number): Lms | null {
    if (!cache) return null;

    const key = `${olcum}|${sex === "e" ? "E" : "K"}`;
    const arr = cache.get(key);
    if (!arr || !arr.length) return null;

    if (yasAy <= arr[0].yasAy) return arr[0];
    if (yasAy >= arr[arr.length - 1].yasAy) return arr[arr.length - 1];

    for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i];
        const b = arr[i + 1];
        if (a.yasAy <= yasAy && yasAy <= b.yasAy) {
            const t = (yasAy - a.yasAy) / (b.yasAy - a.yasAy);
            return {
                yasAy,
                L: a.L + (b.L - a.L) * t,
                M: a.M + (b.M - a.M) * t,
                S: a.S + (b.S - a.S) * t,
            };
        }
    }
    return null;
}
