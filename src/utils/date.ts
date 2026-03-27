export function trDate(iso: string) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
}
export function ageYmdFromIso(birthIso: string, ref: Date = new Date()) {
    // birthIso: "YYYY-MM-DD"
    const [by, bm, bd] = birthIso.split("-").map(Number);
    let y = ref.getFullYear() - by;
    let m = ref.getMonth() + 1 - bm;
    let d = ref.getDate() - bd;

    if (d < 0) {
        // önceki ayın gün sayısını al
        const prevMonthLastDay = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
        d += prevMonthLastDay;
        m -= 1;
    }
    if (m < 0) {
        m += 12;
        y -= 1;
    }
    if (y < 0) y = 0;

    return { y, m, d };
}

export function ageTrText(birthIso: string) {
    const { y, m, d } = ageYmdFromIso(birthIso);
    return `${y} yaş ${m} ay ${d} gün`;
}

export function ymdFromMonths(months: number) {
    const y = Math.floor(months / 12);
    const m = months % 12;
    return { y, m };
}

export function ymdTrTextFromMonths(months: number) {
    const { y, m } = ymdFromMonths(months);
    return `${y} yaş ${m} ay`;
}