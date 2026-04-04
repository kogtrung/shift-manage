function requireEnv(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    throw new Error(`Biến môi trường bắt buộc: ${name}`);
  }
  return v;
}

export function loadAuthEnv() {
  return {
    JWT_SECRET: requireEnv('JWT_SECRET'),
    JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
    JWT_ISSUER: process.env.JWT_ISSUER || 'workshift-backend',
    JWT_EXPIRES_IN_SECONDS: Number(process.env.JWT_EXPIRES_IN_SECONDS || 86400),
    JWT_REFRESH_EXPIRES_IN_SECONDS: Number(process.env.JWT_REFRESH_EXPIRES_IN_SECONDS || 2592000),
  };
}
