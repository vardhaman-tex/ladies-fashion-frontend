import { z } from "zod";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
const MOBILE_REGEX = /^[+]?[0-9]{10,15}$/;

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  mobile: z
    .string()
    .optional()
    .refine((value) => !value || MOBILE_REGEX.test(value), "Enter a valid mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      PASSWORD_REGEX,
      "Password must include an uppercase letter, a number, and a special character"
    ),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
