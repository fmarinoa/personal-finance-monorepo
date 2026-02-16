import z, { ZodError } from "zod";
import { CategoryCode, CATEGORY_CODES, IExpense } from "@packages/core";

const schemaForCreate = z.object({
    amount: z.number().positive("Amount must be greater than zero"),
    description: z.string(),
    category: z.object({
        code: z.enum(CATEGORY_CODES),
    }),
});

const schemaForUpdate = z.object({
    id: z.string(),
    amount: z.number().positive("Amount must be greater than zero").optional(),
    description: z.string().optional(),
    category: z.object({
        code: z.enum(CATEGORY_CODES),
    }).optional(),
});

export class Expense implements IExpense {
    id!: string;
    amount!: number;
    description!: string;
    date!: Date;
    categoryCode!: CategoryCode;

    constructor(data: Partial<Expense>) {
        Object.assign(this, data);
    }

    static instanceForCreate(data: Partial<Expense>): Expense | ZodError {
        const { error } = schemaForCreate.safeParse(data);

        if (error) {
            return error;
        }

        return new Expense({
            ...data,
        });
    }

    static instanceForUpdate(data: Partial<Expense>): Expense | ZodError {
        const { error } = schemaForUpdate.safeParse(data);

        if (error) {
            return error;
        }

        return new Expense({
            ...data,
        });
    }

    getValuesForCreate(): (number | string)[] {
        if (!this.amount || !this.description || !this.categoryCode) {
            throw new Error("Missing required fields for creating an expense");
        }
        return [this.amount, this.description, this.categoryCode];
    }
    getValuesForUpdate(): (number | string)[] {
        return [
            this.id,
            this.amount ?? null,
            this.description ?? null,
            this.categoryCode ?? null,
        ]
    }
}
