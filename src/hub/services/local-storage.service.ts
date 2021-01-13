export class LocalStorageService {

    setValue(key: string, value: string) {
        if (this.isSupported) {
            localStorage.setItem(key, value);
        }
    }

    getValue(key: string): string | null {
        return this.isSupported ? localStorage.getItem(key) : null;
    }

    private get isSupported(): boolean {
        try {
            const key = "__localStorage__access__test__";
            localStorage.setItem(key, key);
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }
}