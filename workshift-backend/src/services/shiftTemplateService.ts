import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { Position } from '../models/Position';
import { ShiftTemplate } from '../models/ShiftTemplate';
import { TemplateRequirement } from '../models/TemplateRequirement';
import { User } from '../models/User';
import { getNextSequence } from './sequenceService';
import { assertManager, assertMemberApproved } from './membership';
import { normalizeTimeString, timeToSeconds } from '../utils/time';

type ReqItem = { positionId: number; quantity: number };

function toTemplateResponse(
  tpl: { id: number; groupId: number; name: string; startTime: string; endTime: string; description?: string },
  reqs: Array<{ id: number; positionId: number; quantity: number }>,
  positionMap: Map<number, { name: string; colorCode?: string }>
) {
  const requirements = reqs.map((r) => {
    const pos = positionMap.get(r.positionId);
    return {
      id: r.id,
      positionId: r.positionId,
      positionName: pos?.name ?? '',
      positionColorCode: pos?.colorCode ?? null,
      quantity: r.quantity,
    };
  });
  return {
    id: tpl.id,
    groupId: tpl.groupId,
    name: tpl.name,
    startTime: tpl.startTime,
    endTime: tpl.endTime,
    description: tpl.description ?? null,
    requirements,
  };
}

export const shiftTemplateService = {
  async createTemplate(
    username: string,
    groupId: number,
    body: {
      name: string;
      startTime: string;
      endTime: string;
      description?: string;
      requirements?: ReqItem[];
    }
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await assertManager(groupId, user.id, 'Bạn không có quyền quản lý ca mẫu');

    const group = await Group.findOne({ id: groupId });
    if (!group) {
      throw new AppError(404, 'Không tìm thấy group');
    }

    const st = normalizeTimeString(body.startTime);
    const et = normalizeTimeString(body.endTime);
    if (timeToSeconds(et) <= timeToSeconds(st)) {
      throw new AppError(400, 'Giờ kết thúc phải sau giờ bắt đầu');
    }

    const trimmedName = body.name.trim();
    const dup = await ShiftTemplate.findOne({ groupId, name: trimmedName });
    if (dup) {
      throw new AppError(409, 'Tên ca mẫu đã tồn tại trong group');
    }

    const id = await getNextSequence('ShiftTemplate');
    await ShiftTemplate.create({
      id,
      groupId,
      name: trimmedName,
      startTime: st,
      endTime: et,
      description: body.description?.trim() || undefined,
    });

    const savedReqs: Array<{ id: number; positionId: number; quantity: number }> = [];
    if (body.requirements?.length) {
      for (const item of body.requirements) {
        const pos = await Position.findOne({ id: item.positionId, groupId });
        if (!pos) {
          throw new AppError(404, `Không tìm thấy vị trí: ${item.positionId}`);
        }
        const rid = await getNextSequence('TemplateRequirement');
        await TemplateRequirement.create({
          id: rid,
          templateId: id,
          positionId: item.positionId,
          quantity: item.quantity,
        });
        savedReqs.push({ id: rid, positionId: item.positionId, quantity: item.quantity });
      }
    }

    const posIds = [...new Set(savedReqs.map((r) => r.positionId))];
    const positions = await Position.find({ id: { $in: posIds } }).lean();
    const pmap = new Map(positions.map((p) => [p.id, { name: p.name, colorCode: p.colorCode }]));

    return toTemplateResponse(
      {
        id,
        groupId,
        name: trimmedName,
        startTime: st,
        endTime: et,
        description: body.description?.trim(),
      },
      savedReqs,
      pmap
    );
  },

  async getTemplates(username: string, groupId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await assertMemberApproved(groupId, user.id);

    const templates = await ShiftTemplate.find({ groupId }).sort({ id: 1 }).lean();
    const out = [];
    for (const t of templates) {
      const reqs = await TemplateRequirement.find({ templateId: t.id }).lean();
      const posIds = reqs.map((r) => r.positionId);
      const positions = await Position.find({ id: { $in: posIds } }).lean();
      const pmap = new Map(positions.map((p) => [p.id, { name: p.name, colorCode: p.colorCode }]));
      out.push(
        toTemplateResponse(
          {
            id: t.id,
            groupId: t.groupId,
            name: t.name,
            startTime: t.startTime,
            endTime: t.endTime,
            description: t.description,
          },
          reqs.map((r) => ({ id: r.id, positionId: r.positionId, quantity: r.quantity })),
          pmap
        )
      );
    }
    return out;
  },

  async updateTemplate(
    username: string,
    groupId: number,
    templateId: number,
    body: {
      name: string;
      startTime: string;
      endTime: string;
      description?: string;
      requirements?: ReqItem[];
    }
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await assertManager(groupId, user.id, 'Bạn không có quyền quản lý ca mẫu');

    const template = await ShiftTemplate.findOne({ id: templateId, groupId });
    if (!template) {
      throw new AppError(404, 'Không tìm thấy ca mẫu');
    }

    const st = normalizeTimeString(body.startTime);
    const et = normalizeTimeString(body.endTime);
    if (timeToSeconds(et) <= timeToSeconds(st)) {
      throw new AppError(400, 'Giờ kết thúc phải sau giờ bắt đầu');
    }

    const trimmedName = body.name.trim();
    const dup = await ShiftTemplate.findOne({
      groupId,
      name: trimmedName,
      id: { $ne: templateId },
    });
    if (dup) {
      throw new AppError(409, 'Tên ca mẫu đã tồn tại trong group');
    }

    template.name = trimmedName;
    template.startTime = st;
    template.endTime = et;
    template.description = body.description?.trim() || undefined;
    await template.save();

    await TemplateRequirement.deleteMany({ templateId });

    const savedReqs: Array<{ id: number; positionId: number; quantity: number }> = [];
    if (body.requirements?.length) {
      for (const item of body.requirements) {
        const pos = await Position.findOne({ id: item.positionId, groupId });
        if (!pos) {
          throw new AppError(404, `Không tìm thấy vị trí: ${item.positionId}`);
        }
        const rid = await getNextSequence('TemplateRequirement');
        await TemplateRequirement.create({
          id: rid,
          templateId,
          positionId: item.positionId,
          quantity: item.quantity,
        });
        savedReqs.push({ id: rid, positionId: item.positionId, quantity: item.quantity });
      }
    }

    const posIds = [...new Set(savedReqs.map((r) => r.positionId))];
    const positions = await Position.find({ id: { $in: posIds } }).lean();
    const pmap = new Map(positions.map((p) => [p.id, { name: p.name, colorCode: p.colorCode }]));

    return toTemplateResponse(
      {
        id: template.id,
        groupId,
        name: template.name,
        startTime: template.startTime,
        endTime: template.endTime,
        description: template.description,
      },
      savedReqs,
      pmap
    );
  },

  async deleteTemplate(username: string, groupId: number, templateId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await assertManager(groupId, user.id, 'Bạn không có quyền quản lý ca mẫu');

    const template = await ShiftTemplate.findOne({ id: templateId, groupId });
    if (!template) {
      throw new AppError(404, 'Không tìm thấy ca mẫu');
    }

    await TemplateRequirement.deleteMany({ templateId });
    await ShiftTemplate.deleteOne({ id: templateId });
  },
};
