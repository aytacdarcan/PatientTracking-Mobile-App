export function xFromLms(z: number, L: number, M: number, S: number): number {
    if (L === 0) return M * Math.exp(S * z);
    return M * Math.pow(1 + L * S * z, 1 / L);
}
export function calcSds(x: number, L: number, M: number, S: number): number {
    if (L === 0) {
        return Math.log(x / M) / S;
    }
    return (Math.pow(x / M, L) - 1) / (L * S);
}
