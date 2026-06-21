export function stripSuffixId(rawId: string): string {
    if (!rawId || typeof rawId !== 'string') return rawId;
    const idx = rawId.indexOf('::');
    if (idx === -1) return rawId;
    return rawId.slice(0, idx);
}

export function looksLikeUuid(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    // basic UUID v4-ish pattern (supports lowercase/uppercase)
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}
