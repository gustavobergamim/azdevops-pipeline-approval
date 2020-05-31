export class LocalStorageService {

    setValue(key: string, value: string) {
        localStorage.setItem(key, value);
    }

    getValue(key: string): string | null {
        return localStorage.getItem(key);
    }
}