export type GroupStatus = 'ACTIVE' | 'INACTIVE';
export type GroupRole = 'MANAGER' | 'MEMBER';
export type GroupMemberStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED';
export type GroupAuditActorRole = 'MANAGER' | 'MEMBER';

export type GroupAuditActionType =
  | 'GROUP_CREATED'
  | 'GROUP_UPDATED'
  | 'GROUP_CLOSED'
  | 'GROUP_REOPENED'
  | 'GROUP_DELETE'
  | 'GROUP_DELETED'
  | 'GROUP_MEMBER_JOIN_REQUESTED'
  | 'GROUP_MEMBER_APPROVED'
  | 'GROUP_MEMBER_REJECTED'
  | 'REGISTRATION_CREATED'
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'REGISTRATION_CANCELLED';

export type GroupAuditEntityType = 'GROUP' | 'GROUP_MEMBER' | 'REGISTRATION';

export type GroupMemberReviewAction = 'APPROVE' | 'REJECT';
