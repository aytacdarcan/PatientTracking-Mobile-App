import { db } from "../connection";

export type Sex = "k" | "e";

export type Patient = {
    id: number;
    tc: string;
    first_name: string;
    last_name: string;
    birth_date: string; // ISO YYYY-MM-DD
    sex: Sex;
    phone: string | null;
};

export async function listPatients(q: string = ""): Promise<Patient[]> {
    const query = (q || "").trim();
    if (!query) {
        return (await db.getAllAsync<Patient>(
            "SELECT * FROM patients ORDER BY id DESC;"
        )) ?? [];
    }

    const like = `%${query}%`;
    return (await db.getAllAsync<Patient>(
        `SELECT * FROM patients
         WHERE tc LIKE ? OR first_name LIKE ? OR last_name LIKE ?
         ORDER BY id DESC;`,
        [like, like, like]
    )) ?? [];
}

export async function getPatient(id: number): Promise<Patient | null> {
    const row = await db.getFirstAsync<Patient>(
        "SELECT * FROM patients WHERE id = ?;",
        [id]
    );
    return row ?? null;
}

export async function createPatient(p: {
    tc: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    sex: Sex;
    phone: string | null;
}): Promise<void> {
    await db.runAsync(
        `INSERT INTO patients (tc, first_name, last_name, birth_date, sex, phone)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [p.tc, p.first_name, p.last_name, p.birth_date, p.sex, p.phone]
    );
}

export async function updatePatient(p: {
    id: number;
    tc: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    sex: Sex;
    phone: string | null;
}): Promise<void> {
    await db.runAsync(
        `UPDATE patients
         SET tc = ?, first_name = ?, last_name = ?, birth_date = ?, sex = ?, phone = ?
         WHERE id = ?;`,
        [p.tc, p.first_name, p.last_name, p.birth_date, p.sex, p.phone, p.id]
    );
}

export async function deletePatient(id: number): Promise<void> {
    // önce visits, sonra patient (FK cascade yoksa şart)
    await db.runAsync("DELETE FROM visits WHERE patient_id = ?;", [id]);
    await db.runAsync("DELETE FROM patients WHERE id = ?;", [id]);
}
