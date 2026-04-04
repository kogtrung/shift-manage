import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { GroupMember } from '../models/GroupMember';
import { Position } from '../models/Position';
import { SalaryConfig } from '../models/SalaryConfig';
import { User } from '../models/User';
import { getNextSequence } from './sequenceService';
import { assertManager } from './membership';

function toDto(c: {
  id: number;
  groupId: number;
  positionId?: number;
  userId?: number;
  hourlyRate: number;
  effectiveDate: string;
}) {
  return {
    id: c.id,
    groupId: c.groupId,
    positionId: c.positionId ?? null,
    userId: c.userId ?? null,
    hourlyRate: c.hourlyRate,
    effectiveDate: c.effectiveDate,
  };
}

/** Mức lương/giờ áp dụng cho ca theo ngày `shiftDate` (ưu tiên user > position trong cùng mốc hiệu lực). */
export async function resolveHourlyRate(
  groupId: number,
  userId: number,
  positionId: number,
  shiftDate: string
): Promise<number> {
  const eligible = await SalaryConfig.find({
    groupId,
    effectiveDate: { $lte: shiftDate },
  }).lean();
  if (!eligible.length) return 0;
  let maxEff = '';
  for (const c of eligible) {
    if (c.effectiveDate > maxEff) maxEff = c.effectiveDate;
  }
  const at = eligible.filter((c) => c.effectiveDate === maxEff);
  const userCfg = at.find((c) => c.userId === userId);
  if (userCfg) return userCfg.hourlyRate;
  const posCfg = at.find((c) => c.positionId === positionId);
  if (posCfg) return posCfg.hourlyRate;
  return 0;
}

export const salaryConfigService = {
  async listConfigs(username: string, groupId: number) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    const g = await Group.findOne({ id: groupId });
    if (!g) throw new AppError(404, 'Không tìm thấy nhóm');
    await assertManager(groupId, user.id, 'Chỉ Quản lý mới xem cấu hình lương');

    const rows = await SalaryConfig.find({ groupId }).sort({ effectiveDate: -1, id: -1 }).lean();
    return rows.map((r) => toDto(r));
  },

  async createConfig(
    username: string,
    groupId: number,
    body: {
      userId?: number;
      positionId?: number;
      hourlyRate: number;
      effectiveDate: string;
    }
  ) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    const g = await Group.findOne({ id: groupId });
    if (!g) throw new AppError(404, 'Không tìm thấy nhóm');
    await assertManager(groupId, user.id, 'Chỉ Quản lý mới thêm cấu hình lương');

    if (body.positionId != null) {
      const pos = await Position.findOne({ id: body.positionId, groupId });
      if (!pos) throw new AppError(400, 'Vị trí không thuộc nhóm');
    }
    if (body.userId != null) {
      const m = await GroupMember.findOne({ groupId, userId: body.userId, status: 'APPROVED' });
      if (!m) throw new AppError(400, 'Người dùng không phải thành viên đã duyệt trong nhóm');
    }

    const id = await getNextSequence('SalaryConfig');
    await SalaryConfig.create({
      id,
      groupId,
      positionId: body.positionId,
      userId: body.userId,
      hourlyRate: body.hourlyRate,
      effectiveDate: body.effectiveDate,
    });
    const row = await SalaryConfig.findOne({ id }).lean();
    if (!row) throw new AppError(500, 'Lỗi tạo cấu hình');
    return toDto(row);
  },

  async deleteConfig(username: string, groupId: number, configId: number) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    const g = await Group.findOne({ id: groupId });
    if (!g) throw new AppError(404, 'Không tìm thấy nhóm');
    await assertManager(groupId, user.id, 'Chỉ Quản lý mới xóa cấu hình lương');

    const cfg = await SalaryConfig.findOne({ id: configId, groupId });
    if (!cfg) throw new AppError(404, 'Không tìm thấy cấu hình lương');
    await SalaryConfig.deleteOne({ id: configId });
  },
};
