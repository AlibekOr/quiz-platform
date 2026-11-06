import { z } from "zod";
import {
  fullNameSchema,
  passwordSchema,
  usernameSchema,
} from "@/lib/validators/student";

// ADMIN paneli (ROLES.md §4, §6)

const regionIds = z.array(z.string().min(1).max(64)).max(50);

export const teacherCreateSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  password: passwordSchema,
  regionIds,
});
export type TeacherCreateInput = z.input<typeof teacherCreateSchema>;

export const teacherRegionsSchema = z.object({ regionIds });
export type TeacherRegionsInput = z.input<typeof teacherRegionsSchema>;
