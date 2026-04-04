import { AppError } from '../common/appError';
import { GroupMember } from '../models/GroupMember';

export async function assertManager(groupId: number, userId: number, forbiddenMsg: string) {
  const m = await GroupMember.findOne({ groupId, userId });
  if (!m) {
    throw new AppError(403, 'Bạn không thuộc group này');
  }
  if (m.role !== 'MANAGER' || m.status !== 'APPROVED') {
    throw new AppError(403, forbiddenMsg);
  }
}

export async function assertMemberApproved(groupId: number, userId: number) {
  const m = await GroupMember.findOne({ groupId, userId });
  if (!m) {
    throw new AppError(403, 'Bạn không thuộc group này');
  }
  if (m.status !== 'APPROVED') {
    throw new AppError(403, 'Bạn chưa được duyệt vào group này');
  }
}

export async function assertGroupMember(groupId: number, userId: number) {
  const m = await GroupMember.findOne({ groupId, userId });
  if (!m) {
    throw new AppError(403, 'Bạn không phải là thành viên của nhóm này');
  }
  return m;
}

