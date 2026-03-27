export function monthsBetween(birthIso: string, visitIso: string): number {
    const b = new Date(birthIso);
    const d = new Date(visitIso);

    let m =
        (d.getFullYear() - b.getFullYear()) * 12 +
        (d.getMonth() - b.getMonth());

    if (d.getDate() < b.getDate()) m -= 1;
    return Math.max(0, m);
}
