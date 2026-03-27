declare module "expo-file-system" {
    export const documentDirectory: string | null;
    export const bundleDirectory: string | null;

    export function readAsStringAsync(
        fileUri: string,
        options?: any
    ): Promise<string>;

    export function copyAsync(options: {
        from: string;
        to: string;
    }): Promise<void>;
}
