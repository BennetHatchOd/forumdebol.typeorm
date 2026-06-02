export function isDbId(id: string): number|null {
    const idDB = Number(id);
    if (!Number.isInteger(idDB) || idDB < 1) return null;
    return idDB;
}