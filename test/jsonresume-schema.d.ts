/* The package ships no types. Only the two things used here are declared. */
declare module '@jsonresume/schema' {
	export function validate(
		resume: unknown,
		callback: (errors: unknown[] | null, valid: boolean) => void,
	): void;
	export const schema: unknown;
}
