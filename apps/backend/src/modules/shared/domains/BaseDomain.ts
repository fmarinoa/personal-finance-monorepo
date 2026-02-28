export abstract class BaseDomain<T> {
  updateFromExisting(existing: T): void {
    const patch = Object.fromEntries(
      Object.entries(this).filter(([, v]) => v !== undefined),
    );

    Object.assign(this, {
      ...existing,
      ...patch,
    });
  }
}
