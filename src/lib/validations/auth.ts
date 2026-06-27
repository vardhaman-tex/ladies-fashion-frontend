import { z } from "zod";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
const MOBILE_REGEX = /^[+]?[0-9]{10,15}$/;

// identifier = email address OR mobile number — backend resolves which one
export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .refine((v) => MOBILE_REGEX.test(v), "Enter a valid mobile number (10–15 digits)"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      PASSWORD_REGEX,
      "Password must include an uppercase letter, a number, and a special character"
    ),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
