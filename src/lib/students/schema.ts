import { z } from "zod";

export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Ism kamida 2 belgi")
  .max(100, "Ism 100 belgidan oshmasin");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Login kamida 3 belgi")
  .max(32, "Login 32 belgidan oshmasin")
  .regex(
    USERNAME_PATTERN,
    "Login faqat lotin harflari, raqam, '.', '_' va '-' dan iborat bo'lsin",
  );

export const passwordSchema = z
  .string()
  .min(6, "Parol kamida 6 belgi")
  .max(72, "Parol 72 belgidan oshmasin");

export const groupNameSchema = z
  .string()
  .trim()
  .min(1, "Guruh nomini kiriting")
  .max(64, "Guruh nomi 64 belgidan oshmasin");
