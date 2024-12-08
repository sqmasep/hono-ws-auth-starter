import * as v from "valibot";

export const emailSchema = v.pipe(v.string(), v.email());
