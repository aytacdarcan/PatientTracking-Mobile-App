import { db } from "../connection";

export type Visit = {
    id: number;
    patient_id: number;
    visit_date: string; // ISO YYYY-MM-DD
    height: number | null;
    weight: number | null;
    head_circ: number | null;
    note: string | null;
};

export async function listVisits(patientId: number): Promise<Visit[]> {
    return (await db.getAllAsync<Visit>(
        "SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date DESC, id DESC;",
        [patientId]
    )) ?? [];
}

export async function createVisit(v: {
    patient_id: number;
    visit_date: string;
    height: number | null;
    weight: number | null;
    head_circ: number | null;
    note: string | null;
}): Promise<void> {
    await db.runAsync(
        `INSERT INTO visits (patient_id, visit_date, height, weight, head_circ, note)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [v.patient_id, v.visit_date, v.height, v.weight, v.head_circ, v.note]
    );
}

export async function getVisit(id: number): Promise<Visit | null> {
    const row = await db.getFirstAsync<Visit>(
        "SELECT * FROM visits WHERE id = ?;",
        [id]
    );
    return row ?? null;
}

export async function updateVisit(v: {
    id: number;
    visit_date: string;
    height: number | null;
    weight: number | null;
    head_circ: number | null;
    note: string | null;
}): Promise<void> {
    await db.runAsync(
        `UPDATE visits
     SET visit_date = ?, height = ?, weight = ?, head_circ = ?, note = ?
     WHERE id = ?;`,
        [v.visit_date, v.height, v.weight, v.head_circ, v.note, v.id]
    );
}

export async function deleteVisit(id: number): Promise<void> {
    await db.runAsync("DELETE FROM visits WHERE id = ?;", [id]);
}
