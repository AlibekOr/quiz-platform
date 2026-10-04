export type GroupOption = { id: string; name: string };

export type StudentRow = {
  id: string;
  fullName: string;
  username: string;
  isActive: boolean;
  groupId: string | null;
  groupName: string | null;
};
