/**
 * Selects a random element from the array;
 * 
 * @param arr 
 */
export function Random<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
